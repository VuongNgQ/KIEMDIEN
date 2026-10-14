import { DAYS, SESSION_LABEL, dateKey } from './data';
function esc(value) {return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function cell(value, style='body') {return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${esc(value)}</Data></Cell>`;}
function row(values, style='body') {return `<Row>${values.map(v=>cell(v,style)).join('')}</Row>`;}
function sheet(name, body, columns) {return `<Worksheet ss:Name="${esc(name)}"><Table>${columns.map(w=>`<Column ss:Width="${w}"/>`).join('')}${body}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal/><TopRowBottomPane>4</TopRowBottomPane></WorksheetOptions></Worksheet>`;}
export function exportWeekExcel({year,term,week,days,classes,records}) {
  const byId=new Map(records.map(r=>[r.id,r]));
  const summary=[row(['TRƯỜNG THPT NGUYỄN ĐÌNH CHIỂU · VUONQ'],'title'),row([`BẢNG KIỂM DIỆN · NĂM HỌC ${year} · HỌC KỲ ${term} · TUẦN ${week}`],'subtitle'),row([`Từ ${days[0].toLocaleDateString('vi-VN')} đến ${days[5].toLocaleDateString('vi-VN')}`],'subtitle')];
  const headers=['LỚP','SĨ SỐ',...DAYS.flatMap(d=>[`${d} SÁNG`,`${d} CHIỀU`]),'TỔNG LƯỢT VẮNG'];
  summary.push(row(headers,'header'));
  const details=[row(['DANH SÁCH PHIẾU VÀ HỌC SINH VẮNG'],'title'),row([`Năm học ${year} · Học kỳ ${term} · Tuần ${week}`],'subtitle'),row(['Để trống: chưa có phiếu. 0: đã điểm danh, không vắng.'],'subtitle'),row(['Ngày','Buổi','Lớp','Sĩ số','Số vắng','Họ tên học sinh vắng','Thời gian ghi nhận'],'header')];
  for (let i=0;i<classes.length;i++) {
    const item=classes[i];let total=0;
    const values=[item.name,item.size];
    for (const d of days) for (const session of ['morning','afternoon']) {
      const record=byId.get(`${dateKey(d)}|${session}|${item.name}`);
      values.push(record?record.absent:'');
      if(record){total+=Number(record.absent||0);details.push(row([dateKey(d),SESSION_LABEL[session],item.name,item.size,record.absent,(record.absentNames||[]).join('; '),record.createdAt?new Date(record.createdAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):''],i%2?'stripe':'body'));}
    }
    values.push(total);summary.push(row(values,i%2?'stripe':'body'));
  }
  const xml=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="body"><Font ss:FontName="Calibri" ss:Size="11"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DDE6EF"/></Borders></Style><Style ss:ID="stripe"><Font ss:FontName="Calibri" ss:Size="11"/><Interior ss:Color="#EEF5FC" ss:Pattern="Solid"/></Style><Style ss:ID="header"><Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#145080" ss:Pattern="Solid"/><Alignment ss:WrapText="1" ss:Horizontal="Center"/></Style><Style ss:ID="title"><Font ss:FontName="Calibri" ss:Size="17" ss:Bold="1" ss:Color="#145080"/></Style><Style ss:ID="subtitle"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4D6075"/></Style></Styles>${sheet('Lịch tuần',summary.join(''),[100,70,...Array(12).fill(92),120])}${sheet('Chi tiết học sinh vắng',details.join(''),[105,100,90,65,70,360,170])}</Workbook>`;
  const blob=new Blob(['\ufeff',xml],{type:'application/vnd.ms-excel;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`VUONQ_${year}_HK${term}_Tuan${week}.xls`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
