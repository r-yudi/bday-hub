# Lembra - SPEC v2 (Supabase + Google + Email)

## 0) Principios
- Adicionar robustez ao app de aniversarios sem virar plataforma.
- Backend minimo: Auth + DB + job de e-mail.
- Manter UX atual (today/upcoming/person/share).
- Nao armazenar ano de nascimento.

## 1) Stack v2
- Frontend: Next.js (App Router) + TS + Tailwind (mantem)
- Backend: Supabase (Postgres + Auth Google + RLS)
- Email provider: Resend (recomendado) ou SendGrid
- Jobs/cron: Supabase Scheduled Functions (ou cron externo chamando endpoint)
- Opcional (v2.1): cache offline com IndexedDB (nao obrigatorio no primeiro corte v2)

## 2) Migracao de arquitetura (MVP -> v2)
### Fonte de verdade
- v1: IndexedDB/localStorage
- v2: Supabase DB

### Estrategia de migracao (sem dor pro usuario)
1) Introduzir login + DB.
2) Quando usuario logar:
   - carregar birthdays do DB
   - oferecer "Importar dados locais" (one-time)
3) Depois de importado:
   - app usa DB para CRUD

## 3) Estrutura de pastas (adicoes)
/lib
  supabaseClient.ts
  db.ts                  # wrappers CRUD
  auth.ts                # signIn/signOut/session helpers
  migrateLocal.ts        # importar dados do IndexedDB/localStorage -> DB
  googleImport.ts        # chamada People API via Next route
/app
  /login
  /settings              # email on/off, horario, export/delete
  /api
    /google
      /people/route.ts   # fetch birthdays from People API (server-side)
    /cron
      /email/route.ts    # endpoint protegido para disparo de e-mails (se nao usar Scheduled Fn)
  /today
  /upcoming
  /person
  /share
  /share/[token]

## 4) Banco de dados (Supabase)

### 4.1 Tabelas
#### birthdays
- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users(id)
- name text not null
- day int not null
- month int not null
- source text not null ('manual'|'csv'|'shared'|'google')
- tags text[] not null default '{}'
- notes text null
- whatsapp text null
- instagram text null
- other_link text null
- created_at timestamptz default now()
- updated_at timestamptz default now()

Indice:
- (user_id, month, day)

#### user_settings
- user_id uuid primary key references auth.users(id)
- email_enabled boolean not null default false
- email_time text not null default '09:00'  # horario local do usuario
- weekly_enabled boolean not null default false
- timezone text not null default 'America/Sao_Paulo'
- last_daily_sent date null
- last_weekly_sent date null
- created_at timestamptz default now()
- updated_at timestamptz default now()

### 4.2 RLS (Row Level Security)
- birthdays:
  - SELECT/INSERT/UPDATE/DELETE apenas quando user_id = auth.uid()
- user_settings:
  - SELECT/UPSERT apenas quando user_id = auth.uid()

## 5) Auth (Google)
- Supabase Auth com provider Google
- UI:
  - /login com botao "Entrar com Google"
  - TopNav mostra estado logado e botao "Sair"

## 6) CRUD sincronizado
- Todas as operacoes atuais (create/update/delete/list) passam a bater no DB.
- UI deve continuar identica.
- Ao deslogar: opcional manter modo local (v2.0 pode exigir login para usar sync).

## 7) Import Google Contacts (People API)
### 7.1 Como
- Usar escopos minimos no OAuth:
  - https://www.googleapis.com/auth/contacts.readonly
- Implementar route server-side /api/google/people:
  - le access token da sessao do Supabase (Google provider)
  - chama Google People API
  - extrai birthdays e nomes
  - normaliza para {name, day, month, source:'google'}

### 7.2 UX
- Botao em /today ou /settings: "Importar do Google"
- Modal:
  - carregando + preview lista
  - checkbox "pular duplicados" (default on)
  - botao "Importar"

### 7.3 Dedupe (v2.0)
- Chave de duplicidade:
  - normalizar name (lowercase trim) + day + month
- Se ja existir igual no DB: nao importar (default)
- Permitir "importar mesmo assim" (toggle)

## 8) Email notificacoes (confiavel)
### 8.1 Conteudo
- Daily:
  - assunto: "Hoje: aniversarios 🎉"
  - corpo: lista de nomes de hoje + CTA para abrir app
- Weekly (opcional):
  - assunto: "Proximos 7 dias 🎉"
  - corpo: lista por dia

### 8.2 Disparo
Opcao A (recomendada): Supabase Scheduled Function
- Roda a cada 15 min
- Seleciona usuarios com email_enabled
- Checa timezone + email_time
- Evita duplicar usando last_daily_sent/last_weekly_sent

Opcao B: endpoint /api/cron/email protegido por header secret
- Cron externo chama diariamente

### 8.3 Timezone
- user_settings.timezone default America/Sao_Paulo
- email_time "HH:MM"
- No job: calcular hora atual no timezone e disparar quando estiver no minuto alvo.

## 9) Seguranca
- Nao armazenar ano.
- Token share continua sem dados sensiveis (nome + dia/mes).
- Secrets em env vars (Vercel + Supabase).
- Endpoint cron protegido (se usar).

## 10) Testes
- Unit:
  - dedupe key
  - normalizacao People API -> BirthdayPerson
- E2E (Playwright):
  - login flow (mock/stub se necessario)
  - CRUD apos login
  - import modal (pode mockar route /api/google/people)
- Build deve continuar passando

## 11) Env vars
Frontend:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Server:
- SUPABASE_SERVICE_ROLE_KEY (somente em server/cron, nunca no client)
- RESEND_API_KEY (ou SENDGRID_API_KEY)
- CRON_SECRET (se usar endpoint)

## 12) Plano de rollout (recomendado)
- v0.2.0:
  - Auth + DB + CRUD sync
  - migracao local -> DB
- v0.2.1:
  - Import Google Contacts
- v0.2.2:
  - Email daily
- v0.2.3:
  - Weekly + refinamentos + metricas
