-- Ensure user_settings has owner-only RLS policies (SELECT, INSERT, UPDATE, DELETE).
-- Idempotent: creates only missing policies. Run in production if UPDATE fails for logged-in users.

begin;

alter table if exists public.user_settings enable row level security;

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

commit;
