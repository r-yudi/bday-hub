# Changelog

Todos os releases acompanham o padrao SemVer.

## [Unreleased]

### Added
- Multi-device sync de aniversarios com Supabase quando logado (fallback local mantido quando nao logado)
- Ferramentas de debug de auth Supabase em `/debug/supabase` (health, session/getUser, teste de DB e limpar sessao local)
- Fluxo de login Google com redirect robusto via `/auth/callback` (retry curto para consolidar sessao)
- Google login com Supabase (OAuth Google), sessao persistente e logout no app
- Pagina `/login` com CTA "Entrar com Google" e redirecionamento com `returnTo`
- Protecao de rotas principais (`/today`, `/upcoming`, `/share`) exigindo login quando Supabase estiver configurado
- Tela de debug `/debug/auth` (somente dev) para validar sessao e query real em `birthdays` (`Auth OK` / `DB OK`)
- Rename de branding do produto/app de BdayHub para Lembra (UI, metadata, manifest e docs)
- Banner contextual de instalacao PWA (sem popup automatico) com CTA `Instalar`
- Instrucoes de instalacao para iOS ("Adicionar a Tela de Inicio") e Desktop Chrome
- CTA destacado `Copiar link` em `/share/[token]` com feedback visual "Link copiado"
- Rota `/share` (sem token) com pagina amigavel explicando como gerar o link de compartilhamento
- `/share` com lista de aniversarios para gerar/copiar links rapidamente
- Cadastro rapido em modal na rota `/share` quando nao ha aniversarios cadastrados
- Micro onboarding com progresso 0-5 aniversarios em `/today` e `/upcoming`
- Toast discreto de onboarding ao adicionar aniversario (incluindo estado especial ao completar setup)

### Fixed
- Debug de DB em `/debug/supabase` agora usa `user_settings.user_id` (sem depender de coluna `id`) e valida RLS com upsert/select do proprio usuario
- `/debug/supabase` ganhou teste de `birthdays` (count + upsert/delete dummy) para validar acesso com RLS
- UX da pagina `/share/[token]` com layout centralizado, mais espacamento e contexto claro sobre privacidade (sem ano)
- Empty state de `/today` com icone/ilustracao simples e CTAs para adicionar aniversario e ver proximos 7 dias
- Badge "Lembrete enviado hoje" quando o lembrete do dia ja foi disparado
- Copy das notificacoes best-effort refinada para singular/plural
- Hydration mismatch em `/today` ao adiar leituras de `window` e `Notification` para apos mount
- Card de notificacoes simplificado com resumo amigavel e detalhes tecnicos opcionais
- Copy mais humana no empty state de `/today` e no banner de instalacao PWA
- Banner PWA refinado para versao compacta com accordion "Como instalar" e opcao de dispensar por 30 dias
- Acao "Limpar todos os dados" com modal de confirmacao e digitacao de `LIMPAR`
- Cartoes de aniversarios com hierarquia visual de acoes, feedback de copia e atalho compacto para Instagram
- Onboarding com copy mais motivadora, estado de conclusao (5/5) e ocultacao automatica
- Persistencia em localStorage para nao reexibir onboarding apos setup completo

### Chore
- Adicionado `docs/sql/verify_schema.sql` para verificar/preparar PK/FK/RLS de `user_settings` e `birthdays` no Supabase

---

## [v0.1.0] - Initial MVP Release
### Added
- Pagina /today com lista de aniversariantes
- Pagina /upcoming com proximos 7 dias
- Adicao/edicao/exclusao de aniversarios
- Import CSV basico (formato: name,day,month,tags,...)
- Notificacoes best-effort (quando o app e aberto)
- Share v1 com link de aniversario (nome + data)
- PWA basico com manifest e service worker

### Changed
- -

### Fixed
- -

