"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

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
        <section className="ui-panel rounded-2xl border p-5 sm:p-6">
          <div className="ui-section-header ui-copy-backdrop">
            <p className="ui-eyebrow text-muted">LEMBRA · ENTRAR</p>
            <h1 className="ui-title-editorial text-2xl sm:text-[1.75rem]">Entrar com Google</h1>
            <p className="ui-subtitle-editorial mt-1 text-sm text-muted">
              Sincronize aniversários entre celular e computador. Você pode usar sem conta se preferir.
            </p>
          </div>

          {!configured && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-text">
              O login com Google ainda não está configurado neste ambiente. Defina `NEXT_PUBLIC_SUPABASE_URL` e
              `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </div>
          )}

          {configured && (
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={!initialized || submitting}
              className="btn-primary-brand ui-cta-primary mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accentHover hover:shadow-md disabled:cursor-not-allowed disabled:bg-accent/70 disabled:text-white/95 disabled:shadow-none focus-visible:outline-none"
            >
              {submitting ? "Redirecionando..." : "Entrar com Google"}
            </button>
          )}

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <details className="mt-4">
            <summary className="ui-disclosure-summary cursor-pointer text-xs text-muted">Ajuda</summary>
            <div className="mt-2">
              <Link href="/debug/supabase" className="ui-link-tertiary text-xs font-medium">
                Diagnóstico
              </Link>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
