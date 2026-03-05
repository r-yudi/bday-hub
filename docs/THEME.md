# Tema (light-only)

## Estado atual: light-only (pre-launch)

O app funciona **apenas em light mode**. O dark mode não pode ser ativado por storage, system nem UI.

- **Objetivo:** Reduzir manutenção e risco de UI inconsistente no lançamento; estética alinhada à landing (cream/paper).
- **Reativação futura:** Os tokens `.dark` permanecem em `app/styles/tokens.css` e em `app/globals.css`; apenas a classe `.dark` não é aplicada no `<html>`. Para reativar, reverter as mudanças em `lib/theme.ts` e `components/ThemeProvider.tsx` e restaurar o seletor de tema no TopNav.

## Onde o light-only é aplicado

- **lib/theme.ts**
  - `applyThemeToDocument(mode)` ignora o argumento e sempre: `root.classList.remove("dark")`, `root.dataset.theme = "light"`, `root.style.colorScheme = "light"`.
  - `getStoredThemeMode()` retorna sempre `"light"` e remove a chave `lembra_theme` do localStorage.
  - `getThemeBootScript()` (inline no layout): sempre aplica light; nunca adiciona `.dark`.
- **components/ThemeProvider.tsx**
  - Estado fixo `"light"`; `setThemeMode` só chama `applyThemeToDocument("light")` quando o modo passado é `"light"` (dark/system são no-op).
  - Não há leitura de preferência remota nem de `prefers-color-scheme` para aplicar tema.
- **components/TopNav.tsx**
  - Não há seletor de tema (nem na landing nem nas rotas do app). O componente não renderiza o dropdown de tema.

## Tokens .dark

As regras CSS que usam `.dark` (em `app/styles/tokens.css` e `app/globals.css`) **continuam no código** mas não têm efeito, pois a classe `.dark` nunca é aplicada no elemento raiz. Comentários "dark disabled pre-launch" indicam isso nos arquivos.
