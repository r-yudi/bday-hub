alter table if exists public.user_settings
  add column if not exists email_enabled boolean not null default false,
  add column if not exists email_time text not null default '09:00',
  add column if not exists timezone text not null default 'America/Sao_Paulo',
  add column if not exists last_daily_email_sent_on date null;

alter table if exists public.user_settings
  drop constraint if exists user_settings_email_time_format;

alter table if exists public.user_settings
  add constraint user_settings_email_time_format
  check (email_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
