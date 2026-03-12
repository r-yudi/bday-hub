# Google OAuth trust: root cause and configuration

This note explains why users may see a Supabase domain during Google login and what can be done in code vs. in dashboards. It does **not** change app architecture, database, or auth flow.

**Execution:** Use [GOOGLE_OAUTH_TRUST_CHECKLIST.md](GOOGLE_OAUTH_TRUST_CHECKLIST.md) for step-by-step Supabase, Google Cloud, and Vercel configuration.  
**QA:** Use [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md) to validate the flow and trust copy end-to-end.

---

## Known limitations

- **The Supabase project domain may still appear** during the Google OAuth flow (e.g. in the URL bar or in Google’s “You will be redirected to…”). This is because the OAuth `redirect_uri` sent to Google is Supabase’s callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`). It is expected when using Supabase-hosted auth and **cannot be removed by app code or by configuring only the app’s domain**.
- **Branding improvements** (Google consent screen: app name, logo, support email, privacy/terms links) **reduce distrust** by making the app clearly “Lembra”, but they **do not** remove or hide the Supabase-hosted callback from the flow. Users may still see the Supabase domain during redirect.
- **The UI and copy must not promise** that only the Lembra domain will appear during login, unless the project has explicitly configured a custom auth domain (or equivalent) that guarantees it. Prefer honest trust: explain what data is shared and that the user may briefly see the Supabase redirect before returning to the app.

---

## A. Findings (diagnosis)

- **What the app does today**
  - Login uses Supabase Auth with `signInWithOAuth({ provider: "google", options: { redirectTo } })`.
  - `redirectTo` is the URL where the **app** receives the user after OAuth (e.g. `https://uselembra.com.br/auth/callback?returnTo=/today`). That URL is under the app’s domain.
  - Supabase’s **Site URL** and **Redirect URLs** allow list must include the app’s callback URL; the app sends `redirectTo` explicitly so it can point to the canonical production domain when desired.

- **Why Google shows a Supabase domain**
  - In the OAuth 2.0 flow, the **redirect_uri** sent to Google is Supabase’s callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase is the OAuth client that talks to Google; Google redirects the user to Supabase first, then Supabase redirects the user to our `redirectTo` (the app).
  - Google may display that redirect_uri or its host (the Supabase project domain) on the consent screen or in the browser (e.g. “You will be redirected to …” or the URL bar during redirect). So it is **expected** that the Supabase domain appears in that intermediate step when using Supabase-hosted auth.

- **What is *not* the cause**
  - The issue is not caused by a wrong `redirectTo` in code: `redirectTo` only controls where the user lands **after** the Supabase callback (on the app). The domain shown **during** the flow is Supabase’s.
  - It is not necessarily “broken” configuration; it is the default when the OAuth client (Supabase) uses its own host for the callback.

- **What can be improved**
  - **In repo:** Use a canonical app URL for `redirectTo` in production (via `NEXT_PUBLIC_SITE_URL`) so the post-login redirect always goes to the real app domain and we avoid sending users to localhost or preview URLs. Centralize redirect URL construction and document the flow.
  - **In dashboards:** Improve **trust** (not “hide” the redirect):
    - **Google Cloud Console:** OAuth consent screen branding (app name, logo, support email, homepage, privacy, terms) so the app is clearly “Lembra” even when the redirect domain is Supabase.
    - **Supabase:** Site URL and Redirect URLs set to the canonical app URL; ensure production domain is consistent.
  - **Optional (Supabase/Google):** If Supabase offers a custom auth domain for the project (e.g. auth.uselembra.com.br), configuring it would change the domain shown in the OAuth step; that is a platform/dashboard option, not something the app can enforce in code. Do not promise in copy that users will “only see Lembra” unless that is actually guaranteed by the infrastructure.

---

## B. Changes made in code

- **`lib/supabase-browser.ts`**
  - Added `getAuthRedirectBaseUrl()`: returns `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash) when set and in browser, otherwise `window.location.origin`. Used so production can always redirect to the canonical app URL after login.
  - Comment added: clarifies that the domain shown during the OAuth step is Supabase’s callback domain; points to this doc.

- **`components/AuthProvider.tsx`**
  - `signInWithGoogle` now builds `redirectTo` using `getAuthRedirectBaseUrl()` instead of `window.location.origin`, so when `NEXT_PUBLIC_SITE_URL` is set (e.g. `https://uselembra.com.br`), the callback URL is always the canonical domain.

No other files changed. No new dependencies, no schema or auth flow changes.

---

## C. Manual configuration still required

Use this checklist in addition to any existing runbooks. Items are either **code/config in repo** or **dashboard/manual**.

### Supabase Dashboard (Authentication → URL Configuration)

| Item | Action |
|------|--------|
| **Site URL** | Set to canonical app URL, e.g. `https://uselembra.com.br` (no trailing slash or with, per Supabase UI). |
| **Redirect URLs** | Include exact production callback, e.g. `https://uselembra.com.br/auth/callback` and, if needed, `https://uselembra.com.br/**`. For dev/preview: `http://localhost:3000/**`, and optionally `https://*.vercel.app/**` for previews. |

### Supabase Dashboard (Authentication → Providers → Google)

| Item | Action |
|------|--------|
| Google provider | Client ID and Client Secret from Google Cloud Console. |
| (No change to “domain shown”) | The redirect_uri used with Google is still Supabase’s (`https://<project-ref>.supabase.co/auth/v1/callback`); that is set by Supabase. |

### Google Cloud Console (APIs & Services → OAuth consent screen)

| Item | Action |
|------|--------|
| **App name** | e.g. “Lembra” (user-facing name). |
| **User support email** | Monitored email shown to users. |
| **App logo** | Square, 120×120 px (see Google’s specs). |
| **Application home page** | e.g. `https://uselembra.com.br`. |
| **Privacy Policy** | e.g. `https://uselembra.com.br/privacy`. |
| **Terms of Service** | e.g. `https://uselembra.com.br/terms`. |
| **Authorized domains** | Add your production domain (e.g. `uselembra.com.br`). For Supabase, Google will also need the Supabase project domain in redirect URIs (see below). |

### Google Cloud Console (APIs & Services → Credentials → OAuth 2.0 Client)

| Item | Action |
|------|--------|
| **Authorized JavaScript origins** | Add `https://uselembra.com.br`, and for dev `http://localhost:3000`. Add `https://<project-ref>.supabase.co` if required by Supabase (see Supabase/Google OAuth docs). |
| **Authorized redirect URIs** | Must include Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback`. Do not use the app’s `/auth/callback` here; Google redirects to Supabase first. |

### Environment variables (in repo / Vercel)

| Variable | Where | Action |
|----------|--------|--------|
| `NEXT_PUBLIC_SITE_URL` | Production (e.g. Vercel) | Set to canonical app URL, e.g. `https://uselembra.com.br` (no trailing slash). Optional but recommended so post-login redirect always uses the canonical domain. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already used | No change. |

### Custom auth domain

- **In this repo:** No code or config references a custom auth domain. Env and deployment do not assume one.
- **Platform:** Custom domain (e.g. `auth.uselembra.com.br`) is a Supabase **paid add-on**; it changes the OAuth callback URL shown to users. See [CUSTOM_AUTH_DOMAIN_ASSESSMENT.md](CUSTOM_AUTH_DOMAIN_ASSESSMENT.md) for a full decision assessment and [CUSTOM_AUTH_DOMAIN_CHECKLIST.md](CUSTOM_AUTH_DOMAIN_CHECKLIST.md) for implementation steps.
- Until a custom domain is configured and the app uses it as the Supabase URL, assume the `.supabase.co` domain may still appear.

---

## D. Residual limitation

Even after all safe in-repo and dashboard improvements:

- **The Supabase project domain may still appear** in the Google OAuth flow (consent screen or URL bar when redirecting), because Google’s redirect_uri is Supabase’s callback URL. That is expected with Supabase-hosted auth.
- **Do not promise in UI or copy** that users will “only see the Lembra domain” during login unless you have configured a custom auth domain or another setup that actually guarantees it. Prefer honest trust: explain what data is shared, that the app uses Google for sign-in, and that they may briefly see the Supabase redirect before returning to the app.

---

## References

- Supabase: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [URL Configuration](https://supabase.com/docs/guides/auth/general-configuration).
- Supabase: [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google) (custom domain recommendation for trust).
- Google: [OAuth consent screen](https://support.google.com/cloud/answer/10311615), [OAuth client redirect URIs](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred).
