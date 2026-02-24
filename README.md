# BdayHub (MVP)

MVP client-only para lembrar aniversários, conforme `SPEC.md`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- `idb` (IndexedDB) com fallback `localStorage`
- `next-pwa` (best-effort para suporte PWA/notificações)

## Funcionalidades entregues

- Rotas ` /today ` e ` /upcoming `
- CRUD (adicionar, editar, excluir)
- Importação CSV com preview de linhas válidas/inválidas
- Templates de mensagem com botão copiar
- Abertura de links (WhatsApp/Instagram/outro)
- Persistência local (IndexedDB com fallback)
- Notificação best-effort ao abrir o app (evita duplicar no mesmo dia)
- ` /share/[token] ` (v1) para compartilhar nome + dia/mês e adicionar à lista local
- Botão para limpar todos os dados locais

## Limitação conhecida (MVP)

Notificação agendada confiável em background varia por navegador/OS. Implementado fallback aceito na SPEC:

- O app tenta notificar **ao abrir**
- Se a permissão não estiver disponível/concedida, o app mostra aviso em tela na rota ` /today `

## Como rodar localmente

1. `npm install`
2. `npm run dev`
3. Abrir `http://localhost:3000/today`

## Testes (mínimo da SPEC)

- `npm test` roda testes unitários de:
  - cálculo de próximos 7 dias
  - validação/parsing de CSV

## Testes E2E (Playwright)

- Instalar dependencias: `npm install`
- Instalar browser do Playwright (primeira vez): `npx playwright install chromium`
- Rodar smoke tests E2E: `npm run test:e2e`

Cobertura atual (smoke):
- CRUD de aniversario
- Import CSV (preview + import)
- Persistencia apos reload
- `/share/[token]` com CTA "Adicionar a lista"

## CSV suportado

Header obrigatório:

```csv
name,day,month,tags,whatsapp,instagram,notes
```

- `tags` separado por `;`
- Exemplo pronto em `public/sample-birthdays.csv`
- Exemplo com erros (para testar preview de inválidas): `public/sample-birthdays-invalid.csv`

## Fluxos rápidos para validar o MVP

1. Adicionar uma pessoa em ` /person `
2. Voltar para ` /today ` e verificar listagem
3. Importar `public/sample-birthdays.csv`
4. Importar `public/sample-birthdays-invalid.csv` para validar preview de erros
5. Abrir ` /upcoming `
6. Copiar mensagem / link compartilhável em um card
7. Abrir o link ` /share/[token] ` em outra aba e clicar em "Adicionar à minha lista"
8. Ativar notificações e reabrir o app (com aniversariante hoje) para testar best-effort

## Script opcional de seed

- `npm run seed` recria o CSV de exemplo em `public/sample-birthdays.csv`

## Observações de privacidade

- Sem backend no MVP
- Dados ficam no dispositivo do usuário
- O link compartilhável expõe apenas `nome + dia/mês` (sem ano)
- Sem revogação individual de link no v1 (limitação sem backend)
