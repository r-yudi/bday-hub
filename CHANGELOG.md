# Changelog

Todos os releases acompanham o padrão SemVer.

## [Unreleased]

### Added
- Playwright E2E smoke tests para flows criticos do MVP (CRUD, import CSV, persistencia apos reload e `/share/[token]`)
- Script `npm run test:e2e` com configuracao Playwright para subir o app via Next.js localmente
- (a documentar) PWA install polish
- (a documentar) Share v1 UX improvements

### Fixed
- (a documentar) CSV import validations
- (a documentar) UX tweaks

---

## [v0.1.0] - Initial MVP Release
### Added
- Página /today com lista de aniversariantes
- Página /upcoming com próximos 7 dias
- Adição/edição/exclusão de aniversários
- Import CSV básico (formato: name,day,month,tags,…)
- Notificações best-effort (quando o app é aberto)
- Share v1 com link de aniversário (nome + data)
- PWA básico com manifest e service worker

### Changed
- —

### Fixed
- —
