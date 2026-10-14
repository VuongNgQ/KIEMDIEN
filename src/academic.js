// Có thể cập nhật ngày bắt đầu từng học kỳ theo lịch chính thức của trường.
export const ACADEMIC_YEARS = {
  '2025-2026': { 1: '2025-09-08', 2: '2026-01-12' },
  '2026-2027': { 1: '2026-09-07', 2: '2027-01-11' },
  '2027-2028': { 1: '2027-09-06', 2: '2028-01-10' },
};
export const WEEKS_PER_TERM = 18;
export const DEFAULT_YEAR = '2026-2027';
export const DEFAULT_TERM = '1';
export function mondayForWeek(year, term, number) {
  const start = ACADEMIC_YEARS[year]?.[term];
  if (!start) return null;
  const [y,m,d] = start.split('-').map(Number);
  const date = new Date(y,m-1,d,12);
  date.setDate(date.getDate() + (number - 1) * 7);
  return date;
}
export function datesForAcademicWeek(year, term, number) {
  const start = mondayForWeek(year,term,number);
  if (!start) return [];
  return Array.from({length:6},(_,i)=>{const day=new Date(start);day.setDate(start.getDate()+i);return day;});
}
export function findAcademicWeek(now = new Date()) {
  const current = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  for (const [year, terms] of Object.entries(ACADEMIC_YEARS)) {
    for (const [term, first] of Object.entries(terms)) {
      const [y,m,d] = first.split('-').map(Number);
      const start = new Date(y,m-1,d,12);
      const diff = Math.floor((current - start) / (86400000 * 7)) + 1;
      if (diff >= 1 && diff <= WEEKS_PER_TERM) return {year,term,week:diff};
    }
  }
  return {year:DEFAULT_YEAR,term:DEFAULT_TERM,week:6};
}
