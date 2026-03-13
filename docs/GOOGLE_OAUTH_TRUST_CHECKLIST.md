# Google OAuth trust — execution checklist

Step-by-step configuration for Supabase, Google Cloud, and Vercel. Use after reading [GOOGLE_OAUTH_TRUST.md](GOOGLE_OAUTH_TRUST.md) for context. For release handoff and operator sequence: [GOOGLE_LOGIN_RELEASE_READY.md](GOOGLE_LOGIN_RELEASE_READY.md).

**Canonical production values (Lembra):**  
- App URL: `https://uselembra.com.br`  
- Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback` (replace `<project-ref>` with your project reference from Supabase dashboard or `NEXT_PUBLIC_SUPABASE_URL`).

---

## 1. Supabase dashboard

### 1.1 Where to set Site URL and Redirect URLs

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** (left sidebar) → **URL Configuration**.

### 1.2 Site URL

| Environment | Value |
|-------------|--------|
| **Production** | `https://uselembra.com.br` |
| **Dev** | Can leave as production if you use redirect URLs for localhost; or set `http://localhost:3000` for default redirect. |

- **Action:** Set **Site URL** to `https://uselembra.com.br` (no trailing slash; Supabase may add or accept with slash—check UI).
- **Validate after save:** Reload the page and confirm the field shows the correct URL.

### 1.3 Redirect URLs (allow list)

Add these **exact or wildcard** entries. Order does not matter.

| Purpose | Value |
|---------|--------|
| Production callback | `https://uselembra.com.br/auth/callback` |
| Production (any path) | `https://uselembra.com.br/**` |
| Local dev | `http://localhost:3000/**` |
| Vercel previews (optional) | `https://*.vercel.app/**` |

- **Action:** In **Redirect URLs**, add each line above. Save.
- **Validate after save:** List should show all entries. Try a login from production and from `http://localhost:3000`; both should land on `/auth/callback` without “redirect URL not allowed”.

### 1.4 Google provider (Authentication → Providers → Google)

- **Action:** Ensure **Client ID** and **Client Secret** from Google Cloud are set. No other Supabase setting changes the domain shown during the OAuth step (that is the Supabase callback domain).

---

## 2. Google Cloud Console

### 2.1 OAuth consent screen (trust / branding)

Path: **APIs & Services** → **OAuth consent screen**.

| Field | What to set | Affects trust |
|-------|-------------|----------------|
| **App name** | `Lembra` (or your app name) | Shown on consent screen. |
| **User support email** | A monitored email (e.g. `contato@uselembra.com.br`) | Shown to users. |
| **App logo** | 120×120 px, square (PNG/JPG) | Shown on consent screen if configured. |
| **Application home page** | `https://uselembra.com.br` | Linked from consent. |
| **Privacy Policy** | `https://uselembra.com.br/privacy` | Required for production. |
| **Terms of Service** | `https://uselembra.com.br/terms` | Optional but recommended. |
| **Authorized domains** | `uselembra.com.br` (no `https://`) | Required for production origins/redirects. |
| **App publishing status** | Testing → Production when ready | “Testing” limits to added test users; “Production” allows any Google account. |

- **Validate after save:** Re-run the consent screen config; confirm app name, logo, and links appear as expected. Do a test login and check the Google consent screen.

### 2.2 OAuth 2.0 Client ID (Credentials)

Path: **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (Web application).

**Authorized JavaScript origins**

| Environment | Value |
|-------------|--------|
| Production | `https://uselembra.com.br` |
| With www | `https://www.uselembra.com.br` (only if you use www) |
| Local dev | `http://localhost:3000` |

- **Action:** Add the origins above. Do **not** add the Supabase domain here unless Google or Supabase docs require it for your flow.
- **Validate:** Save and retry login; no “redirect_uri mismatch” or “origin not allowed” from Google.

**Authorized redirect URIs**

| Required | Value |
|----------|--------|
| **Yes (exactly one for this app)** | `https://<project-ref>.supabase.co/auth/v1/callback` |

- **Action:** Ensure the **only** redirect URI for this OAuth client is the Supabase callback above. Replace `<project-ref>` with your Supabase project reference (from dashboard URL or from `NEXT_PUBLIC_SUPABASE_URL`, e.g. `https://xxxx.supabase.co` → `xxxx`).
- **Do NOT add:** `https://uselembra.com.br/auth/callback` or any app URL. Google redirects to Supabase first; Supabase then redirects to the app using `redirectTo`.
- **Validate after save:** Login flow should complete without “redirect_uri_mismatch”.

---

## 3. Vercel / environment variables

### 3.1 NEXT_PUBLIC_SITE_URL (production)

| Variable | Environment | Value |
|----------|-------------|--------|
| `NEXT_PUBLIC_SITE_URL` | Production | `https://uselembra.com.br` |

- **Action:** In Vercel → Project → Settings → Environment Variables, add `NEXT_PUBLIC_SITE_URL` = `https://uselembra.com.br` for **Production**. No trailing slash.
- **Preview:** Do **not** set this for Preview if you want preview deployments to redirect back to the preview URL after login. If you leave it unset for Preview, the app uses `window.location.origin` (the preview URL). If you set it for Preview too, post-login redirect will go to production (may be desirable or not).
- **Validate:** After deploy, open production `/login` in an incognito window, click “Continuar com Google”, complete login; you must land on `https://uselembra.com.br/auth/callback` then redirect to the app. URL bar must show `uselembra.com.br`, not localhost or a Vercel preview domain.

### 3.2 Confirm client receives the variable

- **Action:** Build and deploy; the value is baked into the client bundle at build time. If you change it in Vercel, trigger a new deploy.
- **Quick check:** In browser devtools (production), you cannot read `process.env.NEXT_PUBLIC_SITE_URL` directly; confirm behavior: from production `/login`, after Google login you land on `https://uselembra.com.br/auth/callback` (not a preview URL).

---

## 4. Validation summary

After completing all steps:

1. **Supabase:** URL Configuration shows correct Site URL and Redirect URLs; login from prod and dev works.
2. **Google:** Consent screen shows Lembra app name (and logo if set); redirect URI is only the Supabase callback; no mismatch errors.
3. **Vercel:** Production has `NEXT_PUBLIC_SITE_URL`; after login, user returns to `https://uselembra.com.br`, not preview/localhost.

For end-to-end QA steps, see [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md).
