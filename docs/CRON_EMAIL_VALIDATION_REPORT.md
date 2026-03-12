# Relatório de validação operacional — Email diário

Documento para auditoria final: provar causa de `candidates: 0`, envio real, dedupe e estado visual do email. Preencher com evidências obtidas em produção.

---

## Pré-requisitos (executar antes)

Variáveis necessárias (ex.: no shell ou em Vercel Production):

- `CRON_SECRET` — mesmo valor usado pelo GitHub Actions / cron
- `CRON_TEST_USER_ID` — UUID do usuário de teste (opcional; necessário para filtro por usuário e para fixture)
- `BASE_URL` — `https://uselembra.com.br` (ou override para staging)

---

## 1. Validar ambiente de teste

| Verificação | Como | Resultado (preencher) |
|-------------|------|------------------------|
| CRON_SECRET definido | Vercel → Project → Settings → Environment Variables (Production) | [ ] Sim [ ] Não |
| CRON_TEST_USER_ID definido | Idem | [ ] Sim [ ] Não |
| Usuário de teste existe | Supabase → Authentication → Users (buscar por UUID) | [ ] Sim [ ] Não |
| user_settings do usuário | Supabase → Table Editor → user_settings (user_id = CRON_TEST_USER_ID) | email_enabled: ___ email_time: ___ timezone: ___ |
| Fixture "Teste Hoje" | Table Editor → birthdays (user_id = CRON_TEST_USER_ID; nome "Teste Hoje"; day/month = hoje em America/Sao_Paulo) | [ ] Existe [ ] Não existe |
| Fixture "Teste Amanhã" | Idem, day/month = amanhã | [ ] Existe [ ] Não existe |

Se algo falhar: criar/ajustar com `npx tsx scripts/seed-cron-test-fixtures.ts` (ver docs/CRON_SETUP.md).

---

## 2. Comandos para execução

Rodar em ambiente com `CRON_SECRET` (e opcionalmente `CRON_TEST_USER_ID` e `BASE_URL`).

### 2.1 Dry-run + diagnóstico (read-only, não altera estado)

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "${BASE_URL:-https://uselembra.com.br}/api/cron/email?dry-run=true&diagnostic=1"
```

### 2.2 Diagnóstico por usuário de teste (read-only)

Substituir `<UUID>` pelo valor de `CRON_TEST_USER_ID`:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "${BASE_URL:-https://uselembra.com.br}/api/cron/email?diagnostic=1&userId=<UUID>"
```

### 2.3 Chamada real (envio)

Só executar quando o usuário de teste estiver **na janela** (localNowHHMM dentro de [windowStart, windowEnd)). Sem dry-run, sem bypass.

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "${BASE_URL:-https://uselembra.com.br}/api/cron/email?userId=<UUID>"
```

Ou, para processar todos os elegíveis (cron normal):

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "${BASE_URL:-https://uselembra.com.br}/api/cron/email"
```

### 2.4 Segunda chamada (validar dedupe)

Na mesma janela de 15 min, repetir a mesma chamada real (2.3). Deve retornar already_sent / already_processing e não enviar segundo email.

---

## 3. Relatório final (preencher com evidências)

### Bloco 1 — Evidência operacional

**JSON do dry-run + diagnostic (colar aqui ou anexar):**

```
[COLAR AQUI O JSON DE 2.1]
```

**Resumo extraído:**

| Campo | Valor |
|-------|--------|
| scannedUsers | |
| outsideWindow | |
| candidates | |
| alreadyDispatchedCount | |
| skippedNoBirthday | |
| skippedInvalidEmail | |
| sent | |
| failed | |
| dryRun | (deve ser true) |

**Causa real de candidates: 0 (escolher e detalhar):**

- [ ] **scannedUsers = 0** — Query base vazia: nenhum usuário com `email_enabled = true` em `user_settings`. Evidência: ___
- [ ] **scannedUsers > 0 e candidates = 0** — Todos fora da janela de 15 min. Evidência: `debug.outsideWindow` = ___ ; `debug.skipReasons` = ___
- [ ] **Outro** — ___

---

### Bloco 2 — Validação do usuário de teste

**Configuração encontrada (user_settings):**

- email_enabled: ___
- email_time: ___
- timezone: ___

**Fixtures encontradas (birthdays para o user_id de teste):**

- Nomes: ___
- Hoje (day/month no TZ do usuário): ___

**Diagnóstico por usuário (JSON de 2.2 ou resumo):**

- debug.debugUser.isCandidate: ___
- debug.debugUser.localNowHHMM: ___
- debug.debugUser.windowStart / windowEnd: ___
- debug.debugUser.reasonIfNot: ___
- debug.birthdaysFoundForToday: ___

**Conclusão:** [ ] Elegível na janela [ ] Não elegível — motivo: ___

---

### Bloco 3 — Envio real

**Resultado da chamada real (2.3):**

- HTTP status: ___
- JSON (resumo): ok: ___ sent: ___ skippedNoBirthday: ___ alreadyDispatchedCount: ___ lastError: ___

**Registro em daily_email_dispatch (Supabase):**

- user_id: ___
- date_key: ___
- status: ___
- sent_at: ___

**Email recebido:** [ ] Sim [ ] Não  
- Inbox (endereço): ___
- Assunto recebido: ___

---

### Bloco 4 — Dedupe

**Resultado da segunda chamada (2.4):**

- JSON (resumo): candidates: ___ sent: ___ alreadyDispatchedCount: ___

**Evidência de bloqueio:**

- [ ] Resposta contém already_sent ou already_processing
- [ ] Apenas uma linha em daily_email_dispatch para (user_id, date_key) com status sent/skipped
- Outro: ___

---

### Bloco 5 — Ajustes finais necessários

**Revisão do email recebido (cliente real):**

- [ ] Branding "Lembra." visível
- [ ] Assunto claro
- [ ] Hierarquia do conteúdo ok
- [ ] Lista dos aniversariantes legível
- [ ] CTA "Abrir Lembra" ok
- [ ] Fallback (quando 0 itens) não aplicável / ok
- [ ] Aparência geral aceitável

**Ajustes de código:** [ ] Nenhum [ ] Sim — descrever e fazer apenas diff mínimo em `lib/server/dailyReminderDigest.ts` se necessário.

---

## Critérios de aceite (checklist final)

- [ ] Causa real de candidates: 0 provada com evidência (Bloco 1)
- [ ] Pelo menos um envio real bem-sucedido para o usuário de teste (Bloco 3)
- [ ] Dedupe provado (Bloco 4)
- [ ] Email recebido visualmente aceitável (Bloco 5)
- [ ] Nenhuma mudança nova de arquitetura/endpoints introduzida

---

*Fim do relatório. Preencher com dados reais de produção.*
