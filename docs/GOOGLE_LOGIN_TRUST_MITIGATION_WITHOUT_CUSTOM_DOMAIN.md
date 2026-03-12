# Google login trust — mitigation without custom domain

**Context:** Supabase custom auth domain is **not** available for this project/plan. The technical Supabase domain will remain visible during Google OAuth. This doc is the decision-ready mitigation package for that constraint.

---

## 1. What problem remains unsolved

- **Users see** a long technical URL (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`) during the Google login flow—in the browser bar and/or in Google’s “You will be redirected to…” messaging.
- **Impact:** Real users have said they avoid or abandon Google login because it looks like a scam or phishing flow. This is a **trust and conversion** problem.
- We **cannot remove or hide** this domain with the current stack: the OAuth redirect_uri is Supabase’s callback URL; changing that would require a custom auth domain (Supabase paid add-on), which is not available for this project.

---

## 2. Why it remains unsolved

- The OAuth client that talks to Google is **Supabase**. Google redirects the user to Supabase’s callback URL; that host is what appears in the flow.
- Custom auth domain would replace that host with a domain we own (e.g. `auth.uselembra.com.br`) but is **not available** for this project/plan.
- No in-repo or dashboard configuration can change the redirect_uri host without that feature. So the Supabase domain **will** remain visible until the platform offers and the project enables a custom domain.

---

## 3. What mitigations already exist

- **Trust copy before redirect:** Title and subtitle on `/login` (“Sincronize seus aniversários”; “Entrar é opcional. Ao conectar sua conta…”).
- **Data disclosure:** “O que será compartilhado” (only name and email); “O que NÃO acessamos” (e-mails, files, contacts, photos, etc.).
- **Loading/redirection state:** Button disables, “Abrindo o Google...”, spinner, helper “Você será redirecionado para a tela segura do Google para autorizar o acesso.”
- **Error states:** Inline error on `/login` and error + “Voltar para login” on `/auth/callback`.
- **Legal links:** Privacidade, Termos (and Diagnóstico for dev).
- **Privacy page:** Mentions Supabase Auth (Google) and where data is stored (Supabase with RLS).
- **Operational docs:** [GOOGLE_OAUTH_TRUST.md](GOOGLE_OAUTH_TRUST.md), [GOOGLE_OAUTH_TRUST_CHECKLIST.md](GOOGLE_OAUTH_TRUST_CHECKLIST.md), [GOOGLE_LOGIN_RELEASE_READY.md](GOOGLE_LOGIN_RELEASE_READY.md).
- **QA:** [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md).
- **Auth preflight:** [AUTH_PREFLIGHT.md](AUTH_PREFLIGHT.md) and `/debug/auth` panel for redirect URL validation.
- **Known limitations:** Docs state clearly that the Supabase domain may still appear and that the UI must not promise otherwise.

---

## 4. What additional mitigations are still possible (without architecture change)

- **Set expectation before redirect:** One short, honest line that the user may briefly see the Supabase address before returning to Lembra. Implemented as a single sentence on the login page (see §7 below).
- **Keep Privacy explicit:** Privacy policy already names Supabase and Google; keep that so users who check can match the domain they see.
- **Support path:** Ensure a visible way to reach support (e.g. contact link) from the login area so hesitant users can ask; current legal links already include Privacidade/Termos; add contact/support only if not already reachable from there.
- **No further promises:** Do not add copy that implies we can hide the Supabase domain or that “only Lembra” will appear. Do not overclaim.

---

## 5. What cannot honestly be promised

- That **only** the Lembra domain will appear during login.
- That the Supabase domain will **not** appear.
- That we can **remove** or **hide** the technical callback URL with current infrastructure.
- That every hesitant user will convert; some will still abandon when they see an unfamiliar domain, and that is a known limitation.

---

## 6. Recommendation on launch acceptability

- **With current mitigations plus the one addition below:** The experience is **as strong as it can be** without custom domain. We set expectation, disclose data, name Supabase, and avoid false promises. Some users will still distrust the Supabase URL; that risk cannot be eliminated in-repo.
- **Recommendation:** Treat the current experience as **acceptable for launch** **if** the product decision is to ship without custom auth domain, with the understanding that:
  - Login conversion may remain lower than ideal for a segment of users who refuse when they see the Supabase domain.
  - Revisit custom auth domain (or alternative auth architecture) if/when the plan or platform allows and the impact justifies it.

---

## 7. Single in-repo improvement applied

One expectation-setting sentence was added to the login page so users are not surprised by the Supabase address (see `components/LoginPageClient.tsx`, PrivacyReassurance block):

- **“O endereço do Supabase pode aparecer brevemente durante o login; em seguida você volta ao Lembra.”**

This names Supabase, sets the expectation that its domain may appear, and reassures that they return to Lembra. It does not promise that the Supabase domain will be hidden.

---

## References

- [GOOGLE_OAUTH_TRUST.md](GOOGLE_OAUTH_TRUST.md) — root cause and config  
- [CUSTOM_AUTH_DOMAIN_ASSESSMENT.md](CUSTOM_AUTH_DOMAIN_ASSESSMENT.md) — why custom domain is not available and what would be needed  
- [QA_GOOGLE_LOGIN_TRUST.md](QA_GOOGLE_LOGIN_TRUST.md) — validation checklist  
