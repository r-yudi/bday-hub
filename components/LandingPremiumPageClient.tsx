"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LandingCelebrationScene } from "@/components/landing/LandingCelebrationScene";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

  function handleFeaturePointerMove(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--mx", `${x}%`);
    event.currentTarget.style.setProperty("--my", `${y}%`);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background bg-celebration-light px-4 py-6 dark:bg-celebration-dark sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle landing-grid-drift opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full glow-coral blur-3xl landing-glow-a" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full glow-lilac blur-3xl landing-glow-b" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="relative grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <Reveal delay={40} className="relative z-[40]">
            <div className="hero-text-card">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/85 px-3 py-1 text-xs font-medium text-muted shadow-sm">
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
                <h1 className="text-4xl font-semibold leading-[0.95] tracking-tight text-text sm:text-5xl lg:text-6xl">
                  Celebre todas as pessoas que <span className="landing-gradient-word">importam</span>.
                </h1>
              </div>

              <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-muted sm:text-lg">
                Organize aniversários em minutos e lembre no momento certo, com uma experiência bonita e simples.
              </p>

              <Reveal delay={100}>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip as="span" variant="accent">Lembretes no tempo certo</Chip>
                  <Chip as="span" variant="subtle">Importação CSV</Chip>
                  <Chip as="span" variant="subtle">Comece sem login</Chip>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link href="/today">
                    <Button size="lg" className="landing-cta-premium w-full sm:w-auto">
                      {isLoggedIn ? "Continuar no app" : "Começar agora"}
                    </Button>
                  </Link>
                  <Link href="/login?returnTo=%2Ftoday">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      {configured ? (initialized && isLoggedIn ? "Trocar conta" : "Entrar com Google") : "Entrar com Google"}
                    </Button>
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={190}>
                <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-border/80 bg-surface/70 px-3 py-2 text-sm text-muted shadow-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  Hoje: 3 aniversários na sua lista • mensagens prontas e links rápidos.
                </div>
              </Reveal>
            </div>
          </Reveal>

          <Reveal delay={90} className="relative z-[20]">
            <LandingCelebrationScene />
          </Reveal>
        </section>

        <section className="grid gap-4 lg:grid-cols-12">
          <Reveal delay={70} className="lg:col-span-4">
            <Card variant="bento" className="feature-spotlight shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg" onPointerMove={handleFeaturePointerMove}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Como funciona</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">1. Cadastre rápido</h2>
              <p className="mt-2 text-sm text-muted">
                Adicione manualmente ou importe CSV. O app organiza por hoje e próximos dias automaticamente.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={130} className="lg:col-span-4">
            <Card variant="bento" className="feature-spotlight shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg" onPointerMove={handleFeaturePointerMove}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sem atrito</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">2. Use sem login</h2>
              <p className="mt-2 text-sm text-muted">
                Tudo funciona no seu dispositivo desde o primeiro uso. Se quiser, você pode entrar depois.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={190} className="lg:col-span-4">
            <Card variant="bento" className="feature-spotlight shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg" onPointerMove={handleFeaturePointerMove}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Em qualquer lugar</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">3. Sincronize sua lista</h2>
              <p className="mt-2 text-sm text-muted">
                Com login, sua lista acompanha você em outros dispositivos com segurança e privacidade.
              </p>
            </Card>
          </Reveal>
        </section>

        <Reveal delay={220}>
          <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3 text-sm text-muted sm:flex-row sm:items-center">
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
