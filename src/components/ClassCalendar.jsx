import React, { useMemo, useState } from 'react';
import { DAYS, SESSION_LABEL, dateKey, dateLabel } from '../data';
import { ACADEMIC_YEARS, datesForAcademicWeek, findAcademicWeek, WEEKS_PER_TERM } from '../academic';
export default function ClassCalendar({ className, records }) {
  const initial = findAcademicWeek();
  const [year,setYear]=useState(initial.year);
  const [term,setTerm]=useState(initial.term);
  const [week,setWeek]=useState(initial.week);
  const days=useMemo(()=>datesForAcademicWeek(year,term,week),[year,term,week]);
  const byId=useMemo(()=>new Map(records.map(r=>[r.id,r])),[records]);
  const [chosen,setChosen]=useState(null);
  return <main className="page-width admin-page"><div className="admin-intro"><div><span className="eyebrow navy">LỊCH KIỂM DIỆN CỦA LỚP</span><h1>Lớp {className}</h1><p>Chỉ xem phiếu kiểm diện của lớp mình, từ thứ Hai đến thứ Bảy.</p></div></div>
    <section className="panel calendar-panel"><div className="calendar-tools"><div><h2>Theo dõi kiểm diện</h2><p>{dateLabel(days[0])} — {dateLabel(days[5])}</p></div><div className="tool-actions academic-controls"><select aria-label="Năm học" value={year} onChange={e=>{setYear(e.target.value);setWeek(1);}}>{Object.keys(ACADEMIC_YEARS).map(y=><option key={y}>{y}</option>)}</select><select aria-label="Học kỳ" value={term} onChange={e=>{setTerm(e.target.value);setWeek(1);}}><option value="1">Học kỳ I</option><option value="2">Học kỳ II</option></select><select aria-label="Tuần" value={week} onChange={e=>setWeek(Number(e.target.value))}>{Array.from({length:WEEKS_PER_TERM},(_,i)=><option key={i} value={i+1}>Tuần {i+1}</option>)}</select></div></div>
    <div className="table-scroll"><table className="attendance-table"><thead><tr><th>NGÀY</th><th>BUỔI SÁNG</th><th>BUỔI CHIỀU</th></tr></thead><tbody>{days.map((d,i)=><tr key={i}><th>{DAYS[i]}<small>{dateLabel(d)}</small></th>{['morning','afternoon'].map(s=>{const r=byId.get(`${dateKey(d)}|${s}|${className}`);return <td key={s}><button className={`cell-status ${!r?'empty':r.absent?'has-absent':'perfect'}`} onClick={()=>setChosen({r,d,s})}>{r?`Vắng ${r.absent}`:'Chưa gửi'}</button></td>;})}</tr>)}</tbody></table></div>
    <p className="table-footnote">Nhấn vào từng buổi để xem chi tiết. Dữ liệu chỉ hiển thị trong phạm vi lớp đang đăng nhập.</p></section>
    {chosen&&<div className="modal-backdrop" onClick={()=>setChosen(null)}><div className="modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><div className="modal-top"><h2>Chi tiết {dateLabel(chosen.d)}</h2><button className="close-modal" onClick={()=>setChosen(null)}>×</button></div><p><strong>{SESSION_LABEL[chosen.s]}</strong></p>{chosen.r?<><p>Vắng: <strong>{chosen.r.absent}</strong> học sinh</p><p>Họ tên: {chosen.r.absentNames?.join(', ')||'Không có'}</p><p>Gửi lúc: {new Date(chosen.r.createdAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p></>:<p>Chưa có phiếu kiểm diện.</p>}<button className="primary-button" onClick={()=>setChosen(null)}>Đóng</button></div></div>}
  </main>;
}
