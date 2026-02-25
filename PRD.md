# Lembra. — PRD (baseline + status atual)

## Status do projeto (atualizado em 2026-02-24)

### Resumo executivo
- Produto reposicionado como **Lembra.** (foco exclusivo em aniversários).
- App em produção com domínio canônico planejado/metadata: `https://uselembra.com.br`.
- Deploy ativo também em: `https://bday-hub.vercel.app`.
- Repositório: `https://github.com/r-yudi/bday-hub`.
- Modelo atual: **guest/local-first** (funciona sem login) + **sync com Supabase quando logado**.
- Stack principal mantida (Next.js App Router + TypeScript + Tailwind + PWA) com Supabase para auth/sync.

### Estado funcional atual (baseline real)
- Landing pública em `/` (CTA para começar e login).
- `/` é o entrypoint de marketing do produto (landing). Não redirecionar automaticamente para `/today` ou `/login`.
- Rotas principais do app:
  - `/today`
  - `/upcoming`
  - `/person`
  - `/share`
  - `/share/[token]`
- Auth Google via Supabase (`/login`, `/auth/callback`) com sessão persistente.
- Sync de aniversários multi-device quando logado (RLS validado).
- Modo sem login continua funcionando com persistência local (IndexedDB + fallback localStorage).
- Página de privacidade (`/privacy`) e termos (`/terms`).
- Ferramentas de diagnóstico (`/debug/auth`, `/debug/supabase`) disponíveis em dev e bloqueadas em produção.
- Endpoint de saúde `/healthz` para smoke test.

### UX e retenção já implementados
- Onboarding leve com progresso (5 aniversários) + feedback visual.
- Toasts discretos ao adicionar aniversários.
- PWA install banner contextual (compacto, com dismiss e instruções).
- Dark mode (`Claro / Escuro / Sistema`) com persistência local e remota (`user_settings.theme`).
- Contrato visual compartilhado via utilitários `ui-*` (tipografia, CTAs, links tertiary, callouts/disclosures, overlays/modais).
- Cartões com ações de copiar mensagem/link e feedback visual.
- Footer global com links para privacidade e termos nas páginas internas.

### Dados e sincronização (atual)
- Birthdays com compatibilidade legada e esquema atual baseado em `categories` (texto / `text[]` no Supabase).
- Categorias predefinidas + custom:
  - guest: local-first
  - logado: `user_categories` no Supabase (owner-only via RLS)
- Auth + DB + RLS já validados end-to-end em `/debug/supabase`.
- Hardening de `share_links` documentado via RPC segura (sem SELECT público direto).

### Validação contínua
- `npm run build` passando
- `npm test` passando
- `npm run test:e2e` (Playwright smoke) passando

## 1) Problema
Hoje os aniversários estão espalhados (contatos, redes sociais, anotações). O usuário quer um lugar simples para:
- ver aniversariantes do dia
- ser lembrado
- agir rápido (copiar mensagem / abrir link)
- manter a lista disponível em mais de um dispositivo quando fizer login

## 2) Objetivo do produto
**O app definitivo para nunca esquecer aniversários.**

Objetivo de entrega incremental:
- manter uma experiência excelente sem login (guest/local-first)
- oferecer login Google e sincronização quando o usuário quiser
- preservar simplicidade, velocidade e privacidade

## 3) Público-alvo
Pessoas que mantêm relações em múltiplos contextos (família, amigos, trabalho, escola etc.) e querem lembrar aniversários com menos esforço e mais consistência.

## 4) Casos de uso principais (estado atual)
1. Usuário adiciona aniversários manualmente (com categorias) ou importa CSV.
2. Usuário abre o app e vê quem faz aniversário hoje / próximos 7 dias.
3. Usuário copia mensagem pronta ou abre link para parabenizar.
4. Usuário compartilha o próprio aniversário por link (`/share/[token]`).
5. Usuário entra com Google para sincronizar aniversários entre dispositivos.

## 5) Escopo (baseline atual)
### 5.1 Incluído e entregue
- Listas “Hoje” e “Próximos 7 dias”
- CRUD de aniversários
- Importação CSV com preview e validação
- Templates de mensagem + copiar
- Links rápidos (WhatsApp / Instagram / outro)
- Notificação best-effort ao abrir o app
- Compartilhamento client-only (`/share/[token]`) sem ano
- Login Google com Supabase + sessão persistente
- Sync de aniversários com Supabase quando logado
- Categorias predefinidas e custom (guest + Supabase)
- Dark mode e refinamentos de UX/PWA

### 5.2 Restrições mantidas
- Sem backend próprio (usa Supabase diretamente)
- Sem push/email/cron neste baseline
- Sem ano de nascimento
- Sem social graph interno

## 6) Fora de escopo (por enquanto)
- Google Contacts import
- Notificações confiáveis em background (push/email/cron)
- Revogação granular de link de share com painel completo
- Dedupe/merge avançado na importação CSV
- Gestão avançada (ex.: bulk actions complexas em `/manage`)

## 7) Requisitos não-funcionais (atualizados)
- **Resiliência de sessão**: app não deve quebrar com refresh token inválido; fallback para guest.
- **Privacidade**: links compartilham apenas nome + dia/mês; sem ano.
- **Compatibilidade**: manter leitura de dados legados (`tags` / estruturas anteriores) sem quebrar UX.
- **Baixo atrito**: guest/local-first sempre disponível.

## 8) Métricas (mantidas / ajustadas)
- Ativação: usuário adiciona >= 5 aniversários rapidamente
- Retenção: retorno recorrente e uso de cópia de mensagem
- Conversão opcional: login Google para sync após valor percebido no modo guest

## 9) Critérios de aceite do baseline atual
- Ao abrir `/`, usuário vê a landing (marketing) como página inicial do produto.
- Usuário consegue (sem login):
  1. adicionar/editar/excluir aniversários
  2. importar CSV
  3. ver Hoje e Próximos 7 dias
  4. copiar mensagem com 1 clique
  5. usar `/share/[token]` e adicionar à lista
- Usuário consegue (com login):
  1. entrar com Google
  2. manter sessão após refresh
  3. sincronizar aniversários entre dispositivos
- Build/testes/E2E smoke passam

## 10) Observação de baseline histórico
Este PRD substitui o framing inicial de MVP client-only como descrição do **estado atual do produto**, mas preserva a direção de simplicidade, baixo custo e foco em aniversários.
