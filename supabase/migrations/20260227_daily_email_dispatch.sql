-- daily_email_dispatch: idempotência real para email diário (insert-first, UNIQUE user_id+date_key)
-- RLS: SELECT owner-only; INSERT/UPDATE apenas via service_role (cron no servidor)

create table if not exists public.daily_email_dispatch (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  status text not null check (status in ('pending','sent','skipped','error')),
  sent_at timestamptz null,
  error_message text null,
  created_at timestamptz not null default now(),
  unique (user_id, date_key)
);

create index if not exists daily_email_dispatch_user_created_idx
  on public.daily_email_dispatch (user_id, created_at desc);

alter table public.daily_email_dispatch enable row level security;

-- SELECT: owner-only (UI lê último envio/status)
do $$
begin
  if to_regclass('public.daily_email_dispatch') is null then
    return;
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'daily_email_dispatch' and policyname = 'daily_email_dispatch_select_own'
  ) then
    create policy daily_email_dispatch_select_own
      on public.daily_email_dispatch
      for select
      using (auth.uid() = user_id);
  end if;
end $$;
