// Chưa kết nối Supabase ở giai đoạn frontend.
// Tuyệt đối không dùng secret/service_role key trong trình duyệt.
// Khi cấu hình backend, dùng VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY.
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
};
