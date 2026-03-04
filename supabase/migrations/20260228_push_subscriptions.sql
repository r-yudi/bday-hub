-- push_subscriptions: armazena subscription Web Push por usuário (endpoint + keys)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  unique (endpoint)
);

create index if not exists push_subscriptions_user_created_idx
  on public.push_subscriptions (user_id, created_at desc);

alter table public.push_subscriptions enable row level security;

do $$
begin
  if to_regclass('public.push_subscriptions') is null then return; end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_select_own') then
    create policy push_subscriptions_select_own on public.push_subscriptions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_insert_own') then
    create policy push_subscriptions_insert_own on public.push_subscriptions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_update_own') then
    create policy push_subscriptions_update_own on public.push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_delete_own') then
    create policy push_subscriptions_delete_own on public.push_subscriptions for delete using (auth.uid() = user_id);
  end if;
end $$;
