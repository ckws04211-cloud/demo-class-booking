-- 손결 공방 데모: Supabase SQL Editor에서 실행하세요.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  code text unique not null,
  class_slug text not null,
  session_id text not null,
  session_at timestamptz not null,
  headcount int not null check (headcount between 1 and 10),
  amount int not null check (amount > 0),
  name text not null,
  phone text not null,
  email text not null default '',
  status text not null default 'pending' check (status in ('pending','paid','cancelled','expired','failed')),
  payment_key text,
  method text,
  receipt_url text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists orders_session_idx on orders (session_id, status);
create index if not exists orders_code_idx on orders (code, phone);
alter table orders enable row level security;

-- 정원 확인 + 좌석 홀드를 한 트랜잭션에서 처리 (회차별 잠금으로 동시 예약 초과 방지)
create or replace function create_pending_order(
  p_order_id text, p_code text, p_class_slug text, p_session_id text, p_session_at timestamptz,
  p_headcount int, p_amount int, p_name text, p_phone text, p_email text,
  p_capacity int, p_hold_minutes int
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
  result orders;
begin
  perform pg_advisory_xact_lock(hashtext(p_session_id));
  select coalesce(sum(headcount), 0) into used
    from orders
   where session_id = p_session_id
     and (status = 'paid' or (status = 'pending' and created_at > now() - make_interval(mins => p_hold_minutes)));
  if used + p_headcount > p_capacity then
    raise exception 'SOLD_OUT';
  end if;
  insert into orders (order_id, code, class_slug, session_id, session_at, headcount, amount, name, phone, email)
  values (p_order_id, p_code, p_class_slug, p_session_id, p_session_at, p_headcount, p_amount, p_name, p_phone, p_email)
  returning * into result;
  return result;
end;
$$;

revoke all on function create_pending_order from public, anon, authenticated;
