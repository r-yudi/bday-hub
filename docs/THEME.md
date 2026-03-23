# Tema (claro / escuro / sistema)

## Estado atual

O app suporta **três modos de tema**:

- **Claro** (`light`) — cream/paper, alinhado à landing.
- **Escuro** (`dark`) — base near-black, superfícies quentes, acento laranja preservado (`app/styles/tokens.css`, bloco `.dark`).
- **Sistema** (`system`) — segue `prefers-color-scheme` do SO/navegador.

A classe `.dark` é aplicada em `<html>` quando o tema resolvido é escuro.

## Onde é aplicado

- **`lib/theme.ts`**
  - `getStoredThemeMode()` lê `localStorage` (`lembra_theme`); padrão **`system`** se ausente ou inválido.
  - `resolveThemeMode(mode)` resolve `system` via `matchMedia('(prefers-color-scheme: dark)')`.
  - `applyThemeToDocument(mode)` alterna `.dark` em `<html>`, define `data-theme` com o modo **lógico** (`light` | `dark` | `system`) e `color-scheme` com o modo **resolvido**.
  - `getThemeBootScript()` — script inline no `RootLayout` antes do React para reduzir flash de tema.
- **`components/ThemeProvider.tsx`**
  - Hidrata a partir do storage; escuta mudanças de `prefers-color-scheme` quando o modo é `system`.
  - Com usuário logado: carrega `user_settings.theme` (Supabase) após auth inicializada; ao alterar tema, persiste local + remoto.
- **`components/ThemeModeControl.tsx` + `components/TopNav.tsx`**
  - Controle segmentado **Claro / Escuro / Sistema** na barra superior (app e landing).

## Persistência

| Contexto        | Onde                                              |
|-----------------|---------------------------------------------------|
| Guest / local   | `localStorage` chave `lembra_theme`               |
| Conta logada    | Mesmo storage + coluna `user_settings.theme` (sync) |

Migração SQL: `supabase/migrations/20260224_add_theme_to_user_settings.sql` (default `system`).

## Tailwind

`tailwind.config.ts` usa `darkMode: "class"` — utilitários `dark:` dependem da classe `.dark` no ancestral (normalmente `<html>`).

## Referências

- [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- [docs/PRODUCT_UI_PHILOSOPHY.md](PRODUCT_UI_PHILOSOPHY.md)
