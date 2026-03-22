-- Campo opcional "Como chamar" (nickname) para mensagem sugerida no dia do aniversário (V2).

begin;

alter table public.birthdays
  add column if not exists nickname text;

comment on column public.birthdays.nickname is 'Saudação curta na mensagem sugerida; opcional.';

commit;
