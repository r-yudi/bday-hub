-- Hardening de leitura pública em share_links
-- Objetivo:
-- 1) Remover policies de SELECT na tabela public.share_links
-- 2) Evitar leitura/listagem direta via REST
-- 3) Expor leitura por id somente via RPC security definer

begin;

-- Se a tabela não existir, apenas avisa e encerra (script seguro para reexecução)
do $$
begin
  if to_regclass('public.share_links') is null then
    raise notice 'Table public.share_links not found. Skipping.';
    return;
  end if;
end $$;

-- Remove qualquer policy de SELECT existente (inclusive pública "using true")
do $$
declare
  policy_rec record;
begin
  if to_regclass('public.share_links') is null then
    return;
  end if;

  for policy_rec in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.share_links', policy_rec.policyname);
    raise notice 'Dropped SELECT policy on public.share_links: %', policy_rec.policyname;
  end loop;
end $$;

-- Defesa adicional: revoga SELECT direto (REST/PostgREST depende de grants + RLS)
revoke select on table public.share_links from anon, authenticated, public;

-- RPC segura para leitura por id
create or replace function public.get_share_link(p_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select payload
  from public.share_links
  where id = p_id
  limit 1;
$$;

-- Opcional de segurança: evitar execute amplo e liberar só anon/authenticated
revoke all on function public.get_share_link(text) from public;
grant execute on function public.get_share_link(text) to anon, authenticated;

-- Verificação rápida
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'share_links'
order by policyname;

commit;
