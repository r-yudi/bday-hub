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
    <div className="mx-auto max-w-md space-y-5">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Lembra. • Login</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black/90 sm:text-[2rem]">Entrar com Google</h1>
        <p className="mt-2 text-sm text-black/70">Faça login para continuar com seus aniversários em qualquer dispositivo.</p>

        {!configured && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            O login com Google ainda não está configurado neste ambiente. Defina `NEXT_PUBLIC_SUPABASE_URL` e
            `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </div>
        )}

        {configured && (
          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={!initialized || submitting}
            className="btn-primary-brand mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accentHover hover:shadow-md disabled:cursor-not-allowed disabled:bg-accent/70 disabled:text-white/95 disabled:shadow-none"
          >
            {submitting ? "Redirecionando..." : "Entrar com Google"}
          </button>
        )}

        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-4 flex items-center justify-between text-xs text-black/60">
          <span>Você volta para: {returnTo}</span>
          <Link href="/debug/supabase" className="underline decoration-black/20 underline-offset-2 hover:text-black/85">
            Diagnóstico
          </Link>
        </div>
      </section>
    </div>
  );
}
