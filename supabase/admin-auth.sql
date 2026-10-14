-- Chạy sau supabase/setup.sql. Không tạo tài khoản admin bằng SQL.
-- Admin được tạo tại Authentication > Users, sau đó chèn UID vào đây.
CREATE TABLE IF NOT EXISTS public.vuonq_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vuonq_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vuonq_admins FROM anon, authenticated;
-- Ví dụ, sau khi tạo user trong Dashboard, chạy SQL sau trong Editor:
-- INSERT INTO public.vuonq_admins(user_id) VALUES ('THAY-UUID-THAT-O-DAY')
-- ON CONFLICT (user_id) DO NOTHING;
