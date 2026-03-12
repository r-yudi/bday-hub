# Custom auth domain — decision assessment

Evidence-based assessment of whether a Supabase custom auth domain can address the trust issue (users seeing a technical Supabase domain during Google login). No change to auth architecture or code flow in this doc.

---

## 1. Problem

During Google OAuth, users see a long technical domain such as:

`https://<project-ref>.supabase.co/auth/v1/callback`

Multiple users have said they would not log in with Google because it looks like a scam or phishing flow. Login UI trust copy and Google consent screen branding are already in place; the remaining source of distrust is this Supabase project domain appearing in the flow (in the URL bar when redirecting and/or in Google’s consent/redirect messaging).

---

## 2. Current behavior

- The app calls `signInWithOAuth({ provider: "google", options: { redirectTo } })` with `redirectTo` set to the **app** URL (e.g. `https://uselembra.com.br/auth/callback?returnTo=/today`). That controls where the user lands **after** OAuth.
- In the OAuth 2.0 flow, the **redirect_uri** sent to Google is **Supabase’s** callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase is the OAuth client; Google redirects the user to Supabase first, then Supabase redirects to the app’s `redirectTo`.
- The domain that **users see** during the flow (URL bar or “You will be redirected to…”) is therefore the host of that redirect_uri: **`<project-ref>.supabase.co`**. This is expected with default Supabase-hosted auth and cannot be changed by app code or by configuring only the app’s domain.

---

## 3. Would a custom auth domain help?

**Yes**, if Supabase custom domain is available for your project and is correctly configured.

Supabase’s own docs state:

- “It’s strongly recommended you set up a **custom domain** for your project … to present the user with a clear relationship to the website they clicked Sign in with Google on.”
- “If you don’t set this up, users will see **`.supabase.co`** which does not inspire trust and can make your application more susceptible to successful phishing attempts.”
- Custom domains “change the way your project’s URLs appear” and are explicitly listed as useful when “you are using **OAuth (Social Login)** with Supabase Auth and the project’s URL is shown on the OAuth consent screen.”
- After activation, “OAuth flows will **advertise the custom domain** as a callback URL.”

So the **redirect_uri** sent to Google would become something like `https://auth.uselembra.com.br/auth/v1/callback` instead of `https://<project-ref>.supabase.co/auth/v1/callback`. The domain shown to users during the OAuth step would then be your domain (e.g. `auth.uselembra.com.br`), which directly addresses the reported trust issue.

**Uncertainty:** This depends on your Supabase **plan and add-ons**. Custom domains are documented as a **paid add-on** for projects on a paid plan. Availability and exact steps must be confirmed in the [Supabase Dashboard](https://supabase.com/dashboard) (e.g. **Project → Settings → General** or **Add-ons**) and in the [Custom Domains guide](https://supabase.com/docs/guides/platform/custom-domains).

---

## 4. What would need to change

### Supabase dashboard / platform

- Confirm the project is on a **paid plan** and that the **Custom Domains** add-on is available and enabled.
- Follow Supabase’s Custom Domains flow (Dashboard **General Settings** or CLI): register the custom hostname (e.g. `auth.uselembra.com.br`), add DNS records, verify, then activate.
- No change to “Redirect URLs” or “Site URL” logic in Supabase for the **app** callback; those still point to the app (e.g. `https://uselembra.com.br/auth/callback`). The change is that the **Supabase project URL** (used as the OAuth client and thus as redirect_uri toward Google) becomes the custom domain.

### DNS / domain

- **CNAME:** Custom domain (e.g. `auth.uselembra.com.br`) must point to the project’s default Supabase domain (e.g. `<project-ref>.supabase.co`). Exact target hostname: **verify in Supabase dashboard/docs** (e.g. “Add a CNAME record” in the custom domains flow).
- **TXT (verification):** Supabase returns verification records (e.g. `_acme-challenge.<custom-hostname>`). Add the exact value provided in the dashboard/CLI.
- **SSL:** Supabase issues the certificate (e.g. via Let’s Encrypt) after DNS verification; no separate certificate setup by you.

### Google Cloud Console

- In the OAuth 2.0 client **Authorized redirect URIs**, **add** the new callback URL:  
  `https://auth.uselembra.com.br/auth/v1/callback`  
  (or the exact custom domain you activated). Keep the existing Supabase URL until the custom domain is active and tested, then you can remove it if desired.
- **Authorized JavaScript origins:** Add `https://auth.uselembra.com.br` if required by your flow; **verify in Supabase/Google docs** whether this is needed for web OAuth.

### Code / repo

- The Supabase **client** must use the **custom domain** as the project URL for auth to go through it (so that the redirect_uri sent to Google is the custom domain). In practice that means **`NEXT_PUBLIC_SUPABASE_URL`** (or equivalent) should be set to the custom domain (e.g. `https://auth.uselembra.com.br`) in production. The same anon key is used; only the base URL changes.
- **No** change to auth flow, `redirectTo` construction, or callback handling is required; only the env value for the Supabase URL. So: **small config change** (env), no architectural or schema change.

### QA validation

- After cutover: run the existing [QA_GOOGLE_LOGIN_TRUST](QA_GOOGLE_LOGIN_TRUST.md) checklist and confirm that the domain shown during the Google OAuth step is the custom domain (e.g. `auth.uselembra.com.br`) and no longer `*.supabase.co`.
- Confirm login end-to-end (redirect to app, session, `returnTo`) still works.

---

## 5. Risks and limitations

- **Setup complexity:** DNS (CNAME + TXT), verification, and activation; Google redirect URI update; env update and deploy. One-time but non-trivial.
- **Rollout risk:** If the custom domain is not yet active or DNS is wrong, auth can break. Supabase docs recommend adding the custom-domain callback URL in Google **before** activating, and the original Supabase domain remains active, so you can test and roll back by reverting the env.
- **Residual visibility of a technical domain:** Once the custom domain is the only (or primary) Supabase URL used by the app, Google should show that custom domain. It is still a “technical” path (`/auth/v1/callback`) but under your hostname. There is no guarantee that every browser or Google UI will never show any other hint; the main improvement is that the **redirect_uri** host is your domain.
- **Plan dependency:** Custom domains are a **paid add-on** on a paid plan. If the project is on the free tier, this option is not available until the plan/add-on is changed.
- **Single custom domain per project:** Only one custom domain per Supabase project; it replaces the project URL for all services (Auth, API, etc.) when used. Subdomain only (e.g. `auth.uselembra.com.br`), not apex (e.g. `uselembra.com.br`) — **verify in Supabase docs** for current constraints.

---

## 6. Recommendation

**Proceed with custom auth domain investigation now.**

- **Reason:** Real user feedback shows that the current Supabase domain in the Google login flow is causing distrust and refusal to log in. Supabase explicitly documents custom domains as the way to fix this (“users will see `.supabase.co` which does not inspire trust”) and to present a “clear relationship to the website they clicked Sign in with Google on.” The change is configuration- and env-led, with no auth architecture or schema change.
- **Next step:** Confirm in the Supabase Dashboard (plan, add-ons, General Settings / Custom Domains) that custom domain is available for this project. If yes, follow [CUSTOM_AUTH_DOMAIN_CHECKLIST.md](CUSTOM_AUTH_DOMAIN_CHECKLIST.md) to collect information, prepare DNS and Google, then activate and switch the app’s Supabase URL to the custom domain in production.

If the project cannot use the custom domain add-on (e.g. plan or budget), the only remaining options are to accept the current trust limitation or to evaluate a different auth architecture later (out of scope for this assessment).
