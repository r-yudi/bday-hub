# BdayHub â€” SPEC (MVP)

## Status de implementacao (atualizado em 2026-02-23)

### Estado geral
- SPEC do MVP implementada e publicada em producao.
- URL de producao: https://bday-hub.vercel.app
- Repositorio: https://github.com/r-yudi/bday-hub
- Releases: v0.1.0 (MVP) e v0.1.1 (patch UX/manutencao)

### Implementado (conforme SPEC)
- Rotas:
  - /today
  - /upcoming
  - /person (page; modal ficou opcional na SPEC)
  - /share/[token] (v1)
- Componentes:
  - PersonCard
  - PersonForm
  - ImportCsv
  - Templates
  - TopNav
- Libs:
  - storage.ts (IndexedDB + fallback localStorage)
  - dates.ts
  - share.ts
  - csv.ts
- PWA:
  - next-pwa configurado
  - manifest.json + icones
  - service worker gerado no build (artefato)
- Dados de exemplo:
  - public/sample-birthdays.csv
  - public/sample-birthdays-invalid.csv (QA/manual)
- README com passos de execucao e limitacoes

### Decisoes de implementacao (alinhadas ao escopo)
- Notificacao:
  - implementado fallback aceito na SPEC: notificar ao abrir o app
  - estado visual claro para granted, denied e sem suporte
  - sem agendamento confiavel em background (limitacao documentada)
- Share v1:
  - token client-only sem assinatura (base64url JSON)
  - sem revogacao individual (limitacao aceita no MVP)
- Dedupe CSV:
  - warning de possivel duplicata e importacao permitida (sem merge no MVP)

### Testes e validacao
- Unit tests implementados:
  - proximos 7 dias
  - CSV parse/validacao
  - share token roundtrip (extra)
- Smoke test manual validado:
  - CRUD
  - import CSV valido/invalido
  - persistencia apos reload
  - fluxo /share/[token]
  - notificacao ao abrir (best-effort)

### Proximo uso desta SPEC (continuidade de escopo)
- Manter esta SPEC como baseline do MVP entregue.
- Para evolucao de escopo total, criar secao nova (ex.: SPEC vNext) com:
  - backend minimo para revogacao/share
  - notificacoes mais confiaveis
  - regras de dedupe/merge
  - integracoes futuras
  sem alterar retroativamente os criterios do MVP ja concluido.
## 1) Stack (mÃ­nimo custo)
- Frontend: Next.js (App Router) + TypeScript
- UI: Tailwind CSS
- PersistÃªncia local: IndexedDB (via idb) com fallback localStorage
- PWA: next-pwa (service worker) para suporte a notificaÃ§Ãµes
- Deploy: Vercel (ou qualquer static hosting)

> Sem backend no MVP para reduzir custo e complexidade.
> v1 de "link de compartilhamento" pode ser feito client-only usando token no URL com payload assinado localmente (ver seÃ§Ã£o 8).

## 2) Estrutura de pastas
/ (repo)
  /app
    / (pages)
    /today
    /upcoming
    /person
    /share/[token]          # v1: pÃ¡gina de link compartilhÃ¡vel
    layout.tsx
    page.tsx                # redirect p/ today
  /components
    PersonCard.tsx
    PersonForm.tsx
    ImportCsv.tsx
    Templates.tsx
    TopNav.tsx
  /lib
    storage.ts              # IndexedDB/localStorage abstraction
    dates.ts                # helpers de data (dia/mÃªs)
    share.ts                # token encode/decode
    csv.ts                  # parse/validate CSV
  /public
    manifest.json
    icons/
  /scripts
    seed.ts                 # opcional: dados de exemplo
  README.md

## 3) Modelo de dados

### 3.1 Types
- SourceType: "manual" | "csv" | "shared"
- Tag: string

### 3.2 Entity: BirthdayPerson
- id: string (uuid)
- name: string
- day: number (1-31)
- month: number (1-12)
- source: SourceType
- tags: string[]
- notes?: string
- links?: {
    whatsapp?: string
    instagram?: string
    other?: string
  }
- createdAt: number (epoch ms)
- updatedAt: number (epoch ms)

### 3.3 Settings
- notificationEnabled: boolean
- notificationTime: string ("09:00")
- lastNotifiedDate?: string ("YYYY-MM-DD")  # evita duplicar quando abrir o app

## 4) Regras de negÃ³cio
- OrdenaÃ§Ã£o:
  - "Hoje": day/month == hoje
  - "PrÃ³ximos 7 dias": prÃ³ximos 7 dias a partir de hoje, incluindo virada de ano
- Ano nÃ£o Ã© armazenado (evita idade).
- ValidaÃ§Ã£o:
  - day/month vÃ¡lidos (considerar meses com 30/31 e fevereiro com 29 permitido para simplificar)
  - nome obrigatÃ³rio
- Dedupe opcional:
  - se importar CSV com mesmo nome+dia+mes, pedir â€œmesclarâ€ ou duplicar (no MVP: duplicar Ã© ok, mas ideal alertar)

## 5) UI/Rotas

### /today
- Header: "Hoje"
- Lista de PersonCard
- CTA: "Adicionar" (abre modal/form)
- CTA secundÃ¡rio: "Importar CSV"

### /upcoming
- Header: "PrÃ³ximos 7 dias"
- Lista agrupada por dia (opcional) ou lista simples

### /person (modal ou page)
- Form com campos:
  - Nome
  - Dia / MÃªs (select)
  - Tags (input simples com enter)
  - Links opcionais
  - Notas
- BotÃµes: Salvar / Excluir (se edit)

### /share/[token] (v1)
- Exibe: Nome + Dia/MÃªs
- BotÃ£o: "Adicionar Ã  minha lista"
  - Ao clicar: cria BirthdayPerson com source="shared"
- ObservaÃ§Ã£o: link revogÃ¡vel Ã© desejÃ¡vel no futuro (ver seÃ§Ã£o 8).

## 6) ImportaÃ§Ã£o CSV
- Componente ImportCsv:
  - upload do arquivo
  - preview das linhas vÃ¡lidas e invÃ¡lidas
  - botÃ£o â€œImportarâ€
- Formato CSV suportado (header obrigatÃ³rio):
  - name,day,month,tags,whatsapp,instagram,notes
- tags separado por ";" (ex: "amigos;trabalho")

## 7) NotificaÃ§Ãµes (MVP)
### EstratÃ©gia
- Solicitar permissÃ£o de Notification com CTA claro.
- No carregamento do app:
  - se notificationsEnabled e lastNotifiedDate != hoje e existem aniversariantes hoje:
    - disparar notificaÃ§Ã£o imediata (nÃ£o â€œagendadaâ€, mas efetiva)
    - atualizar lastNotifiedDate
- Se viÃ¡vel com service worker:
  - usar periodic background sync quando suportado (best-effort)
> Nota: confiabilidade varia por browser/OS. Aceito no MVP.

## 8) Compartilhar (v1) â€” Link privado
Objetivo: permitir que o usuÃ¡rio compartilhe seu aniversÃ¡rio sem criar â€œrede socialâ€.

### Token
- Payload mÃ­nimo:
  - name
  - day
  - month
  - issuedAt
- Encode: base64url(JSON) + assinatura HMAC opcional (mas sem backend Ã© complexo).
- MVP simples:
  - token sem assinatura (risco baixo porque sÃ³ contÃ©m nome + dia/mÃªs).
  - NÃ£o usar ano.
- RevogaÃ§Ã£o:
  - Sem backend nÃ£o dÃ¡ revogar individualmente; no MVP aceitar limitaÃ§Ã£o.
  - EvoluÃ§Ã£o: backend mÃ­nimo ou chave rotativa por usuÃ¡rio.

## 9) Storage
- IndexedDB:
  - store: "people" (keyPath id)
  - store: "settings" (keyPath key)
- Fallback localStorage se IndexedDB indisponÃ­vel.

## 10) Testes (mÃ­nimo)
- Unit:
  - cÃ¡lculo de prÃ³ximos 7 dias
  - validaÃ§Ã£o CSV
- Smoke test manual:
  - adicionar, editar, excluir
  - importar CSV
  - persistÃªncia apÃ³s reload
  - notificaÃ§Ã£o ao abrir app com aniversariante hoje

## 11) SeguranÃ§a e privacidade
- NÃ£o armazenar ano de nascimento.
- Dados ficam localmente no dispositivo no MVP.
- Link compartilhÃ¡vel expÃµe apenas nome + dia/mÃªs.
- Fornecer opÃ§Ã£o â€œLimpar todos os dadosâ€ nas configuraÃ§Ãµes.

## 12) Passos de execuÃ§Ã£o
- npm install
- npm run dev
- acessar /today
- (opcional) instalar como PWA

