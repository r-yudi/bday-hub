# Auth redirect preflight

Internal validation aid for auth-related URL and redirect logic. It does **not** change auth behavior, Supabase, or Google configuration.

---

## What this preflight verifies

- **Canonical URL usage:** Whether the app is using the expected base URL for post-login redirect (from `NEXT_PUBLIC_SITE_URL` or fallback to `window.location.origin`).
- **Redirect base correctness:** The value returned by `getAuthRedirectBaseUrl()` and the resulting `redirectTo` sample for Google sign-in.
- **Environment behavior:** Classification as localhost, preview (e.g. Vercel), or production (canonical host).
- **Mismatch detection:** Production origin but redirect base pointing elsewhere; production without `NEXT_PUBLIC_SITE_URL`; or any localhost leak risk (redirect to localhost when not in local dev).

Only client-safe data is used. No secrets or server-only env are read or logged.

---

## How to use it

- **Where:** In development, open **`/debug/auth`**. The page shows the Auth/Supabase panel and below it the **Auth redirect preflight** block. In production, `/debug/*` returns 404, so the preflight is not accessible.
- **What to expect:** A list of fields: `origin`, `NEXT_PUBLIC_SITE_URL`, redirect base, sample `redirectTo`, canonical host, environment, host matches canonical, uses SITE_URL from env, mismatch flag, and any warnings.
- **Healthy:** Localhost: redirect base = origin; no warnings. Production (canonical host): redirect base = canonical URL; using SITE_URL from env; host matches canonical; no mismatch; no localhost leak risk.
- **Suspicious:** Warnings list non-empty; mismatch = Sim; localhost leak risk in production; or production without `NEXT_PUBLIC_SITE_URL` if you expect a single canonical domain.

---

## What it does NOT verify

- **Google Cloud Console:** OAuth consent screen branding, app name, logo, redirect URIs in Google.
- **Supabase dashboard:** Site URL, Redirect URLs allow list, provider config.
- **OAuth consent domain:** Whether the Google consent screen will show the Supabase domain or not. The preflight only checks in-repo redirect URL behavior; it does not and cannot change the OAuth callback domain shown by Google.

---

## Known limitations

- This helper validates **in-repo URL behavior only**. It does not change the OAuth callback domain shown by Google (that remains Supabase’s, or your custom auth domain if configured).
- The **Supabase domain may still appear** during the OAuth step unless a [custom auth domain](CUSTOM_AUTH_DOMAIN_ASSESSMENT.md) is configured.
- Final trust and correct redirects depend on **external configuration** (Supabase URL Configuration, Google OAuth client, Vercel env, and optionally custom auth domain). Use [GOOGLE_OAUTH_TRUST_CHECKLIST.md](GOOGLE_OAUTH_TRUST_CHECKLIST.md) and [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md).
