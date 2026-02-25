# Dev Skill Playbook (Lembra.)

## Objetivo
Desenvolver com simplicidade, velocidade e criatividade, sem inflar a arquitetura e sem quebrar os contratos do produto.

## Leitura obrigatória antes de implementar
1. `PRD.md`
2. `SPEC.md`
3. `AGENTS.md`
4. `CHANGELOG.md` (se houver entrega relevante)
5. `playbooks/product-skill.md` ou `playbooks/design-skill.md` (quando aplicável)

## Regras de execução
- Fazer mudanças pequenas e incrementais.
- Commits claros e objetivos.
- Evitar abstrações prematuras.
- Preservar guest/local-first e sync Supabase.
- Não trocar stack sem alinhamento explícito.
- Reusar código existente antes de criar novo módulo/helper.
- Documentar limitações do browser (ex.: notificações em background).
- Não quebrar compatibilidade legada sem migração clara.

## Padrão de implementação em 4 steps
### 1) Scaffold
- Criar o mínimo de estrutura (rota/componente/arquivo/teste base).
- Definir tipos/props/assinaturas sem superengenharia.
- Garantir que o caminho compile cedo.

### 2) Wired
- Conectar fluxo real (dados, eventos, integração local/Supabase).
- Implementar comportamento principal fim-a-fim.
- Evitar polimento visual prematuro.

### 3) Polish
- Melhorar UX/copy/estados/loading/empty/error.
- Aplicar design system (`ui-*`, tokens).
- Refinar nomes e remover duplicações óbvias.

### 4) Harden
- Cobrir casos de erro/edge cases.
- Rodar testes relevantes.
- Revisar regressões (guest/local-first, sync, share, landing).
- Atualizar docs (`SPEC.md`, `PRD.md`, `CHANGELOG.md`) se necessário.

## Convenções de pastas e naming (alinhadas ao repo)
### Pastas (referência)
- `app/`: rotas e páginas (App Router)
- `components/`: componentes reutilizáveis de UI/fluxo
- `lib/`: lógica de domínio/repos, utilitários, integrações
- `tests/`: unit tests
- `e2e/`: Playwright smoke/regressão
- `docs/`: docs técnicas e SQL auxiliares
- `supabase/migrations/`: schema/migrations
- `playbooks/`: playbooks operacionais internos

### Naming
- Componentes React: `PascalCase.tsx`
- Utilitários/lib: `camelCase.ts` ou nomes descritivos existentes do repo
- Rotas App Router: pasta em lowercase (`app/share/[token]`)
- Docs/playbooks: `kebab-case.md`
- Commits: `tipo(escopo): resumo`

## Template de commit message
### Formato
`tipo(escopo): resumo`

### Tipos comuns
- `feat`
- `fix`
- `refactor`
- `polish`
- `test`
- `docs`
- `chore`

### Exemplos
- `fix(sync): preserve local fallback on expired session`
- `polish(today): improve empty state hierarchy`
- `docs(playbooks): add regression checklist for share flows`

## Template de PR (ou descrição de entrega)
```md
## Objetivo
- 

## O que mudou
- 
- 

## O que não mudou (explicitamente)
- Sem mudança de lógica X
- Sem mudança de schema Y

## Riscos / regressões observadas
- 

## Validação
- [ ] npm test
- [ ] npm run test:e2e
- [ ] npm run build (se aplicável)
- [ ] Smoke manual (fluxos tocados)

## Docs atualizados
- [ ] PRD.md
- [ ] SPEC.md
- [ ] CHANGELOG.md
```

## Criatividade com segurança
### Experimente sem quebrar
- Preferir toggles locais simples (`const ENABLE_X = false`) durante exploração.
- Isolar experimentos em componentes/trechos pequenos.
- Usar guards de debug (`process.env.NODE_ENV !== 'production'`) para ferramentas de desenvolvimento.
- Remover toggles temporários antes de finalizar, ou documentar claramente se ficam.
- Não deixar feature incompleta “ativada por acidente”.

### Feature flags locais (padrão leve)
- Nomear de forma explícita (`enableNewShareComposer`).
- Definir fallback claro.
- Não transformar em sistema de flags complexo sem necessidade.

### Debug guards
- Rotas/diagnósticos devem continuar bloqueados em produção (`/debug/*` -> 404).
- Logs temporários devem ser removidos antes do commit final.

## Testes e rotinas (obrigatório em mudanças relevantes)
### Comandos principais
```bash
npm test
npm run test:e2e
npm run build
```

### Rotina recomendada
1. Implementar até `Wired`.
2. Rodar testes unitários afetados (`npm test`).
3. Fazer `Polish` + `Harden`.
4. Rodar `npm run test:e2e` se fluxo/UX foi tocado.
5. Rodar `npm run build` se mexeu em rota/comportamento/config.

## Checklist de entrega (dev)
- [ ] Mudança mínima suficiente para o objetivo.
- [ ] Sem abstração prematura.
- [ ] Sem quebrar guest/local-first.
- [ ] Sem quebrar sync/share/landing (se aplicável).
- [ ] Testes/validação executados ou justificativa explícita.
- [ ] Docs e changelog atualizados quando necessário.
- [ ] Commit claro.

## Como rodar este playbook (fluxo rápido)
1. Ler `PRD.md`, `SPEC.md`, `AGENTS.md`.
2. Escolher skill principal (product/design/dev).
3. Implementar em 4 steps (`scaffold -> wired -> polish -> harden`).
4. Rodar validações aplicáveis.
5. Entregar diff + testes + atualização de docs.
