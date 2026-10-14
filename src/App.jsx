import React, { useEffect, useMemo, useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import ClassCalendar from './components/ClassCalendar';
import { apiRequest, ONLINE_MODE } from './api';
import {
  ADMIN_DEMO,
  CLASS_BY_NAME,
  CLASS_DATA,
  LOGO_URL,
  SCHOOL,
  SESSION_LABEL,
  localToday,
  readAccounts,
  readRecords,
  recordId,
  saveAccounts,
  saveRecords,
  zonedDate,
} from './data';
import './App.css';

function SchoolBrand() {
  return (
    <div className="brand">
      <div className="logo-wrap">
        <img src={LOGO_URL} alt="Logo Trường THPT Nguyễn Đình Chiểu" />
      </div>
      <div>
        <p className="brand-sub">HỆ THỐNG KIỂM DIỆN · VUONQ</p>
        <strong>{SCHOOL}</strong>
        <span>Năm học 2026–2027</span>
      </div>
    </div>
  );
}

function Login({ accounts, onLogin }) {
  const [busy,setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    if (ONLINE_MODE) {
      setBusy(true);setError('');
      try { const result=await apiRequest('login', {username:username.trim(),pin}); sessionStorage.setItem('vuonq_token',result.token);onLogin(result.user); }
      catch (err) {setError(err.message);}finally{setBusy(false);}
      return;
    }
    const loginName = username.trim().toLowerCase();
    if (loginName === ADMIN_DEMO.username && pin === ADMIN_DEMO.pin) {
      onLogin({ role: 'admin', username: ADMIN_DEMO.username });
      return;
    }

    const matchingClass = CLASS_DATA.find(
      (item) => accounts[item.name]?.username?.trim().toLowerCase() === loginName &&
        accounts[item.name]?.pin === pin,
    );
    if (matchingClass) {
      onLogin({ role: 'student', className: matchingClass.name });
      return;
    }
    setError('Tên đăng nhập hoặc mã PIN không đúng. Vui lòng thử lại.');
  }

  return (
    <div className="login-shell">
      <header className="topbar login-topbar"><SchoolBrand /></header>
      <main className="login-layout">
        <section className="login-intro">
          <span className="eyebrow">CHÀO MỪNG BẠN!</span>
          <h1>Điểm danh nhanh.<br /><em>Đến lớp an tâm.</em></h1>
          <p>Ghi nhận tình hình học sinh mỗi buổi sáng và chiều. Thao tác đơn giản, theo dõi trực quan.</p>
          <div className="login-benefits">
            <span>✓ 73 lớp học</span><span>✓ Ghi nhận thời gian</span><span>✓ Lịch tuần rõ ràng</span>
          </div>
        </section>
        <section className="panel login-panel">
          <div className="login-icon">✦</div>
          <h2>Đăng nhập VUONQ</h2>
          <p className="muted">Nhập tài khoản lớp và PIN được cấp.</p>
          <form onSubmit={handleLogin} className="attendance-form">
            <label htmlFor="login-user">Tên đăng nhập <b>*</b></label>
            <input id="login-user" autoComplete="username" autoFocus value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Ví dụ: 113 hoặc 11A2" required />
            <label htmlFor="login-pin">Mã PIN <b>*</b></label>
            <div className="pin-field">
              <input id="login-pin" type={showPin ? 'text' : 'password'} inputMode="text"
                autoComplete="current-password" value={pin} maxLength={40}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="Nhập mã PIN" required />
              <button type="button" className="reveal-pin" onClick={() => setShowPin((v) => !v)}>
                {showPin ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="primary-button">{busy ? 'Đang đăng nhập...' : 'Đăng nhập →'}</button>
          </form>
          <div className="demo-hint">BẢN DÙNG THỬ · PIN mặc định lớp: <strong>2026</strong></div>
        </section>
      </main>
    </div>
  );
}

function StudentView({ className, records, setRecords }) {
  const [sending,setSending]=useState(false);
  const [absent, setAbsent] = useState('');
  const [names, setNames] = useState([]);
  const [session, setSession] = useState(zonedDate().getHours() < 12 ? 'morning' : 'afternoon');
  const [clock, setClock] = useState(zonedDate());
  const [message, setMessage] = useState(null);
  const currentClass = CLASS_BY_NAME[className];
  const amount = absent === '' ? 0 : Number(absent);
  const validCount = absent !== '' && Number.isInteger(amount) && amount >= 0 && amount <= currentClass.size;
  const count = validCount ? amount : 0;
  const previous = records.find((row) => row.id === recordId(localToday(), session, className));

  useEffect(() => {
    const timer = setInterval(() => setClock(zonedDate()), 1000);
    return () => clearInterval(timer);
  }, []);

  function changeAbsent(value) {
    setAbsent(value);
    setMessage(null);
    const n = Number(value);
    const number = value !== '' && Number.isInteger(n) && n > 0 && n <= currentClass.size ? n : 0;
    setNames((prior) => Array.from({ length: number }, (_, index) => prior[index] || ''));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    if (!validCount) return setMessage({ type: 'error', text: `Số vắng phải từ 0 đến ${currentClass.size} học sinh.` });
    const cleanNames = names.slice(0, count).map((name) => name.trim().replace(/\s+/g, ' '));
    if (count > 0 && (cleanNames.length !== count || cleanNames.some((name) => !name))) {
      return setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ họ tên của từng học sinh vắng.' });
    }
    if (new Set(cleanNames.map((name) => name.toLocaleLowerCase('vi-VN'))).size !== cleanNames.length) {
      return setMessage({ type: 'error', text: 'Danh sách có họ tên trùng. Vui lòng kiểm tra lại.' });
    }
    if (zonedDate().getDay() === 0) {
      return setMessage({ type: 'error', text: 'Ngày Chủ nhật không thuộc lịch kiểm diện.' });
    }
    const now = new Date();
    const entry = {
      id: recordId(localToday(), session, className),
      date: localToday(),
      session,
      className,
      absent: count,
      absentNames: cleanNames,
      createdAt: now.toISOString(),
      reporter: className,
    };
    if (ONLINE_MODE) {
      setSending(true);
      try {
        const result=await apiRequest('save-record', {session,absent:count,absentNames:cleanNames});
        const updated=[...records.filter(row=>row.id!==result.record.id),result.record];
        setRecords(updated);
        setMessage({type:'success',text:`Đã ghi nhận thành công vào máy chủ lúc ${new Date(result.record.createdAt).toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}.`});
      }catch(error){setMessage({type:'error',text:error.message});}
      finally{setSending(false);}
      return;
    }
    const updated = [...records.filter((row) => row.id !== entry.id), entry];
    saveRecords(updated);
    setRecords(updated);
    setMessage({ type: 'success', text: `Đã ghi nhận lớp ${className}: ${count} học sinh vắng lúc ${now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}.` });
  }

  return (
    <main className="page-width">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">PHIẾU KIỂM DIỆN HẰNG NGÀY</span>
          <h1>Xin chào, lớp <em>{className}</em>!</h1>
          <p>Kiểm tra sĩ số, khai báo học sinh vắng và xác nhận mỗi buổi học.</p>
        </div>
        <div className="hero-symbol">✎</div>
      </section>
      <div className="main-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <span className="heading-icon">✓</span>
            <div><h2>Phiếu kiểm diện hôm nay</h2><p>Những mục có dấu * là bắt buộc.</p></div>
          </div>
          <form onSubmit={submit} className="attendance-form">
            <label>Lớp kiểm diện</label>
            <div className="readonly-class">{className}<span>Sĩ số: <strong>{currentClass.size}</strong> học sinh</span></div>
            <label>Buổi kiểm diện <b>*</b></label>
            <div className="session-grid">
              {['morning', 'afternoon'].map((option) => (
                <button type="button" key={option}
                  className={session === option ? 'session selected' : 'session'}
                  onClick={() => { setSession(option); setMessage(null); }}>
                  {option === 'morning' ? '☀' : '☾'} {SESSION_LABEL[option]}
                </button>
              ))}
            </div>
            <label htmlFor="absent-count">Số học sinh vắng <b>*</b></label>
            <div className="number-row">
              <input id="absent-count" type="number" min="0" max={currentClass.size} step="1"
                placeholder="Nhập 0 nếu lớp đầy đủ" value={absent}
                onChange={(event) => changeAbsent(event.target.value)} required />
              <span>/ {currentClass.size} học sinh</span>
            </div>
            {count > 0 && (
              <div className="names-panel">
                <h3>Danh sách học sinh vắng ({count}) <b>*</b></h3>
                <p>Mỗi học sinh điền vào một ô, ví dụ: Hồng Hạnh.</p>
                <div className="names-grid">
                  {Array.from({ length: count }, (_, index) => (
                    <div key={index}>
                      <label htmlFor={`absent-name-${index}`}>Học sinh vắng {index + 1} <b>*</b></label>
                      <input id={`absent-name-${index}`} value={names[index] || ''}
                        placeholder={`Họ và tên học sinh ${index + 1}`}
                        onChange={(event) => setNames((prior) => prior.map((name, i) => i === index ? event.target.value : name))}
                        required maxLength="100" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="time-note">◷ Thời điểm hiện tại: <strong>{clock.toLocaleString('vi-VN')}</strong><small>Thời gian gửi được ghi nhận lúc bấm Xác nhận.</small></div>
            {previous && <p className="form-warning">Buổi này đã có phiếu kiểm diện. Gửi lại sẽ cập nhật phiếu cũ.</p>}
            {message && <p className={message.type === 'success' ? 'form-success' : 'form-error'} role="alert">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={sending}>{sending ? 'Đang gửi...' : '✓ Xác nhận kiểm diện'}</button>
          </form>
        </section>
        <aside className="side-column">
          <section className="panel date-card">
            <span className="label-small">HÔM NAY</span>
            <strong className="big-date">{clock.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</strong>
            <span>{clock.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric' })}</span>
          </section>
          <section className="panel tip-card"><h3>Lưu ý khi kiểm diện</h3><p>Nếu lớp không có học sinh vắng, nhập <strong>0</strong>. Nếu có học sinh vắng, nhập đầy đủ họ tên tương ứng.</p></section>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState(() => ONLINE_MODE ? {} : readAccounts());
  const [records, setRecords] = useState(() => ONLINE_MODE ? [] : readRecords());
  const [user, setUser] = useState(null);
  const [view,setView]=useState('form');
  const [loadError,setLoadError]=useState('');
  useEffect(()=>{
    if(!ONLINE_MODE||!user)return;
    let live=true;
    const load=async()=>{try{const result=await apiRequest('records');if(live)setRecords(result.records||[]);}catch(err){if(live)setLoadError(err.message);}};
    load();return()=>{live=false;};
  },[user]);

  async function updateAccount(className, values) {
    if(ONLINE_MODE) await apiRequest('update-account',{className,...values});
    const next = { ...accounts, [className]: values };
    setAccounts(next);
    saveAccounts(next);
  }

  async function login(userData){
    setUser(userData);setView('form');setLoadError('');
    if(ONLINE_MODE&&userData.role==='admin'){try{const response=await apiRequest('accounts');setAccounts(response.accounts);}catch(err){setLoadError(err.message);}}
  }
  function logout(){sessionStorage.removeItem('vuonq_token');setUser(null);setRecords(ONLINE_MODE?[]:readRecords());}
  return (
    <div className="site-shell">
      {!user ? <Login accounts={accounts} onLogin={login} /> : (
        <>
          <header className="topbar">
            <SchoolBrand />
            <div className="top-nav">
              <span className="logged-in-label">{user.role === 'admin' ? 'Quản trị viên' : `Lớp ${user.className}`}</span>
              {user.role === 'student' && <><button className={view==='form'?'nav-active':''} onClick={()=>setView('form')}>Phiếu kiểm diện</button><button className={view==='history'?'nav-active':''} onClick={()=>setView('history')}>Lịch lớp</button></>}
              <button onClick={logout}>Đăng xuất ↗</button>
              <span className="demo-pill">{ONLINE_MODE ? 'TRỰC TUYẾN' : 'BẢN DÙNG THỬ'}</span>
            </div>
          </header>
          {loadError && <p className="form-error page-width">Lỗi máy chủ: {loadError}</p>}
          {user.role === 'admin' ? (
            <AdminDashboard records={records} accounts={accounts} onUpdateAccount={updateAccount} />
          ) : (
            view==='history' ? <ClassCalendar className={user.className} records={records}/> : <StudentView className={user.className} records={records} setRecords={setRecords} />
          )}
        </>
      )}
      <footer className="app-footer">VUONQ ·Bản demo chưa được thông qua.</footer>
    </div>
  );
}
