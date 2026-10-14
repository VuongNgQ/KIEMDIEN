import crypto from 'node:crypto';

const required = name => {const value=process.env[name];if(!value)throw Error(`Thiếu biến máy chủ ${name}`);return value;};
const key = () => required('VUONQ_JWT_SECRET');
function signature(payload) {return crypto.createHmac('sha256',key()).update(payload).digest('base64url');}
function token(user) {const raw=Buffer.from(JSON.stringify({...user,exp:Math.floor(Date.now()/1000)+8*3600})).toString('base64url');return `${raw}.${signature(raw)}`;}
function userFrom(headers) {
  const bearer=(headers.authorization||headers.Authorization||'').replace(/^Bearer /i,'');
  const [raw,sig]=bearer.split('.');
  if(!raw||!sig)throw Error('Cần đăng nhập lại.');
  const expected=signature(raw),a=Buffer.from(expected),b=Buffer.from(sig);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw Error('Phiên đăng nhập không hợp lệ.');
  const user=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
  if(user.exp<=Date.now()/1000||!['admin','student'].includes(user.role))throw Error('Phiên đăng nhập hết hạn.');
  if(user.role==='student'&&!user.className)throw Error('Phiên đăng nhập không hợp lệ.');
  return user;
}
function constantEqual(a,b) {const x=crypto.createHash('sha256').update(String(a)).digest();const y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y);}
async function supabase(path,{method='GET',body,query}={}) {
  const base=required('SUPABASE_URL').replace(/\/rest\/v1\/?$/, '');const secret=required('SUPABASE_SERVICE_ROLE_KEY');
  const url=new URL(`${base.replace(/\/$/,'')}/rest/v1/${path}`);
  if(query)for(const [key,value] of Object.entries(query))url.searchParams.set(key,value);
  const authHeaders = { apikey: secret };
  // Legacy service_role là JWT, còn sb_secret là API key không phải JWT.
  if (!secret.startsWith('sb_secret_')) authHeaders.Authorization = `Bearer ${secret}`;
  const res=await fetch(url,{method,headers:{...authHeaders,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await res.text();let json;try{json=JSON.parse(text)}catch{json={message:text}}
  if(!res.ok)throw Error(json?.message||`Supabase HTTP ${res.status}`);
  return json;
}
function nowVN() {const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(new Date());const obj=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${obj.year}-${obj.month}-${obj.day}`,weekday:obj.weekday};}
const json=(status,body)=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'same-origin'},body:JSON.stringify(body)});
export async function handler(event) {
  try {
    const action=event.queryStringParameters?.action||'';
    const payload=event.body?JSON.parse(event.body):{};
    if(action==='login'){
      const username=String(payload.username||'').trim();const pin=String(payload.pin||'');
      if(!username||!pin||username.length>64||pin.length>80)return json(400,{ok:false,error:'Nhập username và PIN hợp lệ.'});
      let user;
      if(constantEqual(username.toLowerCase(),required('VUONQ_ADMIN_USERNAME').toLowerCase())&&constantEqual(pin,required('VUONQ_ADMIN_PIN')))user={role:'admin',username};
      else {
        const matched=await supabase('rpc/vuonq_login_class',{method:'POST',body:{p_username:username,p_pin:pin}});
        if(matched?.length)user={role:'student',className:matched[0].class_name};
      }
      if(!user)return json(401,{ok:false,error:'Tên đăng nhập hoặc PIN không đúng.'});
      return json(200,{ok:true,user,token:token(user)});
    }
    const user=userFrom(event.headers||{});
    if(action==='records') {
      const query={select:'id,date,session,class_name,absent,absent_names,created_at',order:'date.desc',limit:'10000'};
      if(user.role==='student')query.class_name=`eq.${user.className}`;
      const rows=await supabase('vuonq_attendance',{query});
      return json(200,{ok:true,records:rows.map(r=>({id:r.id,date:r.date,session:r.session,className:r.class_name,absent:r.absent,absentNames:r.absent_names,createdAt:r.created_at}))});
    }
    if(action==='save-record') {
      if(user.role!=='student')return json(403,{ok:false,error:'Chỉ lớp học được gửi phiếu.'});
      const session=payload.session;const absent=payload.absent;const names=payload.absentNames;
      if(!['morning','afternoon'].includes(session)||!Number.isInteger(absent)||absent<0||!Array.isArray(names)||names.length!==absent||names.some(n=>typeof n!=='string'||!n.trim()||n.length>100))return json(400,{ok:false,error:'Dữ liệu kiểm diện không hợp lệ.'});
      if(new Set(names.map(n=>n.trim().toLocaleLowerCase('vi-VN'))).size!==names.length)return json(400,{ok:false,error:'Họ tên học sinh vắng bị trùng.'});
      const today=nowVN();if(today.weekday==='Sun')return json(400,{ok:false,error:'Không nhận kiểm diện Chủ nhật.'});
      const classRows=await supabase('vuonq_classes',{query:{select:'size',name:`eq.${user.className}`,limit:'1'}});
      if(!classRows.length||absent>classRows[0].size)return json(400,{ok:false,error:'Số vắng vượt sĩ số.'});
      const id=`${today.date}|${session}|${user.className}`;
      const rows=await supabase('vuonq_attendance',{method:'POST',query:{on_conflict:'id'},body:{id,date:today.date,session,class_name:user.className,absent,absent_names:names.map(n=>n.trim().replace(/\s+/g,' '))}});
      // PostgREST upsert needs Prefer resolution=merge-duplicates, supplied separately below
      const r=rows[0];return json(200,{ok:true,record:{id:r.id,date:r.date,session:r.session,className:r.class_name,absent:r.absent,absentNames:r.absent_names,createdAt:r.created_at}});
    }
    if(user.role!=='admin')return json(403,{ok:false,error:'Chỉ quản trị viên được thực hiện.'});
    if(action==='accounts'){
      const rows=await supabase('vuonq_classes',{query:{select:'name,username',order:'name.asc'}});
      const accounts=Object.fromEntries(rows.map(r=>[r.name,{username:r.username,pin:''}]));
      return json(200,{ok:true,accounts});
    }
    if(action==='update-account') {
      const className=String(payload.className||'');const username=String(payload.username||'').trim();const pin=String(payload.pin||'');
      if(!className||!username||username.length>64||pin.length<4||pin.length>80)return json(400,{ok:false,error:'Tài khoản hoặc PIN không hợp lệ.'});
      if(username.toLowerCase()===required('VUONQ_ADMIN_USERNAME').toLowerCase())return json(400,{ok:false,error:'Username trùng admin.'});
      await supabase('rpc/vuonq_update_credentials',{method:'POST',body:{p_class_name:className,p_username:username,p_pin:pin}});
      return json(200,{ok:true});
    }
    return json(404,{ok:false,error:'API không tồn tại.'});
  }catch(error){console.error('VUONQ API',error.message);return json(500,{ok:false,error: error.message.startsWith('Thiếu biến')?'Máy chủ chưa được cấu hình đầy đủ.':'Yêu cầu thất bại. Kiểm tra API và cấu hình Supabase.'});}
}
