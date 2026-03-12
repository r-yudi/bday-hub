# Custom auth domain — implementation checklist

Use this after reading [CUSTOM_AUTH_DOMAIN_ASSESSMENT.md](CUSTOM_AUTH_DOMAIN_ASSESSMENT.md). Do not invent DNS or dashboard values; confirm everything in Supabase dashboard and docs.

---

## 1. Information to collect first

- [ ] **Supabase project reference** (e.g. from `NEXT_PUBLIC_SUPABASE_URL`: `https://xxxx.supabase.co` → `xxxx`).
- [ ] **Current Supabase plan** and whether **Custom Domains** add-on is available and enabled (Dashboard → Billing / Add-ons). Custom domains are a paid add-on on a paid plan.
- [ ] **Subdomain to use** (e.g. `auth.uselembra.com.br`). Must be a subdomain; apex domain is not supported — verify in [Supabase Custom Domains](https://supabase.com/docs/guides/platform/custom-domains).
- [ ] **DNS access** for the parent domain (e.g. `uselembra.com.br`) to add CNAME and TXT records.
- [ ] **Google Cloud Console** access for the OAuth 2.0 client used by this app.

---

## 2. Supabase dashboard areas

- **Settings → General** (or the Custom Domains section indicated in the dashboard). Follow the “Custom Domains” or “Add custom domain” flow.
- **Authentication → URL Configuration:** No change required for app redirect URLs (they stay as `https://uselembra.com.br/...`). Optional: after activation, confirm Site URL / Redirect URLs still match production.
- **Authentication → Providers → Google:** Client ID/Secret stay the same. The **callback URL** that Supabase advertises to Google will become the custom domain after activation; no separate provider “custom URL” field to set — verify in current dashboard.

Exact menu names and paths may differ; use the [Custom Domains guide](https://supabase.com/docs/guides/platform/custom-domains) and the in-dashboard instructions.

---

## 3. DNS records (verify in Supabase dashboard/docs)

Supabase will ask for:

- **CNAME:** Your custom hostname (e.g. `auth.uselembra.com.br`) → target hostname. **Exact target:** copy from the Supabase dashboard or CLI output (typically the project’s default domain, e.g. `<project-ref>.supabase.co` — **verify in Supabase**).
- **TXT (ownership/verification):** Supabase returns one or more TXT records (e.g. `_acme-challenge.<custom-hostname>`). Add the **exact** value(s) shown; do not guess. TTL: use a low value during setup for faster propagation.

Do not rely on this checklist for the exact target or TXT value; always use the values provided by Supabase for your project.

---

## 4. Google Cloud Console — values to update

- **APIs & Services → Credentials →** your **OAuth 2.0 Client ID** (Web application).
- **Authorized redirect URIs:** **Add** (do not remove the existing one until the custom domain is live and tested):  
  `https://auth.uselembra.com.br/auth/v1/callback`  
  (replace with your chosen custom hostname and path if different). **Verify in Supabase docs** whether the path is exactly `/auth/v1/callback`.
- **Authorized JavaScript origins:** Add `https://auth.uselembra.com.br` if required for your flow — **verify in Supabase/Google OAuth docs**.

Apply and save. Keep the existing Supabase `.supabase.co` redirect URI until after go-live so you can roll back by reverting env.

---

## 5. Before activating the custom domain

- [ ] DNS CNAME and TXT records are added and propagated (Supabase “Verify” or “Reverify” succeeds).
- [ ] Google OAuth client has the **new** redirect URI (and origin if needed) added.
- [ ] Team knows the planned cutover time and that `NEXT_PUBLIC_SUPABASE_URL` will be changed to the custom domain.
- [ ] Rollback plan: revert `NEXT_PUBLIC_SUPABASE_URL` to `https://<project-ref>.supabase.co` and redeploy if something goes wrong; Google already has both URIs so login will work with either URL.

---

## 6. Activate in Supabase

- Run the activation step in the dashboard (or CLI `domains activate` as per [Supabase Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)).
- After activation, the project is reachable at both the original Supabase URL and the custom domain. You do not have to change the app immediately, but for the OAuth flow to show the custom domain, the **client** must use the custom domain (next step).

---

## 7. Switch the app to the custom domain

- In **Vercel** (production): set **`NEXT_PUBLIC_SUPABASE_URL`** to the custom domain (e.g. `https://auth.uselembra.com.br`). Same **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**; no other env change required.
- Redeploy so the client uses the new URL.
- Optional: in local dev, use the same custom domain in `.env.local` for production-like testing, or keep `NEXT_PUBLIC_SUPABASE_URL` unset / pointing to default for local.

---

## 8. After switching — test

- [ ] Run [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md): full login flow, redirect to app, session, `returnTo`.
- [ ] Confirm in an incognito window that the **domain shown** during the Google OAuth step (URL bar or consent screen) is the custom domain (e.g. `auth.uselembra.com.br`), not `*.supabase.co`.
- [ ] Confirm Supabase Dashboard (e.g. Authentication → Users) shows the new login and that existing sessions still work (refresh, multi-device if applicable).

---

## 9. Rollback

- If issues occur: set **`NEXT_PUBLIC_SUPABASE_URL`** back to `https://<project-ref>.supabase.co` in Vercel and redeploy. The original domain remains active; Google already has both redirect URIs, so login will work again with the default domain.
- Optionally remove the custom-domain redirect URI from Google after rollback if you do not plan to retry soon. Do not remove it before rollback is verified.
