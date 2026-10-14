export const ONLINE_MODE = import.meta.env.VITE_API_MODE === 'online';
const BASE = '/api/attendance';
export async function apiRequest(action, payload) {
  const token = sessionStorage.getItem('vuonq_token');
  let response;
  try {
    response=await fetch(`${BASE}?action=${encodeURIComponent(action)}`, {
      method:action==='records'||action==='accounts'?'GET':'POST',
      headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
      body:action==='records'||action==='accounts'?undefined:JSON.stringify(payload||{}),
    });
  }catch {throw new Error('Không thể kết nối API. Kiểm tra Vercel hoặc kết nối mạng.');}
  let json;
  try {json=await response.json();}catch {throw new Error('Máy chủ không trả về JSON. Bạn có đang chạy npm run dev mà chưa dùng Vercel Dev không?');}
  if(!response.ok||!json.ok)throw new Error(json.error||`Lỗi HTTP ${response.status}`);
  return json;
}
