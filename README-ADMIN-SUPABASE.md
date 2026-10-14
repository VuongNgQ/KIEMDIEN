# VUONQ – Admin qua Supabase Auth

## 1. Database (một lần)
Trong Supabase SQL Editor, chạy `supabase/admin-auth.sql`. Không xóa bảng lớp hoặc attendance.

## 2. Tạo người dùng admin
Vào Supabase Dashboard → Authentication → Users → Add user. Tạo user bằng **email thật và mật khẩu mạnh**; xác nhận email theo tùy chọn Dashboard. Sao chép `User UID` được hiển thị trong danh sách Users.

Quay lại SQL Editor chạy (thay bằng UID thực):
```sql
INSERT INTO public.vuonq_admins(user_id)
VALUES ('THAY-UID-ADMIN-VAO-DAY')
ON CONFLICT (user_id) DO NOTHING;
```
Kiểm tra `SELECT user_id,created_at FROM public.vuonq_admins;` trong SQL Editor.

## 3. Vercel Environment Variables
Giữ `SUPABASE_URL` (Project URL gốc, KHÔNG có `/rest/v1/`), `SUPABASE_SERVICE_ROLE_KEY` (secret backend) và `VUONQ_JWT_SECRET`. Thêm `SUPABASE_PUBLISHABLE_KEY` từ Supabase → Project Settings → API Keys → Publishable key (`sb_publishable_...`). Đặt Production; Redeploy. `VITE_API_MODE=online` cũng phải có ở Production.

Không còn cần `VUONQ_ADMIN_USERNAME` và `VUONQ_ADMIN_PIN`. Chỉ xóa hai biến cũ sau khi xác nhận đăng nhập thành công.

## 4. Đăng nhập
- Admin: **email** vừa tạo trong Supabase Auth và **mật khẩu** (ô giao diện vẫn chung với PIN).
- Học sinh: tài khoản lớp như `101`, PIN riêng; không thay đổi.

## 5. Lưu ý
- Nếu xác thực email thành công nhưng UID chưa nằm trong `vuonq_admins`, backend vẫn từ chối đăng nhập.
- Không chụp hoặc gửi secret key, mật khẩu hoặc JWT.
- Phiên VUONQ hiện được ký bằng `VUONQ_JWT_SECRET`, tồn tại 8 giờ; khóa ký cần giữ bí mật. Đây là bản thử nghiệm, trước triển khai thực cần giới hạn lượt đăng nhập và cơ chế thu hồi phiên khi vô hiệu hóa Admin.
