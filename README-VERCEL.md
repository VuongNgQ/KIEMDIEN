# VUONQ - Vercel + Supabase

Bản chuyển đổi từ Netlify Functions sang Vercel Functions cho VUONQ.

## 1. Repository
Đưa **nội dung thư mục `diem-danh-app/`** vào repository, hoặc giữ nguyên dạng repo hiện tại rồi chọn Root Directory = `diem-danh-app` trên Vercel.

Không upload `node_modules`, `dist`, `.env` hoặc secret. File `.gitignore` đã được thêm.

## 2. Vercel
Vào https://vercel.com/new -> Import Git Repository -> chọn VUONQ-KIEMDIEN.
- Framework Preset: Vite
- Root Directory: `diem-danh-app` (nếu kho GitHub vẫn chứa thư mục này)
- Build Command: npm run build
- Output Directory: dist

Environment Variables (Production; và Preview nếu muốn dùng):
- VITE_API_MODE=online
- SUPABASE_URL=https://YOUR_PROJECT.supabase.co  (KHÔNG có /rest/v1)
- SUPABASE_SERVICE_ROLE_KEY=<Supabase secret key đã rotate>
- VUONQ_JWT_SECRET=<chuỗi ngẫu nhiên bảo mật>
- VUONQ_ADMIN_USERNAME=admin
- VUONQ_ADMIN_PIN=<mật khẩu admin mạnh>

Không dùng tiền tố VITE_ cho bất kỳ secret nào.

## 3. Đường dẫn thử
- Frontend: https://YOUR-PROJECT.vercel.app/
- API: https://YOUR-PROJECT.vercel.app/api/attendance

Truy cập API không kèm xác thực sẽ trả JSON lỗi; điều này cho thấy Function nhận được yêu cầu. Tiếp tục dùng tài khoản thử và kiểm tra database.

## 4. Đã chuyển đổi
- src/api.js: BASE sang `/api/attendance`
- api/attendance.mjs: Adapter Vercel -> VUONQ handler
- server/vuonq-api.mjs: xử lý API gốc, chạy server side
- vercel.json: Vite build

## 5. Quan trọng trước khi sử dụng học sinh thật
Chưa có rate limiting cho đăng nhập, PIN mặc định 2026 phải được đổi và khóa Supabase từng bị hiển thị trong ảnh phải được thu hồi. Không gửi dữ liệu học sinh thật trước khi hoàn tất kiểm thử bảo mật. Phân quyền và phiên đăng nhập cần được đánh giá đầy đủ.
