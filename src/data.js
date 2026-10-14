export const SCHOOL = 'TRƯỜNG THPT NGUYỄN ĐÌNH CHIỂU';
export const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/vi/4/41/Logo_tr%C6%B0%E1%BB%9Dng_THPT_Nguy%E1%BB%85n_%C4%90%C3%ACnh_Chi%E1%BB%83u_M%E1%BB%B9_Tho.svg';
import classes from './classes.json';
export const CLASS_DATA = classes;
export const CLASS_LIST = classes.map((item) => item.name);
export const CLASS_BY_NAME = Object.fromEntries(classes.map((item) => [item.name, item]));
export const DAYS = ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
export const DAY_SHORT = ['T2','T3','T4','T5','T6','T7'];
export const SESSION_LABEL = {morning:'Buổi sáng',afternoon:'Buổi chiều'};
export const zonedDate = (date = new Date()) => new Date(date.toLocaleString('en-US', {timeZone:'Asia/Ho_Chi_Minh'}));
export function dateKey(date) { const y=date.getFullYear();return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export const localToday = () => dateKey(zonedDate());
export const dateLabel = (date) => date.toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'});
export function startWeek(base = zonedDate()) { const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()); const day=d.getDay();d.setDate(d.getDate() - (day===0?6:day-1));return d;}
export function weekDays(weekOffset=0) {const first=startWeek(); first.setDate(first.getDate()+weekOffset*7);return DAYS.map((_,i)=>{const d=new Date(first);d.setDate(first.getDate()+i);return d;});}
export function recordId(date, session, className) {return `${date}|${session}|${className}`;}
const STORAGE_KEY='vuonq_attendance_demo_v1';
export function readRecords(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
export function saveRecords(records){localStorage.setItem(STORAGE_KEY, JSON.stringify(records));}


// CHẾ ĐỘ DEMO: tài khoản chỉ lưu trên trình duyệt hiện tại, không có bảo mật máy chủ.
const ACCOUNT_KEY = 'vuonq_accounts_demo_v2';
export const ADMIN_DEMO = { username: 'admin', pin: 'QuanTri@2026' };
export function readAccounts() {
  try {
    const raw = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
    return Object.fromEntries(CLASS_DATA.map((item) => [item.name, {
      username: String(raw[item.name]?.username || item.username),
      pin: String(raw[item.name]?.pin || '2026'),
    }]));
  } catch {
    return Object.fromEntries(CLASS_DATA.map((item) => [item.name, { username: item.username, pin: '2026' }]));
  }
}
export function saveAccounts(accounts) { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts)); }
