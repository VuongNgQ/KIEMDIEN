-- Chạy một lần trong Supabase SQL Editor, dự án mới.
-- Không đưa service_role key vào src/ hoặc bất kỳ VITE_ biến nào.
create extension if not exists pgcrypto;
create table if not exists public.vuonq_classes (
 name text primary key,
 size integer not null check(size>0),
 grade text not null,
 username text not null,
 pin_hash text not null
);
create unique index if not exists vuonq_username_unique on public.vuonq_classes (lower(username));
create table if not exists public.vuonq_attendance (
 id text primary key,
 date date not null,
 session text not null check(session in ('morning','afternoon')),
 class_name text not null references public.vuonq_classes(name),
 absent integer not null check(absent>=0),
 absent_names jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 unique(date,session,class_name),
 check(jsonb_typeof(absent_names)='array'),
 check(jsonb_array_length(absent_names)=absent)
);
create or replace function public.vuonq_touch_record() returns trigger language plpgsql as $$ begin new.created_at=now();return new; end $$;
drop trigger if exists vuonq_touch on public.vuonq_attendance;
create trigger vuonq_touch before insert or update on public.vuonq_attendance for each row execute function public.vuonq_touch_record();
alter table public.vuonq_classes enable row level security;
alter table public.vuonq_attendance enable row level security;
revoke all on public.vuonq_classes from anon, authenticated;
revoke all on public.vuonq_attendance from anon, authenticated;
insert into public.vuonq_classes(name,size,grade,username,pin_hash) values
('10.1',44,'10','101',crypt('2026',gen_salt('bf'))),
('10.2',45,'10','102',crypt('2026',gen_salt('bf'))),
('10.3',44,'10','103',crypt('2026',gen_salt('bf'))),
('10.4',45,'10','104',crypt('2026',gen_salt('bf'))),
('10.5',46,'10','105',crypt('2026',gen_salt('bf'))),
('10.6',45,'10','106',crypt('2026',gen_salt('bf'))),
('10.7',47,'10','107',crypt('2026',gen_salt('bf'))),
('10.8',47,'10','108',crypt('2026',gen_salt('bf'))),
('10.9',32,'10','109',crypt('2026',gen_salt('bf'))),
('10.10',47,'10','1010',crypt('2026',gen_salt('bf'))),
('10A0',45,'10','10A0',crypt('2026',gen_salt('bf'))),
('10A1',45,'10','10A1',crypt('2026',gen_salt('bf'))),
('10A2',44,'10','10A2',crypt('2026',gen_salt('bf'))),
('10A3',46,'10','10A3',crypt('2026',gen_salt('bf'))),
('10A4',46,'10','10A4',crypt('2026',gen_salt('bf'))),
('10A5',43,'10','10A5',crypt('2026',gen_salt('bf'))),
('10A6',44,'10','10A6',crypt('2026',gen_salt('bf'))),
('10A7',45,'10','10A7',crypt('2026',gen_salt('bf'))),
('10A8',44,'10','10A8',crypt('2026',gen_salt('bf'))),
('10B',47,'10','10B',crypt('2026',gen_salt('bf'))),
('10D1',45,'10','10D1',crypt('2026',gen_salt('bf'))),
('10D2',45,'10','10D2',crypt('2026',gen_salt('bf'))),
('10D3',45,'10','10D3',crypt('2026',gen_salt('bf'))),
('10D4',35,'10','10D4',crypt('2026',gen_salt('bf'))),
('10T1',44,'10','10T1',crypt('2026',gen_salt('bf'))),
('10T2',45,'10','10T2',crypt('2026',gen_salt('bf'))),
('10T3',44,'10','10T3',crypt('2026',gen_salt('bf'))),
('11.1',48,'11','111',crypt('2026',gen_salt('bf'))),
('11.2',36,'11','112',crypt('2026',gen_salt('bf'))),
('11.3',47,'11','113',crypt('2026',gen_salt('bf'))),
('11.4',48,'11','114',crypt('2026',gen_salt('bf'))),
('11.5',44,'11','115',crypt('2026',gen_salt('bf'))),
('11.6',44,'11','116',crypt('2026',gen_salt('bf'))),
('11.7',35,'11','117',crypt('2026',gen_salt('bf'))),
('11.8',45,'11','118',crypt('2026',gen_salt('bf'))),
('11A0',48,'11','11A0',crypt('2026',gen_salt('bf'))),
('11A1',43,'11','11A1',crypt('2026',gen_salt('bf'))),
('11A2',42,'11','11A2',crypt('2026',gen_salt('bf'))),
('11A3',48,'11','11A3',crypt('2026',gen_salt('bf'))),
('11A4',48,'11','11A4',crypt('2026',gen_salt('bf'))),
('11A5',45,'11','11A5',crypt('2026',gen_salt('bf'))),
('11A6',37,'11','11A6',crypt('2026',gen_salt('bf'))),
('11B',45,'11','11B',crypt('2026',gen_salt('bf'))),
('11D1',43,'11','11D1',crypt('2026',gen_salt('bf'))),
('11D2',42,'11','11D2',crypt('2026',gen_salt('bf'))),
('11D3',37,'11','11D3',crypt('2026',gen_salt('bf'))),
('11D4',43,'11','11D4',crypt('2026',gen_salt('bf'))),
('11T1',45,'11','11T1',crypt('2026',gen_salt('bf'))),
('11T2',48,'11','11T2',crypt('2026',gen_salt('bf'))),
('11T3',46,'11','11T3',crypt('2026',gen_salt('bf'))),
('12.1',49,'12','121',crypt('2026',gen_salt('bf'))),
('12.2',44,'12','122',crypt('2026',gen_salt('bf'))),
('12.3',31,'12','123',crypt('2026',gen_salt('bf'))),
('12.4',54,'12','124',crypt('2026',gen_salt('bf'))),
('12.5',39,'12','125',crypt('2026',gen_salt('bf'))),
('12.6',34,'12','126',crypt('2026',gen_salt('bf'))),
('12.7',48,'12','127',crypt('2026',gen_salt('bf'))),
('12.8',48,'12','128',crypt('2026',gen_salt('bf'))),
('12A1',47,'12','12A1',crypt('2026',gen_salt('bf'))),
('12A2',44,'12','12A2',crypt('2026',gen_salt('bf'))),
('12A3',43,'12','12A3',crypt('2026',gen_salt('bf'))),
('12A4',42,'12','12A4',crypt('2026',gen_salt('bf'))),
('12A5',47,'12','12A5',crypt('2026',gen_salt('bf'))),
('12A6',45,'12','12A6',crypt('2026',gen_salt('bf'))),
('12A7',44,'12','12A7',crypt('2026',gen_salt('bf'))),
('12A8',46,'12','12A8',crypt('2026',gen_salt('bf'))),
('12B',51,'12','12B',crypt('2026',gen_salt('bf'))),
('12D1',50,'12','12D1',crypt('2026',gen_salt('bf'))),
('12D2',46,'12','12D2',crypt('2026',gen_salt('bf'))),
('12H',35,'12','12H',crypt('2026',gen_salt('bf'))),
('12L1',46,'12','12L1',crypt('2026',gen_salt('bf'))),
('12L2',34,'12','12L2',crypt('2026',gen_salt('bf'))),
('12L3',40,'12','12L3',crypt('2026',gen_salt('bf')))
on conflict(name) do update set size=excluded.size, grade=excluded.grade;
-- RPC chỉ cấp quyền service_role (Netlify Functions). PIN luôn hash với bcrypt bằng pgcrypto.
create or replace function public.vuonq_login_class(p_username text,p_pin text)
returns table(class_name text) language sql security definer set search_path=public as $$
 select name from public.vuonq_classes where lower(username)=lower(p_username) and pin_hash=crypt(p_pin,pin_hash) limit 1;
$$;
create or replace function public.vuonq_update_credentials(p_class_name text,p_username text,p_pin text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.vuonq_classes where name=p_class_name) then raise exception 'Lớp không tồn tại';end if;
 update public.vuonq_classes set username=p_username,pin_hash=crypt(p_pin,gen_salt('bf')) where name=p_class_name;
end;$$;
revoke execute on function public.vuonq_login_class(text,text) from public, anon, authenticated;
revoke execute on function public.vuonq_update_credentials(text,text,text) from public, anon, authenticated;
grant execute on function public.vuonq_login_class(text,text) to service_role;
grant execute on function public.vuonq_update_credentials(text,text,text) to service_role;
