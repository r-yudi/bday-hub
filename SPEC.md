# BdayHub — SPEC (MVP)

## 1) Stack (mínimo custo)
- Frontend: Next.js (App Router) + TypeScript
- UI: Tailwind CSS
- Persistência local: IndexedDB (via idb) com fallback localStorage
- PWA: next-pwa (service worker) para suporte a notificações
- Deploy: Vercel (ou qualquer static hosting)

> Sem backend no MVP para reduzir custo e complexidade.
> v1 de "link de compartilhamento" pode ser feito client-only usando token no URL com payload assinado localmente (ver seção 8).

## 2) Estrutura de pastas
/ (repo)
  /app
    / (pages)
    /today
    /upcoming
    /person
    /share/[token]          # v1: página de link compartilhável
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
    dates.ts                # helpers de data (dia/mês)
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

## 4) Regras de negócio
- Ordenação:
  - "Hoje": day/month == hoje
  - "Próximos 7 dias": próximos 7 dias a partir de hoje, incluindo virada de ano
- Ano não é armazenado (evita idade).
- Validação:
  - day/month válidos (considerar meses com 30/31 e fevereiro com 29 permitido para simplificar)
  - nome obrigatório
- Dedupe opcional:
  - se importar CSV com mesmo nome+dia+mes, pedir “mesclar” ou duplicar (no MVP: duplicar é ok, mas ideal alertar)

## 5) UI/Rotas

### /today
- Header: "Hoje"
- Lista de PersonCard
- CTA: "Adicionar" (abre modal/form)
- CTA secundário: "Importar CSV"

### /upcoming
- Header: "Próximos 7 dias"
- Lista agrupada por dia (opcional) ou lista simples

### /person (modal ou page)
- Form com campos:
  - Nome
  - Dia / Mês (select)
  - Tags (input simples com enter)
  - Links opcionais
  - Notas
- Botões: Salvar / Excluir (se edit)

### /share/[token] (v1)
- Exibe: Nome + Dia/Mês
- Botão: "Adicionar à minha lista"
  - Ao clicar: cria BirthdayPerson com source="shared"
- Observação: link revogável é desejável no futuro (ver seção 8).

## 6) Importação CSV
- Componente ImportCsv:
  - upload do arquivo
  - preview das linhas válidas e inválidas
  - botão “Importar”
- Formato CSV suportado (header obrigatório):
  - name,day,month,tags,whatsapp,instagram,notes
- tags separado por ";" (ex: "amigos;trabalho")

## 7) Notificações (MVP)
### Estratégia
- Solicitar permissão de Notification com CTA claro.
- No carregamento do app:
  - se notificationsEnabled e lastNotifiedDate != hoje e existem aniversariantes hoje:
    - disparar notificação imediata (não “agendada”, mas efetiva)
    - atualizar lastNotifiedDate
- Se viável com service worker:
  - usar periodic background sync quando suportado (best-effort)
> Nota: confiabilidade varia por browser/OS. Aceito no MVP.

## 8) Compartilhar (v1) — Link privado
Objetivo: permitir que o usuário compartilhe seu aniversário sem criar “rede social”.

### Token
- Payload mínimo:
  - name
  - day
  - month
  - issuedAt
- Encode: base64url(JSON) + assinatura HMAC opcional (mas sem backend é complexo).
- MVP simples:
  - token sem assinatura (risco baixo porque só contém nome + dia/mês).
  - Não usar ano.
- Revogação:
  - Sem backend não dá revogar individualmente; no MVP aceitar limitação.
  - Evolução: backend mínimo ou chave rotativa por usuário.

## 9) Storage
- IndexedDB:
  - store: "people" (keyPath id)
  - store: "settings" (keyPath key)
- Fallback localStorage se IndexedDB indisponível.

## 10) Testes (mínimo)
- Unit:
  - cálculo de próximos 7 dias
  - validação CSV
- Smoke test manual:
  - adicionar, editar, excluir
  - importar CSV
  - persistência após reload
  - notificação ao abrir app com aniversariante hoje

## 11) Segurança e privacidade
- Não armazenar ano de nascimento.
- Dados ficam localmente no dispositivo no MVP.
- Link compartilhável expõe apenas nome + dia/mês.
- Fornecer opção “Limpar todos os dados” nas configurações.

## 12) Passos de execução
- npm install
- npm run dev
- acessar /today
- (opcional) instalar como PWA