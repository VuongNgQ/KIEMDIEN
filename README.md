# VUONQ · Hệ thống kiểm diện THPT Nguyễn Đình Chiểu

## Các màn hình
- Học sinh đăng nhập theo tên lớp + PIN, kiểm diện sáng / chiều, nhập đầy đủ tên từng bạn vắng.
- Tab **Lịch lớp**: xem các phiếu theo tuần, học kỳ, năm học của **lớp đang đăng nhập**.
- Admin: lọc khối, năm học, học kỳ, tuần; xuất tệp Excel `.xls` (định dạng Excel 2003 XML, 2 trang tính: tổng hợp và chi tiết), chỉnh tài khoản lớp.
- Có 73 lớp, sĩ số đọc từ `src/classes.json`.

## Cách 1: Xem thử frontend trên máy tính (không có dữ liệu chung)
1. Mở thư mục `diem-danh-app` bằng VS Code.
2. Chạy `npm install`, sau đó `npm run dev`.
3. Mở http://localhost:5173.
4. Chế độ demo: username ví dụ `113` / `11A2`, PIN `2026`; admin / `QuanTri@2026`.
5. Dữ liệu demo nằm ở localStorage mỗi trình duyệt: không phải backend.

## Cách 2: Chạy online — Supabase + Netlify Functions
**Supabase là nơi lưu database. Netlify là nơi host website và API serverless** (`netlify/functions/api.mjs`). Không được đưa service role key vào React, GitHub public, hoặc biến bắt đầu `VITE_`.

### Bước A · Tạo Supabase
1. Vào https://supabase.com/dashboard → New project, chọn vùng gần Việt Nam; lưu password database nơi riêng tư.
2. Đợi dự án khởi tạo, mở SQL Editor → New query.
3. Mở file `supabase/setup.sql` trong VS Code, copy toàn bộ, dán SQL Editor → Run. Script tạo 73 lớp, hash PIN `2026`, bảng kiểm diện và 2 hàm RPC. Nếu chạy nhiều lần, script cập nhật sĩ số nhưng **không đặt lại PIN đã đổi**.
4. Trong Project Settings → API Keys (hoặc mục API của phiên bản dashboard đang sử dụng), lấy **Project URL** và **service_role secret** (chỉ sử dụng ở Netlify môi trường máy chủ, tuyệt đối không dán key này vào chat).

### Bước B · Cấu hình Netlify
1. Vào https://app.netlify.com/ → Add new project → Import an existing project, kết nối GitHub chứa **nội dung của thư mục `diem-danh-app`**.
2. Base directory: để trống nếu repo có package.json ngay root; nếu repo chứa thư mục diem-danh-app thì chọn đúng thư mục đó.
3. Build command `npm run build`; Publish directory `dist`; Functions directory `netlify/functions` (file netlify.toml đã cấu hình).
4. Site configuration → Environment variables → Add a variable, nhập:
   - `VITE_API_MODE` = `online`
   - `SUPABASE_URL` = URL Supabase, ví dụ `https://xxxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (không công khai)
   - `VUONQ_JWT_SECRET` = chuỗi ngẫu nhiên rất dài, ví dụ tạo PowerShell: `[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))`
   - `VUONQ_ADMIN_USERNAME` = `admin` (hoặc username riêng)
   - `VUONQ_ADMIN_PIN` = PIN admin mạnh, riêng và khó đoán, KHÔNG dùng `2026`.
5. Trigger deploy → Deploy site. Sau deploy, mở đường dẫn https://<ten-site>.netlify.app. Kiểm tra đăng nhập, gửi phiếu, admin xem và xuất Excel.
6. Để cập nhật code sau này: commit và push lên GitHub; Netlify sẽ build/deploy lại (khi auto-deploy được bật).

**Cần lưu ý:** `npm run dev` không chạy Netlify Functions; nếu cần thử API ở localhost, cài `netlify-cli` rồi chạy `netlify dev`, có biến môi trường tương ứng. Đừng dùng `VITE_API_MODE=online` khi chỉ chạy Vite bằng `npm run dev`.

### Bước C · Kiểm tra online
- Đăng nhập một lớp trên thiết bị A, nhập số vắng `1`, họ tên `Hồng Hạnh`, gửi phiếu.
- Mở thiết bị B, đăng nhập admin, xem đúng học kỳ/tuần và mở ô của lớp đó; dữ liệu nên hiện. Tab lớp cũng chỉ hiện lịch của lớp mình.
- Xuất Excel từ Admin. Mở bằng Microsoft Excel; một số bản Excel có thể hiện cảnh báo định dạng `.xls` XML 2003, đây là tệp XML Spreadsheet hợp lệ (không phải `.xlsx`).

## Cấu hình tuần, học kỳ
- `src/academic.js` là nguồn thiết lập lịch. Năm 2026–2027 mặc định HKI bắt đầu thứ Hai 07/09/2026 → ngày 14/10/2026 là **tuần 6**.
- HKII hiện đặt mốc dự kiến 11/01/2027; trường phải xác nhận trước khi sử dụng chính thức. Mỗi học kỳ đang cấu hình 18 tuần; nếu lịch chính thức có số tuần khác, sửa `WEEKS_PER_TERM`.
- Không suy luận rằng học kỳ và tuần tự động đúng theo lịch của Bộ/GD địa phương nếu chưa được trường phê duyệt.

## Bảo mật và hạn chế cần xử lý trước khi triển khai thật
- Mã PIN chung 2026 rất dễ đoán: chỉ thử nghiệm. Admin phải cấp PIN riêng cho từng lớp. Nên dùng PIN >= 8 ký tự không tuần tự hoặc đăng nhập định danh có MFA cho admin.
- API hiện chỉ có JWT tự ký trong 8 giờ, chưa có **rate limiting / chống brute-force phân tán**, nhật ký thay đổi, phân quyền cá nhân theo học sinh hay quy trình thu hồi phiên. Không dùng thật cho dữ liệu học sinh trước khi triển khai các lớp bảo vệ bổ sung, nhất là dữ liệu họ tên học sinh vắng.
- Trước khi vận hành: yêu cầu HTTPS, chính sách bảo mật, kiểm tra quyền dữ liệu, lưu bản sao cơ sở dữ liệu, và rà soát quyền sử dụng logo. Cần rotate bất kỳ Supabase secret key nào đã từng đưa vào code frontend.
- Nút xuất Excel lấy tập dữ liệu đang tải về ở dashboard; khi có hơn 10.000 phiếu, cần backend phân trang hoặc truy vấn theo phạm vi thời gian.
- Trang lớp xem theo từng tuần nhưng API hiện lấy toàn bộ bản ghi thuộc lớp; cần tối ưu nếu vận hành trong nhiều năm.
- `src/classes.json` phải cập nhật sĩ số khi có thay đổi; backend lưu sĩ số trong `vuonq_classes`.
