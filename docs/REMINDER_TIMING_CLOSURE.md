# Fechamento operacional: reminder_timing

Feature concluída em código e testes. Este doc concentra o que falta para existir em produção e como fechar a frente.

---

## 1. Nome exato da migration

**Arquivo:** `supabase/migrations/20260312_add_reminder_timing_to_user_settings.sql`

Nome canônico para referência: **20260312_add_reminder_timing_to_user_settings**.

---

## 2. Campo esperado em `user_settings`

- **Tabela:** `public.user_settings`
- **Coluna:** `reminder_timing`
- **Tipo:** `text NOT NULL DEFAULT 'day_of'`
- **Constraint:** `user_settings_reminder_timing_check` → `reminder_timing IN ('day_of', 'day_before')`

Impacto no schema: uma coluna nova; linhas existentes passam a ter `reminder_timing = 'day_of'` por default.

---

## 3. Checklist operacional de aplicação da migration

- [ ] **Onde aplicar:** Projeto Supabase em uso (produção/staging). Via Dashboard → SQL Editor ou `supabase db push` (se usar CLI linkado ao projeto).
- [ ] **Executar:** Conteúdo de `supabase/migrations/20260312_add_reminder_timing_to_user_settings.sql` (ALTER TABLE + ADD COLUMN + DROP/ADD constraint).
- [ ] **Validar que foi aplicada:**
  - No SQL Editor:  
    `select column_name, data_type, column_default from information_schema.columns where table_schema = 'public' and table_name = 'user_settings' and column_name = 'reminder_timing';`  
    Esperado: uma linha com `reminder_timing`, `text`, default `'day_of'`.
  - Opcional:  
    `select constraint_name from information_schema.table_constraints where table_schema = 'public' and table_name = 'user_settings' and constraint_name = 'user_settings_reminder_timing_check';`  
    Esperado: uma linha.
- [ ] **Confirmar leitura/escrita pelo app:** Após deploy do app que já inclui a feature: usuário logado em Configurações → Email diário → alterar "Lembrete" para "No dia anterior" → salvar → recarregar a página e confirmar que "No dia anterior" permanece selecionado (persistência em `user_settings.reminder_timing`).

---

## 4. Checklist de validação manual (smoke)

- [ ] Usuário **logado** (não guest).
- [ ] Ir em **Configurações** → seção **Email diário**.
- [ ] Selecionar **"No dia anterior"** no campo Lembrete.
- [ ] **Salvar** (e ver mensagem/feedback de sucesso se houver).
- [ ] **Persistência:** Recarregar a página (F5) e confirmar que "No dia anterior" continua selecionado.
- [ ] **Comportamento do digest:** No dia anterior a um aniversário cadastrado, no horário configurado (email_time) e no timezone do usuário, o lembrete deve ser enviado (digest com aniversários de "amanhã"). Verificar email recebido ou, em ambiente de dev/staging, logs do cron que mostrem envio com modo "tomorrow" para esse usuário.

---

## 5. Critério objetivo de encerramento da feature

A frente **reminder_timing** considera-se encerrada quando:

1. A migration **20260312_add_reminder_timing_to_user_settings** estiver aplicada no banco do ambiente alvo (produção).
2. O deploy do app que já inclui a feature estiver ativo nesse ambiente.
3. A validação manual (checklist acima) tiver sido executada com sucesso pelo menos uma vez (persistência da preferência + digest no dia anterior quando configurado).

Nenhuma alteração adicional de código é necessária para este fechamento.
