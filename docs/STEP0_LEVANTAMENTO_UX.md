# Passo 0 — Levantamento (somente leitura) — UX 3 telas

## Rotas atuais

| Rota | Arquivo | Conteúdo |
|------|---------|----------|
| /today | `app/(app)/today/page.tsx` | Home: lista "Hoje", onboarding, Import CSV, **cards Lembretes + Email diário + Push + Dados** (aside), ClearData modal |
| /upcoming | `app/(app)/upcoming/page.tsx` | Lista próximos 7 dias |
| /manage | `app/(app)/manage/page.tsx` | Tabs "Aniversários" | "Categorias"; aniversários: busca + filtros (categoria, origem, mês), lista com Editar/Excluir; categorias: CRUD custom |
| /person | `app/(app)/person/page.tsx` | Form cadastro/edição (id via query ?id=) |

## Onde ficam os cards de configuração

- **Arquivo:** `app/(app)/today/page.tsx`
- **Blocos (aside, ordem):**
  1. **Lembretes** (~linha 524): `ui-feature-block`, título "Lembretes", horário do lembrete (selects 24h), toggle ativar/desativar, details "Ver detalhes técnicos"
  2. **Email diário** (~linha 601): `ui-feature-block`, título "Email diário", toggle Ativar/Desativar, horário + timezone (selects 24h), último envio
  3. **Push** (~linha 727): `ui-feature-block`, título "Push (complementar)"
  4. **Dados** (~linha 768): `ui-feature-block`, limpar dados + modal ClearData

## Navegação (TopNav / AppShell)

- **TopNav:** `components/TopNav.tsx`
  - `navItems = [{ href: "/today", label: "Hoje" }, { href: "/upcoming", label: "Próximos 7 dias" }]`
  - Tabs renderizadas como `Link` com classe `topnav-pill` / `topnav-pill-active` conforme `pathname === item.href`
  - Conta/sync à direita quando configurado
- **AppShell:** `components/AppShell.tsx`
  - Envolve `TopNav` + `{children}`; SessionGuardNotice; PwaInstallBanner; footer com links privacidade/termos

## Lista de aniversários em /manage

- **Repos:** `listBirthdays()`, `deleteBirthday()` de `@/lib/birthdaysRepo`
- **Helpers:** `getPersonCategories`, `normalizeCategory`, `PREDEFINED_CATEGORIES`, `dedupeCategoryNames`, `extractCategoriesFromPerson` de `@/lib/categories`
- **Filtros:** busca textual, categoria (select), origem (manual/csv/shared), mês (select)
- **Item da lista:** nome + Chip dia/mês + Chip source + chips categorias + Link "Editar" (`/person?id=...`) + Button "Excluir" (confirm + deleteBirthday)
- **Estados:** loading (Card "Carregando..."), empty total, empty filtros (ui-empty-hero "Nada por aqui com esses filtros"), error (Alert)

## PersonCard

- **Arquivo:** `components/PersonCard.tsx`
  - Usado em /today para cada aniversariante do dia (copiar mensagem, link, excluir)
  - Não usado em /manage; em /manage é uma linha custom (nome + chips + Editar + Excluir)

## Arquivos-chave (referência para /people)

- `app/(app)/manage/page.tsx` — lógica loadData, filteredPeople, handleDeleteBirthday, filtros, list item JSX
- `lib/birthdaysRepo.ts` — listBirthdays, deleteBirthday
- `lib/categories.ts` — getPersonCategories (via extractCategoriesFromPerson + dedupeCategoryNames), normalizeCategory, PREDEFINED_CATEGORIES
- `lib/types.ts` — BirthdayPerson, SourceType
- `components/ui/Alert.tsx`, `components/ui/Button.tsx`, `components/ui/Field.tsx` (TextInput, SelectField, FieldGroup, FieldLabel), `components/ui/Chip.tsx` — usados em manage
- Design System: `app/globals.css` — ui-container, ui-section, ui-section-header, ui-list, ui-list-item, ui-empty-hero, ui-cta-primary, ui-cta-secondary, ui-feature-block
