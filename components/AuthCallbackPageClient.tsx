"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSafeBrowserSession } from "@/lib/supabase-browser";

type CallbackState =
  | { status: "loading"; attempt: number; message: string }
  | { status: "done" }
  | { status: "error"; message: string };

type SessionCheckResult = {
  hasSession: boolean;
  userId?: string;
  error?: string;
};

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function checkSessionOnce(): Promise<SessionCheckResult> {
  const { session, errorMessage, sessionRecovered } = await getSafeBrowserSession();
  if (session?.user) {
    return { hasSession: true, userId: session.user.id };
  }
  if (sessionRecovered) {
    return { hasSession: false, error: "Sessão expirada, entre novamente." };
  }
  if (errorMessage) {
    return { hasSession: false, error: errorMessage };
  }
  return { hasSession: false };
}

export function AuthCallbackPageClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    attempt: 0,
    message: "Processando retorno do Google..."
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let active = true;

    void (async () => {
      for (let attempt = 1; attempt <= 10; attempt += 1) {
        if (!active) return;
        setState({
          status: "loading",
          attempt,
          message: `Verificando sessão (${attempt}/10)...`
        });

        const result = await checkSessionOnce();
        if (!active) return;

        if (result.hasSession) {
          if (process.env.NODE_ENV === "development") {
            console.info("[auth-callback] session resolved", { userId: result.userId, attempt });
          }
          setState({ status: "done" });
          router.replace(returnTo || "/today");
          return;
        }

        if (result.error) {
          setState({ status: "error", message: result.error });
          return;
        }

        await wait(200);
      }

      setState({ status: "error", message: "Sessão não foi criada após o retorno OAuth." });
    })();

    return () => {
      active = false;
    };
  }, [mounted, returnTo, router]);

  const debugInfo = useMemo(
    () => ({
      querystring: mounted ? window.location.search : "",
      origin: mounted ? window.location.origin : ""
    }),
    [mounted]
  );

  if (state.status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-white/90 p-5 text-sm text-black/70">
        Redirecionando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">OAuth Callback</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black/90 sm:text-3xl">Finalizando login</h1>
        <p className="mt-2 text-sm text-black/70">{state.message}</p>
        {state.status === "loading" && <p className="mt-2 text-xs text-black/55">Tentativa atual: {state.attempt}/10</p>}
      </section>

      {state.status === "error" && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-medium">Não foi possível confirmar a sessão.</p>
          <p className="mt-1">{state.message}</p>

          <div className="mt-4 space-y-2 rounded-xl border border-rose-200/80 bg-white/70 p-3 text-xs text-rose-900/90">
            <p>
              <span className="font-semibold">Querystring atual:</span> <code>{debugInfo.querystring || "(vazia)"}</code>
            </p>
            <p>
              <span className="font-semibold">window.location.origin:</span> <code>{debugInfo.origin || "(indisponível)"}</code>
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-black/10 bg-white/80 p-3 text-xs text-black/75">
            <p className="font-semibold text-black/85">Checklist rápido de configuração</p>
            <p className="mt-1">
              1. Supabase `Authentication &gt; URL Configuration &gt; Redirect URLs` deve incluir o domínio atual com
              `/**` (ex.: `http://localhost:3000/**`).
            </p>
            <p className="mt-1">
              2. Google OAuth deve apontar para o redirect URI do Supabase:
              `https://&lt;project-ref&gt;.supabase.co/auth/v1/callback`.
            </p>
            <p className="mt-1">
              3. Após voltar do Google, este app precisa receber parâmetros na URL e o Supabase processar a sessão no
              browser.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <Link href={`/login?returnTo=${encodeURIComponent(returnTo || "/today")}`} className="btn-primary-brand rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover">
              Voltar para login
            </Link>
            <Link href="/debug/supabase" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5">
              Abrir debug Supabase
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
