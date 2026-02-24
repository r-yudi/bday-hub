-- Fase B: categorias (guest + Supabase sync)
-- - birthdays salva categorias como texto em text[] (sem FK)
-- - user_categories guarda sugestões custom por usuário para UX
-- - script idempotente para rodar no Supabase SQL Editor / migrations

begin;

-- ============================================================
-- birthdays: adicionar categories text[] e backfill de dados legados
-- ============================================================

do $$
declare
  has_birthdays boolean;
  has_categories boolean;
  has_tags boolean;
  has_category boolean;
begin
  has_birthdays := to_regclass('public.birthdays') is not null;
  if not has_birthdays then
    raise notice 'Tabela public.birthdays não encontrada. Pulando ajustes de categories.';
    return;
  end if;

  alter table public.birthdays
    add column if not exists categories text[] not null default '{}'::text[];

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'birthdays' and column_name = 'categories'
  ) into has_categories;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'birthdays' and column_name = 'tags'
  ) into has_tags;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'birthdays' and column_name = 'category'
  ) into has_category;

  if has_categories and has_tags and has_category then
    execute $sql$
      update public.birthdays
      set categories = case
        when categories is not null and coalesce(array_length(categories, 1), 0) > 0 then categories
        when tags is not null and coalesce(array_length(tags, 1), 0) > 0 then tags
        when category is not null and btrim(category) <> '' then array[category]
        else '{}'::text[]
      end
      where categories is null
         or coalesce(array_length(categories, 1), 0) = 0
    $sql$;
  elsif has_categories and has_tags then
    execute $sql$
      update public.birthdays
      set categories = case
        when categories is not null and coalesce(array_length(categories, 1), 0) > 0 then categories
        when tags is not null and coalesce(array_length(tags, 1), 0) > 0 then tags
        else '{}'::text[]
      end
      where categories is null
         or coalesce(array_length(categories, 1), 0) = 0
    $sql$;
  elsif has_categories and has_category then
    execute $sql$
      update public.birthdays
      set categories = case
        when categories is not null and coalesce(array_length(categories, 1), 0) > 0 then categories
        when category is not null and btrim(category) <> '' then array[category]
        else '{}'::text[]
      end
      where categories is null
         or coalesce(array_length(categories, 1), 0) = 0
    $sql$;
  end if;

  alter table public.birthdays
    alter column categories set default '{}'::text[],
    alter column categories set not null;
end $$;

-- ============================================================
-- user_categories: catálogo de categorias custom do usuário (owner-only)
-- ============================================================

create table if not exists public.user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists user_categories_user_id_idx
  on public.user_categories (user_id);

-- Índice único case-insensitive para evitar duplicatas por usuário
create unique index if not exists user_categories_user_id_lower_name_uidx
  on public.user_categories (user_id, lower(name));

alter table public.user_categories enable row level security;

-- Remove policies antigas (se existirem com definição diferente) e recria mínimo owner-only idempotente
DO $$
BEGIN
  IF to_regclass('public.user_categories') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_categories' AND policyname = 'user_categories_select_own'
  ) THEN
    CREATE POLICY user_categories_select_own
      ON public.user_categories
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_categories' AND policyname = 'user_categories_insert_own'
  ) THEN
    CREATE POLICY user_categories_insert_own
      ON public.user_categories
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_categories' AND policyname = 'user_categories_update_own'
  ) THEN
    CREATE POLICY user_categories_update_own
      ON public.user_categories
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_categories' AND policyname = 'user_categories_delete_own'
  ) THEN
    CREATE POLICY user_categories_delete_own
      ON public.user_categories
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

commit;
