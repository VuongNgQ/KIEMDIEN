import React, { useMemo, useState } from 'react';
import { ACADEMIC_YEARS, datesForAcademicWeek, findAcademicWeek, WEEKS_PER_TERM } from '../academic';
import { exportWeekExcel } from '../excelExport';
import {
  CLASS_DATA,
  DAYS,
  SESSION_LABEL,
  dateKey,
  dateLabel,
  weekDays,
} from '../data';

export default function AdminDashboard({ records, accounts, onUpdateAccount }) {
  const [tab, setTab] = useState('calendar');
  const initial = findAcademicWeek();
  const [year,setYear]=useState(initial.year);
  const [term,setTerm]=useState(initial.term);
  const [week,setWeek]=useState(initial.week);
  const [grade, setGrade] = useState('all');
  const [selected, setSelected] = useState(null);
  const [accountFilter, setAccountFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editError, setEditError] = useState('');
  const [notice, setNotice] = useState('');

  const days = useMemo(() => datesForAcademicWeek(year,term,week), [year,term,week]);
  const classes = CLASS_DATA.filter((item) => grade === 'all' || item.grade === grade);
  const byId = useMemo(() => new Map(records.map((item) => [item.id, item])), [records]);
  const covered = classes.reduce((sum, item) => sum + days.reduce((n, day) =>
    n + ['morning', 'afternoon'].filter((session) => byId.has(`${dateKey(day)}|${session}|${item.name}`)).length, 0), 0);
  const absence = classes.reduce((sum, item) => sum + days.reduce((n, day) =>
    n + ['morning', 'afternoon'].reduce((a, session) =>
      a + (byId.get(`${dateKey(day)}|${session}|${item.name}`)?.absent || 0), 0), 0), 0);
  const filteredAccounts = CLASS_DATA.filter((item) =>
    `${item.name} ${accounts[item.name]?.username}`.toLowerCase().includes(accountFilter.trim().toLowerCase()));

  function beginEdit(item) {
    setEditing(item.name);
    setEditUsername(accounts[item.name].username);
    setEditPin('');
    setEditError('');
    setNotice('');
  }

  async function submitEdit(event) {
    event.preventDefault();
    const loginName = editUsername.trim();
    if (!loginName || !editPin.trim()) {
      return setEditError('Username và PIN không được để trống.');
    }
    if (loginName.toLowerCase() === 'admin') {
      return setEditError('Không được đặt username là admin.');
    }
    const collision = CLASS_DATA.some((item) => item.name !== editing &&
      accounts[item.name]?.username?.toLowerCase() === loginName.toLowerCase());
    if (collision) return setEditError('Username đã được sử dụng bởi lớp khác.');
    if (editPin.length < 4) return setEditError('PIN phải có ít nhất 4 ký tự.');
    try { await onUpdateAccount(editing, { username: loginName, pin: editPin });
      setNotice(`Đã cập nhật tài khoản lớp ${editing}.`);setEditing(null);
    } catch(error){setEditError(error.message);}
  }

  return (
    <main className="page-width admin-page">
      <div className="admin-intro">
        <div><span className="eyebrow navy">TRANG QUẢN TRỊ · VUONQ</span>
          <h1>Tổng hợp kiểm diện</h1>
          <p>73 lớp · Thứ Hai đến Thứ Bảy · Buổi sáng và chiều · Học kỳ {term} · Tuần {week} · {year}.</p>
        </div>
        <div className="admin-tag">Lọc theo năm học · học kỳ · tuần</div>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>▦ Lịch kiểm diện</button>
        <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>♙ Tài khoản lớp</button>
      </div>

      {tab === 'calendar' ? (
        <>
          <div className="metric-grid">
            <div className="metric"><span>Số lớp</span><strong>{classes.length}</strong><small>Đang xem</small></div>
            <div className="metric"><span>Đã gửi</span><strong>{covered}</strong><small>Lượt kiểm diện trong tuần</small></div>
            <div className="metric"><span>Lượt vắng</span><strong>{absence}</strong><small>Tổng cộng</small></div>
            <div className="metric"><span>Chưa ghi nhận</span><strong>{classes.length * 12 - covered}</strong><small>Gồm cả buổi chưa đến</small></div>
          </div>
          <section className="panel calendar-panel">
            <div className="calendar-tools">
              <div><h2>Lịch kiểm diện trong tuần</h2><p>{dateLabel(days[0])} — {dateLabel(days[5])}</p></div>
              <div className="tool-actions">
                <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Lọc khối">
                  <option value="all">Tất cả khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
                <select aria-label="Năm học" value={year} onChange={e=>{setYear(e.target.value);setWeek(1);}}>{Object.keys(ACADEMIC_YEARS).map(y=><option key={y}>{y}</option>)}</select>
                <select aria-label="Học kỳ" value={term} onChange={e=>{setTerm(e.target.value);setWeek(1);}}><option value="1">Học kỳ I</option><option value="2">Học kỳ II</option></select>
                <select aria-label="Tuần" value={week} onChange={e=>setWeek(Number(e.target.value))}>{Array.from({length:WEEKS_PER_TERM},(_,i)=><option key={i} value={i+1}>Tuần {i+1}</option>)}</select>
                <button className="export-button" onClick={()=>exportWeekExcel({year,term,week,days,classes,records})}>↓ Xuất Excel</button>
              </div>
            </div>
            <div className="legend"><span><i className="dot green"/> Đủ sĩ số</span><span><i className="dot orange"/> Có học sinh vắng</span><span><i className="dot grey"/> Chưa có phiếu</span></div>
            <div className="table-scroll">
              <table className="attendance-table">
                <thead>
                  <tr><th className="sticky-class" rowSpan="2">LỚP / SĨ SỐ</th>
                    {days.map((date, i) => <th colSpan="2" key={i}>{DAYS[i]}<small>{dateLabel(date).slice(0, 5)}</small></th>)}
                  </tr>
                  <tr>{days.flatMap((date, i) => ['morning', 'afternoon'].map((session) =>
                    <th className="sub-th" key={`${i}-${session}`}>{session === 'morning' ? 'SÁNG' : 'CHIỀU'}</th>))}</tr>
                </thead>
                <tbody>
                  {classes.map((item) => (
                    <tr key={item.name}>
                      <th className="sticky-class class-name">{item.name}<small>{item.size} HS</small></th>
                      {days.flatMap((day) => ['morning', 'afternoon'].map((session) => {
                        const record = byId.get(`${dateKey(day)}|${session}|${item.name}`);
                        return (
                          <td key={`${dateKey(day)}-${session}`}>
                            <button type="button"
                              className={`cell-status ${!record ? 'empty' : record.absent ? 'has-absent' : 'perfect'}`}
                              onClick={() => setSelected({ item, date: dateLabel(day), session, record })}>
                              {!record ? '—' : `Vắng ${record.absent}`}
                            </button>
                          </td>
                        );
                      }))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-footnote">Nhấn vào ô để xem thời gian và họ tên. Chỉ dữ liệu đã gửi lên máy chủ mới được đồng bộ giữa thiết bị khi bật chế độ trực tuyến.</p>
          </section>
        </>
      ) : (
        <section className="panel accounts-panel">
          <div className="calendar-tools">
            <div><h2>Quản lý tài khoản lớp</h2><p>Admin có thể cập nhật username và PIN của từng lớp.</p></div>
            <input className="account-search" value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)} placeholder="Tìm lớp hoặc username..." />
          </div>
          {notice && <p className="form-success">{notice}</p>}
          <div className="table-scroll">
            <table className="accounts-table">
              <thead><tr><th>Lớp</th><th>Sĩ số</th><th>Username</th><th>PIN demo</th><th>Thao tác</th></tr></thead>
              <tbody>{filteredAccounts.map((item) => (
                <tr key={item.name}>
                  <td><strong>{item.name}</strong></td><td>{item.size}</td>
                  <td>{accounts[item.name]?.username}</td><td>••••</td>
                  <td><button className="text-action" onClick={() => beginEdit(item)}>Chỉnh sửa</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Chi tiết kiểm diện" onClick={(event) => event.stopPropagation()}>
            <div className="modal-top"><h2>Chi tiết kiểm diện</h2><button className="close-modal" onClick={() => setSelected(null)}>×</button></div>
            <dl>
              <div><dt>Lớp</dt><dd>{selected.item.name}</dd></div>
              <div><dt>Sĩ số</dt><dd>{selected.item.size}</dd></div>
              <div><dt>Ngày</dt><dd>{selected.date}</dd></div>
              <div><dt>Buổi</dt><dd>{SESSION_LABEL[selected.session]}</dd></div>
              <div><dt>Trạng thái</dt><dd>{selected.record ? 'Đã kiểm diện' : 'Chưa kiểm diện'}</dd></div>
              {selected.record && (
                <>
                  <div><dt>Số vắng</dt><dd>{selected.record.absent}</dd></div>
                  <div><dt>Thời gian ghi nhận</dt><dd>{new Date(selected.record.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</dd></div>
                  <div className="detail-names"><dt>Học sinh vắng</dt>
                    <dd>{selected.record.absentNames?.length ? selected.record.absentNames.join(' · ') : selected.record.absent ? 'Phiếu cũ chưa có danh sách họ tên' : 'Không có'}</dd></div>
                </>
              )}
            </dl>
            <button className="primary-button" onClick={() => setSelected(null)}>Đóng</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Chỉnh tài khoản" onClick={(event) => event.stopPropagation()}>
            <div className="modal-top"><h2>Sửa tài khoản lớp {editing}</h2><button className="close-modal" onClick={() => setEditing(null)}>×</button></div>
            <form className="attendance-form" onSubmit={submitEdit}>
              <label htmlFor="edit-user">Username <b>*</b></label>
              <input id="edit-user" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} maxLength="40" required />
              <label htmlFor="edit-pin">PIN mới <b>*</b></label>
              <input id="edit-pin" value={editPin} onChange={(e) => setEditPin(e.target.value)} minLength="4" maxLength="40" required />
              {editError && <p className="form-error">{editError}</p>}
              <p className="muted">Bản demo lưu thay đổi trên trình duyệt hiện tại. Chưa cập nhật được tài khoản trên thiết bị khác.</p>
              <button type="submit" className="primary-button">Lưu thay đổi</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
