# QA: Google login trust and flow

Use this guide to verify the login experience and trust setup without being the author of the feature. Expected outcomes are stated explicitly.

**Prerequisites:** Production (or staging) deployed with Supabase + Google OAuth configured. Optional: local dev with `.env.local` and Supabase Redirect URLs including `http://localhost:3000/**`.

---

## 1. Login page — trust copy before redirect

**Steps:** Open `/login` (production: `https://uselembra.com.br/login`).

**Expected:**

- Title about syncing birthdays and subtitle that login is optional.
- Button: “Continuar com Google” (with Google icon).
- Helper text under the button about using Google only for secure sign-in.
- Block “O que será compartilhado”: only name and email.
- Block “O que NÃO acessamos”: list (e-mails, files, contacts, photos, etc.) and footer about secure Google auth.
- Links to Privacy and Terms.

**Pass:** All of the above visible without expanding accordions. No promise that “only Lembra domain” will appear during login.

---

## 2. Loading state after clicking Google

**Steps:** On `/login`, click “Continuar com Google”.

**Expected:**

- Button becomes disabled.
- Button label changes to “Abrindo o Google...” (or equivalent).
- Subtle loading indicator (e.g. spinner).
- Helper text appears: user will be redirected to Google’s secure screen to authorize.

**Pass:** All of the above; no immediate full-page redirect without feedback.

---

## 3. Redirect to Google and back to the app

**Steps:** Complete the flow: click “Continuar com Google” → on Google, sign in and grant access (or use existing session).

**Expected:**

- Browser goes to Google (accounts.google.com or similar).
- After consent, browser redirects to Supabase (URL may briefly show `*.supabase.co`).
- Then browser lands on the **app** at `/auth/callback` (production: `https://uselembra.com.br/auth/callback?...`).
- After a short “Verificando sessão” (or similar), user is redirected to the intended route (e.g. `/today` or the `returnTo` passed to login).

**Pass:** Final URL is the app’s canonical domain (e.g. `uselembra.com.br`), not localhost or a Vercel preview URL. Session is established (e.g. user name/avatar visible if the app shows it).

---

## 4. Consent screen branding (if configured)

**Steps:** Use an incognito/private window or a Google account that has not consented yet. Go to `/login` → “Continuar com Google”.

**Expected (if branding was configured in Google Cloud):**

- Google consent screen shows the app name (e.g. “Lembra”), support email, and if set, app logo and links (home, privacy, terms).

**Note:** The redirect domain shown by Google may still be the Supabase callback domain (e.g. `*.supabase.co`). That is expected. Branding improves trust; it does not remove the Supabase domain from the flow unless a custom auth domain is used.

**Pass:** App name and optional logo/links appear. No claim in this doc that the domain shown must be only Lembra.

---

## 5. Supabase domain may still appear

**Steps:** During the same flow as in §3, watch the URL bar and any “You will be redirected to…” text on Google.

**Expected:**

- At some point the URL or message may show the Supabase project domain (e.g. `https://<project-ref>.supabase.co/...`). This is **expected** with Supabase-hosted auth.

**Pass:** QA and PM understand this is normal. No bug filed for “Supabase domain visible” unless the product explicitly decided to use a custom auth domain and it was configured.

---

## 6. No localhost or preview leak in production

**Steps:** On **production** (`https://uselembra.com.br`), complete login as in §3.

**Expected:**

- After Google, user never lands on `http://localhost:*` or `https://*-xxx.vercel.app` (unless that is the current deployment under test).
- Callback and final destination use the canonical domain (e.g. `https://uselembra.com.br`).

**Pass:** No localhost or accidental preview domain in the redirect chain when testing production.

---

## 7. Auth callback returns to intended route

**Steps:** Open `/login?returnTo=/upcoming`. Click “Continuar com Google” and complete login.

**Expected:**

- After `/auth/callback`, user is sent to `/upcoming` (or the path passed in `returnTo`). Default with no `returnTo` is `/today`.

**Pass:** `returnTo` is respected; no hardcoded redirect to `/today` when another path was requested.

---

## 8. Error state — login cancelled or blocked

**Steps:**

- **Cancel:** Go to `/login` → “Continuar com Google” → on Google, close the tab or cancel. Or land back on the app with an error in the URL (e.g. `error=access_denied`).
- **Block:** If possible, block third-party cookies or use a browser that blocks the redirect; retry.

**Expected:**

- User ends up on the app: either `/login` or `/auth/callback` with error.
- **On `/login`** (e.g. error before redirect): Inline message “Não foi possível concluir o login com Google. Tente novamente.”; button enabled again.
- **On `/auth/callback`** (e.g. user cancelled on Google and was redirected back): Error state with “Não foi possível confirmar a sessão.” (or similar) and a “Voltar para login” link to retry.
- In both cases user can retry without being stuck in loading.

**Pass:** Error is visible and actionable; no infinite loading.

---

## Quick checklist (copy for QA)

| # | Check | Expected |
|---|--------|----------|
| 1 | Trust copy on `/login` | Title, subtitle, “O que será compartilhado”, “O que NÃO acessamos”, no fake “only Lembra domain” promise |
| 2 | Click Google | Button disabled, “Abrindo o Google...”, loading, helper text |
| 3 | Full flow | Redirect to Google → Supabase → app `/auth/callback` → app route (e.g. `/today`) |
| 4 | Consent screen | App name (and logo/links if set); Supabase domain may still appear |
| 5 | Production only | No localhost/preview in redirect chain |
| 6 | `returnTo` | e.g. `/login?returnTo=/upcoming` → after login, land on `/upcoming` |
| 7 | Error / cancel | Inline error, button re-enabled, can retry |
