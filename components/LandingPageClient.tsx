"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";

export function LandingPageClient() {
  const { configured, initialized, user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Lembra. • Aniversários</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text sm:text-5xl">Nunca mais esqueça aniversários.</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Um jeito simples de lembrar quem importa: use no seu dispositivo e, quando quiser, entre para sincronizar.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Lembretes e visão rápida de quem faz aniversário hoje e nos próximos dias.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Sincronização ao entrar com Google, mantendo a experiência simples.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Importação CSV para começar rápido sem cadastrar tudo manualmente.</span>
            </li>
          </ul>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link href="/today">
              <Button className="w-full sm:w-auto">{isLoggedIn ? "Continuar" : "Começar agora"}</Button>
            </Link>
            <Link href="/login?returnTo=%2Ftoday">
              <Button variant="secondary" className="w-full sm:w-auto">
                {configured ? (initialized && isLoggedIn ? "Entrar com outra conta" : "Entrar com Google") : "Entrar com Google"}
              </Button>
            </Link>
          </div>

          {!configured && (
            <p className="mt-3 text-xs text-warning">
              Login com Google disponível quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-text">Modo local</h2>
          <p className="mt-1 text-sm text-muted">Use sem login e mantenha os dados no dispositivo.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-text">Compartilhamento simples</h2>
          <p className="mt-1 text-sm text-muted">Gere links com nome + dia/mês para compartilhar aniversários.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-text">Feito para rotina</h2>
          <p className="mt-1 text-sm text-muted">Interface rápida para adicionar, importar e revisar aniversários.</p>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-muted">
        <p>Lembra. • Nunca mais esqueça um aniversário 🎉</p>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-text">
            Política de Privacidade
          </Link>
          <Link href="/terms" className="hover:text-text">
            Termos
          </Link>
        </div>
      </footer>
    </div>
  );
}
