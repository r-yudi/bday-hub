# Google login trust — release-ready handoff

Internal note for final handoff. No new features; consistency and rollout-readiness only.

---

## Launch decision

- **We are launching** with the current mitigation and **without** custom auth domain.
- **Accepted limitation:** The Supabase domain may still appear during Google login. This is a platform/plan limitation; we cannot remove it in-repo.
- **Why we accept it now:** Custom auth domain is not available on the current plan. No further in-repo change would materially improve trust without misleading users.
- **Future trigger:** Revisit custom auth domain (or alternative) only if login conversion or user trust becomes a priority that justifies plan/add-on cost. Monitor real-world feedback after launch.

---

## What is solved

- Pre-login trust communication (title, subtitle, data disclosure, expectation-setting sentence).
- Limited data disclosure (“O que será compartilhado” / “O que NÃO acessamos”).
- Loading and error clarity (button state, messages, “Voltar para login”).
- Operational setup (checklist, Vercel/Supabase/Google config).
- QA flow and auth preflight for validation.

## What is NOT solved

- The Supabase domain may still appear during OAuth. This is the current platform/plan limitation.
- It may still affect user trust and login conversion for some users.

## What the team decided

- Launch with current mitigation. Do not promise that only the Lembra domain will appear.
- Monitor login conversion and trust feedback after launch.
- Revisit custom auth domain later only if justified by priority and budget.

---

## What is already solved in-product

- **Trust copy:** Login page explains what is shared (name, email only) and what is not (e-mails, files, contacts, photos, etc.).
- **Explicit data disclosure:** Blocks “O que será compartilhado” and “O que NÃO acessamos” on `/login`.
- **Explicit loading state:** Button disables, label “Abrindo o Google...”, spinner, helper “Você será redirecionado para a tela segura do Google...”.
- **Inline error handling:** On `/login`, “Não foi possível concluir o login com Google. Tente novamente.” and button re-enabled; on `/auth/callback`, error state with “Voltar para login”.

---

## What must be configured externally

- **Supabase:** Authentication → URL Configuration — **Site URL** and **Redirect URLs** (see [GOOGLE_OAUTH_TRUST_CHECKLIST.md](GOOGLE_OAUTH_TRUST_CHECKLIST.md)).
- **Google Cloud:** OAuth consent screen (app name, support email, logo, homepage, privacy, terms, authorized domains); OAuth client **redirect URI** = Supabase callback only (`https://<project-ref>.supabase.co/auth/v1/callback`).
- **Vercel:** Env var **NEXT_PUBLIC_SITE_URL** = `https://uselembra.com.br` (production) so post-login redirect uses canonical domain.

---

## What must be validated after configuration

- Redirect after login returns to canonical domain (e.g. `https://uselembra.com.br`), not localhost or preview.
- No localhost/preview leak in production when testing from uselembra.com.br.
- Google consent screen shows app branding (name, logo, links) if configured.
- **Supabase domain may still appear** during OAuth (URL bar or “You will be redirected to…”). This is expected.
- Cancel/error: inline error or callback error screen with way to retry (e.g. “Voltar para login”).

Use [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md) for the full QA checklist. Before rollout, in dev you can confirm redirect assumptions on `/debug/auth` (bloco **Auth redirect preflight**); ver [AUTH_PREFLIGHT.md](AUTH_PREFLIGHT.md).

---

## Known limitation

**The Supabase callback domain may still be shown** during the Google OAuth flow (e.g. `*.supabase.co` in the URL or on the consent screen). This is expected with default Supabase-hosted auth. Custom auth domain is not available for this project; see [GOOGLE_LOGIN_TRUST_MITIGATION_WITHOUT_CUSTOM_DOMAIN.md](GOOGLE_LOGIN_TRUST_MITIGATION_WITHOUT_CUSTOM_DOMAIN.md) for the mitigation package and launch recommendation. The app does not promise that only the Lembra domain will appear.

---

## Final operator sequence

Execute in this order:

1. **Set Vercel env:** `NEXT_PUBLIC_SITE_URL` = `https://uselembra.com.br` for Production. Redeploy after change.
2. **Configure Supabase URL settings:** Authentication → URL Configuration → Site URL = `https://uselembra.com.br`; Redirect URLs = production + localhost (and optional preview). Save and confirm list.
3. **Configure Google consent screen:** App name, support email, logo, homepage, privacy, terms, authorized domains. Save.
4. **Confirm OAuth client redirect URI:** Only `https://<project-ref>.supabase.co/auth/v1/callback`; no app `/auth/callback` URL here.
5. **Redeploy** (if not done in step 1).
6. **Run QA checklist on production:** [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md).
7. **Decide** whether current trust level (branding + in-app copy; Supabase domain may still appear) is acceptable.
8. **If the product requires** the OAuth redirect domain to not be Supabase: follow [CUSTOM_AUTH_DOMAIN_ASSESSMENT.md](CUSTOM_AUTH_DOMAIN_ASSESSMENT.md) and [CUSTOM_AUTH_DOMAIN_CHECKLIST.md](CUSTOM_AUTH_DOMAIN_CHECKLIST.md).
