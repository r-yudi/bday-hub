"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LandingCelebrationScene } from "@/components/landing/LandingCelebrationScene";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";

export function LandingPremiumPageClient() {
  const { configured, initialized, user } = useAuth();
  const isLoggedIn = Boolean(user);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "lembra_landing_sparkles_seen";
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    setShowSparkles(true);
    const timer = window.setTimeout(() => setShowSparkles(false), 260);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background bg-celebration-light px-4 py-6 dark:bg-celebration-dark sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle landing-grid-drift opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full glow-coral blur-3xl landing-glow-a" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full glow-lilac blur-3xl landing-glow-b" />

      <div className="relative mx-auto max-w-6xl space-y-10 lg:space-y-12">
        <section className="relative grid items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          <Reveal delay={40} className="relative z-[40]">
            <div className="hero-copy-backdrop">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1 text-[11px] font-semibold tracking-[0.02em] text-muted shadow-sm dark:bg-surface/35">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lembra. • Seu app de aniversários
              </div>

              <div className="mt-4 relative">
                {showSparkles && (
                  <div className="pointer-events-none absolute inset-x-0 -top-4 h-8">
                    <span className="landing-sparkle landing-sparkle-1" />
                    <span className="landing-sparkle landing-sparkle-3" />
                    <span className="landing-sparkle landing-sparkle-5" />
                  </div>
                )}
                <h1 className="text-balance text-[2.5rem] font-semibold leading-[0.96] tracking-[-0.025em] text-text sm:text-[3.2rem] sm:leading-[0.93] lg:text-[4.05rem] lg:leading-[0.9] xl:text-[4.45rem]">
                  Celebre todas as pessoas que <span className="landing-gradient-word">importam</span>.
                </h1>
              </div>

              <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.62] text-muted/95 sm:text-[17px] sm:leading-[1.58] dark:text-muted">
                Organize aniversários em minutos e lembre no momento certo, com uma experiência bonita e simples.
              </p>

              <Reveal delay={100}>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Chip as="span" variant="accent" className="landing-chip landing-chip-accent">
                    Lembretes no tempo certo
                  </Chip>
                  <Chip as="span" variant="subtle" className="landing-chip">
                    Importação CSV
                  </Chip>
                  <Chip as="span" variant="subtle" className="landing-chip">
                    Comece sem login
                  </Chip>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/today">
                    <Button size="lg" className="landing-cta-premium w-full sm:w-auto">
                      {isLoggedIn ? "Continuar no app" : "Começar agora"}
                    </Button>
                  </Link>
                  <Link href="/login?returnTo=%2Ftoday">
                    <Button variant="secondary" size="lg" className="landing-cta-secondary w-full sm:w-auto">
                      {configured ? (initialized && isLoggedIn ? "Trocar conta" : "Entrar com Google") : "Entrar com Google"}
                    </Button>
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={190}>
                <div className="mt-6 inline-flex max-w-full items-center gap-2.5 text-[13px] leading-5 text-muted sm:text-sm">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/18 bg-accent/10 text-[12px] text-accent">✓</span>
                  <span className="text-balance">
                    <span className="font-medium text-text/90">Hoje:</span> 3 aniversários na sua lista • mensagens prontas e links rápidos.
                  </span>
                </div>
              </Reveal>
            </div>
          </Reveal>

          <Reveal delay={90} className="relative z-[20] lg:pt-1 xl:pt-0">
            <LandingCelebrationScene />
          </Reveal>
        </section>

        <section>
          <Reveal delay={90}>
            <div className="feature-row">
              <div className="feature-row-item">
                <div className="feature-row-icon" aria-hidden>1</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Como funciona</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">Cadastre rápido</h2>
                  <p className="mt-1 text-sm text-muted">
                    Adicione manualmente ou importe CSV. O app organiza por hoje e próximos dias automaticamente.
                  </p>
                </div>
              </div>

              <div className="feature-row-divider" aria-hidden />

              <div className="feature-row-item">
                <div className="feature-row-icon" aria-hidden>2</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sem atrito</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">Use sem login</h2>
                  <p className="mt-1 text-sm text-muted">
                    Tudo funciona no seu dispositivo desde o primeiro uso. Se quiser, você pode entrar depois.
                  </p>
                </div>
              </div>

              <div className="feature-row-divider" aria-hidden />

              <div className="feature-row-item">
                <div className="feature-row-icon" aria-hidden>3</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Em qualquer lugar</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">Sincronize sua lista</h2>
                  <p className="mt-1 text-sm text-muted">
                    Com login, sua lista acompanha você em outros dispositivos com segurança e privacidade.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <Reveal delay={220}>
          <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border/75 bg-surface/70 px-4 py-3 text-sm text-muted shadow-sm sm:flex-row sm:items-center dark:bg-surface/35">
            <p>Lembra. • Nunca mais esqueça um aniversário 🎉</p>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-text">Privacidade</Link>
              <Link href="/terms" className="hover:text-text">Termos</Link>
              <Link href="/styleguide" className="hover:text-text">Styleguide</Link>
            </div>
          </footer>
        </Reveal>
      </div>
    </div>
  );
}
