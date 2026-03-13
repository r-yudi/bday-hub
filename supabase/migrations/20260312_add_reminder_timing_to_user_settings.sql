-- reminder_timing: day_of = digest for today's birthdays, day_before = digest for tomorrow's birthdays (reminder one day before)
alter table if exists public.user_settings
  add column if not exists reminder_timing text not null default 'day_of';

alter table if exists public.user_settings
  drop constraint if exists user_settings_reminder_timing_check;

alter table if exists public.user_settings
  add constraint user_settings_reminder_timing_check
  check (reminder_timing in ('day_of', 'day_before'));
