# Product Skill Playbook (Lembra.)

## Objetivo
Tomar decisões de produto com assertividade para o Lembra., preservando simplicidade e evitando escopo inflado.

## Fontes obrigatórias (antes de decidir)
1. `PRD.md` (estado atual + direção)
2. `SPEC.md` (contrato técnico e UX)
3. `AGENTS.md` (regras operacionais)
4. `CHANGELOG.md` (histórico e padrão de release)
5. `DESIGN_SYSTEM.md` + `app/styles/tokens.css` + `app/globals.css` (se houver impacto visual)

## Regras de decisão (não negociáveis)
- Preservar `guest/local-first`.
- Preservar sync com Supabase quando logado.
- Não quebrar landing em `/` como entrypoint de marketing.
- Não introduzir backend próprio sem alinhamento explícito.
- Não quebrar compatibilidade de leitura de dados legados sem migração clara.
- Se faltar informação, **não travar**: declarar suposições e seguir.

## 10 perguntas de clarificação obrigatórias (com suposições se faltar info)
Use estas perguntas sempre. Se a resposta não estiver disponível, preencha `Suposição:` e siga.

1. Qual problema específico estamos resolvendo agora (em 1 frase)?
2. Quem é o público principal deste ajuste (guest, logado, ambos)?
3. Qual job-to-be-done do usuário fica mais fácil/rápido?
4. Qual comportamento atual está inadequado (bug, atrito, confusão, ausência)?
5. Qual é o menor recorte de MVP que entrega valor real?
6. O que explicitamente fica fora de escopo nesta rodada?
7. Há impacto em rotas críticas (`/`, `/today`, `/upcoming`, `/person`, `/share`, `/share/[token]`)?
8. Há impacto em dados/sync (local-first, Supabase, compatibilidade, RLS)?
9. Como vamos validar sucesso (métrica, teste, smoke, evidência qualitativa)?
10. Quais riscos/regressões mais prováveis e como mitigar rápido?

### Regra de suposição (para não travar)
- Prefixe com `Suposição:`.
- Marque confiança: `alta`, `média` ou `baixa`.
- Liste a validação futura (ex.: analytics, feedback, teste manual).

## Template: 1-pager de decisão
Copiar e preencher antes de mudança relevante de escopo/fluxo.

```md
# 1-pager de decisão — <tema>

## Contexto
- Data: YYYY-MM-DD
- Responsável:
- Fontes lidas: PRD / SPEC / AGENTS / CHANGELOG / DESIGN_SYSTEM (sim/não)

## Problema
- O que está acontecendo hoje:
- Evidência (bug report, observação, teste, feedback, métrica):

## Público
- Primário:
- Secundário:
- Guest / Logado / Ambos:

## Job-to-be-done
- Quando <situação>, eu quero <ação>, para <resultado>.

## Hipótese
- Se fizermos <mudança>, então <público> terá <resultado>.
- Sinal esperado de sucesso:

## Escopo MVP (incluído)
- 
- 
- 

## Fora de escopo (não construir agora)
- 
- 
- 

## Impacto técnico/UX
- Rotas afetadas:
- Dados/sync:
- Risco de compatibilidade:
- Impacto no design system (`ui-*`, tokens):

## Métricas / validação
- Métrica principal:
- Métrica de guarda (não piorar):
- Testes/smokes obrigatórios:

## Riscos e mitigação
- Risco 1:
- Risco 2:
- Plano de rollback/disable:

## Decisão final
- Decisão:
- Por que agora:
- O que fica para depois:
```

## Critérios de aceitação (produto)
Uma mudança só está pronta quando:
- O valor principal da mudança está claro em 1 frase.
- O escopo e o fora de escopo estão documentados.
- Não conflita com `PRD.md`/`SPEC.md` ou os documentos foram atualizados.
- Há plano de validação (teste/smoke/métrica).
- Riscos de regressão em guest/local-first, sync, share e landing foram checados.

## Checklist de regressão (mínimo)
### Guest / local-first
- [ ] Sem login, app continua operando com persistência local.
- [ ] CRUD de aniversários continua funcionando.
- [ ] Import CSV (válido/inválido) não regrediu se fluxo foi tocado.

### Sync / Supabase (quando aplicável)
- [ ] Login Google e sessão persistente seguem íntegros.
- [ ] Sync não sobrescreve dados de forma inesperada.
- [ ] RLS owner-only e uso de `categories` (não `category`) permanecem corretos.

### Share
- [ ] `/share` continua acessível e coerente.
- [ ] `/share/[token]` mantém privacidade (nome + dia/mês, sem ano).
- [ ] Não reintroduz SELECT público direto em `share_links`.

### Landing / entrypoint
- [ ] `/` continua landing/marketing (sem redirect automático).
- [ ] Links para `/privacy` e `/terms` seguem disponíveis.

## Padrão de versão no CHANGELOG e tags (`v0.x`)
### Quando atualizar `CHANGELOG.md`
- Sempre que houver mudança entregue, agrupar em `[Unreleased]`.
- Ao preparar release, mover itens de `[Unreleased]` para a versão fechada.

### Estrutura obrigatória
- `[Unreleased]`
- `[0.x.y] - YYYY-MM-DD`

### Quando taggear `v0.x`
- `v0.x.0` (minor): mudança de valor/escopo perceptível (nova capability, fluxo importante).
- `v0.x.y` (patch): correção, estabilização, UX polish, docs/processo, testes, sem mudança grande de escopo.

### Convenção prática para este repo
- Preferir patch para ajustes sem mudança de escopo (ex.: `v0.1.x`).
- Criar tag **após** atualizar `CHANGELOG.md` e validar baseline.

## Como atualizar PRD/SPEC quando houver mudança
### Atualize `PRD.md` quando mudar
- Objetivo do produto, escopo/fora de escopo, público, métricas, direção.
- Critérios de aceite de nível produto.

### Atualize `SPEC.md` quando mudar
- Rotas, fluxo, regras de negócio, dados/sync, contrato de UI, testes.

### Regra de ouro
- Se a decisão muda comportamento real, `PRD.md` e/ou `SPEC.md` devem refletir o novo baseline no mesmo PR.

## Como rodar este playbook (fluxo rápido)
1. Ler `PRD.md`, `SPEC.md`, `AGENTS.md`.
2. Responder as 10 perguntas (com suposições se necessário).
3. Preencher 1-pager (curto).
4. Definir escopo + fora de escopo.
5. Executar checklist de regressão aplicável.
6. Atualizar `PRD.md`/`SPEC.md`/`CHANGELOG.md` se houver mudança.
