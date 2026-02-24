alter table if exists public.user_settings
  add column if not exists theme text not null default 'system'
  check (theme in ('light', 'dark', 'system'));
