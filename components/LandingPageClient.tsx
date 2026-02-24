"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function LandingPageClient() {
  const { configured, initialized, user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/95 p-6 shadow-sm sm:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-warm/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Lembra. • Aniversários</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-black/90 sm:text-5xl">
            Nunca mais esqueça aniversários.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-black/70">
            Um jeito simples de lembrar quem importa: use no modo local ou faça login para sincronizar entre dispositivos.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-black/75">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Lembretes e visão rápida de quem faz aniversário hoje e nos próximos dias.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Sincronização multi-device ao entrar com Google (Supabase + RLS).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">•</span>
              <span>Importação CSV para começar rápido sem cadastrar tudo manualmente.</span>
            </li>
          </ul>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link href="/today" className="btn-primary-brand rounded-xl bg-accent px-5 py-2.5 text-center text-sm text-white hover:bg-accentHover">
              {isLoggedIn ? "Continuar" : "Começar agora"}
            </Link>
            <Link
              href="/login?returnTo=%2Ftoday"
              className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-center text-sm hover:bg-black/5"
            >
              {configured ? (initialized && isLoggedIn ? "Entrar com outra conta" : "Entrar com Google") : "Entrar com Google"}
            </Link>
          </div>

          {!configured && (
            <p className="mt-3 text-xs text-amber-800">
              Login com Google disponível quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-black/85">Modo guest</h2>
          <p className="mt-1 text-sm text-black/70">Use sem login e mantenha os dados no dispositivo.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-black/85">Compartilhamento simples</h2>
          <p className="mt-1 text-sm text-black/70">Gere links com nome + dia/mês para compartilhar aniversários.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/85 p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-black/85">Feito para rotina</h2>
          <p className="mt-1 text-sm text-black/70">Interface rápida para adicionar, importar e revisar aniversários.</p>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/65">
        <p>Lembra. • Nunca mais esqueça um aniversário 🎉</p>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-black/85">
            Política de Privacidade
          </Link>
          <Link href="/terms" className="hover:text-black/85">
            Termos
          </Link>
        </div>
      </footer>
    </div>
  );
}
