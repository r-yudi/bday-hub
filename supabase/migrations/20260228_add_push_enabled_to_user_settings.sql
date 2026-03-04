-- push_enabled: opt-in para notificações push (PWA instalada, complementar ao email)
alter table if exists public.user_settings
  add column if not exists push_enabled boolean not null default false;
