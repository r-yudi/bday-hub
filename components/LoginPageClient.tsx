"use client";

/**
 * Implementação canônica da UI de /login. Única fonte de verdade para a tela de login.
 * Usado apenas por app/(app)/login/page.tsx. Inclui header, CTA Google, DataDisclosure, PrivacyReassurance, links.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPageClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const { configured, initialized, user, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !initialized || !user) return;
    router.replace(returnTo);
  }, [configured, initialized, user, returnTo, router]);

  async function handleGoogleLogin() {
    setSubmitting(true);
    setError(null);
    const result = await signInWithGoogle(returnTo);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="ui-container ui-page-shell ui-page-shell-centered max-w-sm">
      <div className="mx-auto w-full">
        <section
          className="ui-panel rounded-2xl border p-5 sm:p-6"
          aria-label="Login"
          data-login-canonical="full"
          data-page-canonical="login"
        >
          {/* LoginHeader */}
          <header className="LoginHeader">
            <h1
              className="ui-title-editorial text-2xl font-semibold tracking-tight text-text sm:text-[1.75rem]"
              data-login-heading="main"
            >
              Sincronize seus aniversários
            </h1>
            <p className="ui-subtitle-editorial mt-2 text-sm text-muted sm:text-[15px]">
              Entrar é opcional. Ao conectar sua conta, sua lista fica disponível em mais de um dispositivo.
            </p>
          </header>

          {!configured && (
            <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-text">
              O login com Google ainda não está configurado neste ambiente. Defina <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </div>
          )}

          {configured && (
            <div className="LoginPanel mt-6" data-login-cta-wrapper>
              <button
                type="button"
                onClick={() => void handleGoogleLogin()}
                data-login-cta="google"
                disabled={!initialized || submitting}
                className="ui-focus-surface ui-cta-primary flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-accentHover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-90 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                    Abrindo o Google...
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    Continuar com Google
                  </>
                )}
              </button>

              <p className="mt-3 text-xs text-muted">
                {submitting
                  ? "Você será redirecionado para a tela segura do Google para autorizar o acesso."
                  : "Usamos sua conta Google apenas para entrar com segurança."}
              </p>

              {error && (
                <p className="mt-3 text-sm text-danger" role="alert">
                  Não foi possível concluir o login com Google. Tente novamente.
                </p>
              )}
            </div>
          )}

          {/* DataDisclosure */}
          {configured && (
            <div
              className="DataDisclosure mt-5 rounded-xl border border-border/80 bg-surface/50 p-4"
              data-login-disclosure="shared"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">O que será compartilhado</h2>
              <p className="mt-1.5 text-sm text-text">
                Apenas seu <strong>nome e e-mail</strong> para criar ou identificar sua conta no Lembra.
              </p>
            </div>
          )}

          {/* PrivacyReassurance */}
          {configured && (
            <div
              className="PrivacyReassurance mt-3 rounded-xl border border-border/80 bg-surface/50 p-4"
              data-login-privacy="reassurance"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">O que NÃO acessamos</h2>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-text">
                <li>seus e-mails</li>
                <li>seus arquivos</li>
                <li>seus contatos</li>
                <li>fotos ou qualquer outro dado da sua conta Google</li>
              </ul>
              <p className="mt-3 text-xs text-muted">O login usa a autenticação segura do Google.</p>
              <p className="mt-1.5 text-xs text-muted">
                O endereço do Supabase pode aparecer brevemente durante o login; em seguida você volta ao Lembra.
              </p>
            </div>
          )}

          {/* LegalLinks */}
          <div className="LegalLinks mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link href="/privacy" className="ui-link-tertiary font-medium">
              Privacidade
            </Link>
            <Link href="/terms" className="ui-link-tertiary font-medium">
              Termos
            </Link>
            {process.env.NODE_ENV !== "production" && (
              <Link href="/debug/supabase" className="ui-link-tertiary font-medium text-muted">
                Diagnóstico
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
