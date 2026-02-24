-- Lembra. / Supabase v2 schema verification + RLS prep
-- Run in Supabase SQL Editor (project database).
-- Goal:
-- 1) Verify user_settings PK is user_id and FK -> auth.users(id)
-- 2) Verify birthdays has user_id + FK + index
-- 3) Ensure minimal RLS policies (owner-only) for user_settings and birthdays
-- 4) Keep script idempotent where possible

begin;

-- ============================================================
-- 1) Introspection summary
-- ============================================================

-- Existing columns / types
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_settings', 'birthdays')
order by table_name, ordinal_position;

-- Existing PK/FK constraints
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
 and tc.table_name = kcu.table_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
 and tc.table_schema = ccu.table_schema
where tc.table_schema = 'public'
  and tc.table_name in ('user_settings', 'birthdays')
  and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')
order by tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================
-- 2) user_settings hardening (PK/FK/timestamps)
-- ============================================================

-- Add timestamps if missing (no trigger; app can update updated_at manually in MVP)
alter table if exists public.user_settings
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- If no PK exists, create PK on user_id.
do $$
declare
  has_pk boolean;
  user_id_is_pk boolean;
begin
  if to_regclass('public.user_settings') is null then
    raise notice 'Table public.user_settings not found. Skipping user_settings PK/FK checks.';
    return;
  end if;

  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'user_settings'
      and c.contype = 'p'
  ) into has_pk;

  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) with ordinality as cols(attnum, ord) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = cols.attnum
    where n.nspname = 'public'
      and t.relname = 'user_settings'
      and c.contype = 'p'
    group by c.oid
    having array_agg(a.attname order by cols.ord) = array['user_id']::name[]
  ) into user_id_is_pk;

  if not has_pk then
    execute 'alter table public.user_settings add constraint user_settings_pkey primary key (user_id)';
    raise notice 'Created PK user_settings_pkey on (user_id).';
  elsif not user_id_is_pk then
    raise notice 'user_settings already has a PK, but not exactly (user_id). Review manually.';
  else
    raise notice 'user_settings PK already OK on (user_id).';
  end if;
end $$;

-- Ensure FK user_settings.user_id -> auth.users(id) with ON DELETE CASCADE
do $$
begin
  if to_regclass('public.user_settings') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'public'
      and t.relname = 'user_settings'
      and c.contype = 'f'
      and a.attname = 'user_id'
  ) then
    alter table public.user_settings
      add constraint user_settings_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
    raise notice 'Created FK user_settings.user_id -> auth.users(id)';
  else
    raise notice 'FK on user_settings.user_id already exists';
  end if;
end $$;

-- ============================================================
-- 3) birthdays prep (user_id + FK + index + timestamps)
-- ============================================================

do $$
begin
  if to_regclass('public.birthdays') is null then
    raise notice 'Table public.birthdays not found. Skipping birthdays prep.';
    return;
  end if;

  alter table public.birthdays
    add column if not exists user_id uuid,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

  create index if not exists birthdays_user_id_month_day_idx on public.birthdays (user_id, month, day);

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'public'
      and t.relname = 'birthdays'
      and c.contype = 'f'
      and a.attname = 'user_id'
  ) then
    alter table public.birthdays
      add constraint birthdays_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
    raise notice 'Created FK birthdays.user_id -> auth.users(id)';
  else
    raise notice 'FK on birthdays.user_id already exists';
  end if;
end $$;

-- ============================================================
-- 4) RLS enablement + owner-only policies (minimal)
-- ============================================================

alter table if exists public.user_settings enable row level security;
alter table if exists public.birthdays enable row level security;

-- user_settings owner-only policies
do $$
begin
  if to_regclass('public.user_settings') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_select_own'
  ) then
    create policy user_settings_select_own
      on public.user_settings
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_insert_own'
  ) then
    create policy user_settings_insert_own
      on public.user_settings
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_update_own'
  ) then
    create policy user_settings_update_own
      on public.user_settings
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_delete_own'
  ) then
    create policy user_settings_delete_own
      on public.user_settings
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- birthdays owner-only policies
do $$
begin
  if to_regclass('public.birthdays') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'birthdays' and policyname = 'birthdays_select_own'
  ) then
    create policy birthdays_select_own
      on public.birthdays
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'birthdays' and policyname = 'birthdays_insert_own'
  ) then
    create policy birthdays_insert_own
      on public.birthdays
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'birthdays' and policyname = 'birthdays_update_own'
  ) then
    create policy birthdays_update_own
      on public.birthdays
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'birthdays' and policyname = 'birthdays_delete_own'
  ) then
    create policy birthdays_delete_own
      on public.birthdays
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- 5) Verification outputs (after remediation)
-- ============================================================

select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('user_settings', 'birthdays')
order by tablename;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('user_settings', 'birthdays')
order by tablename, policyname;

commit;
