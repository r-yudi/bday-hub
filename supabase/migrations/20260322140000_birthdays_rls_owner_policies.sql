-- Align with docs/sql/verify_schema.sql (birthdays section): RLS + owner-only policies.
-- Idempotent: safe if policies already exist from a manual run.
-- Does not alter columns; see PRD/SPEC if user_id NULL rows need cleanup (non-destructive).

begin;

alter table if exists public.birthdays enable row level security;

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

commit;
