"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LandingCelebrationScene } from "@/components/landing/LandingCelebrationScene";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";

const DEBUG_LANDING_SCENE = false;

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
    const timer = window.setTimeout(() => setShowSparkles(false), 320);
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
      <div className="pointer-events-none absolute bottom-10 right-16 h-40 w-40 rounded-full bg-warning/15 blur-3xl landing-glow-a" />
      <div className="pointer-events-none absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-primary/60 shadow-[0_0_18px_hsl(var(--primary)/0.4)] landing-glow-b" />
      <div className="pointer-events-none absolute right-[18%] top-[32%] h-2 w-2 rounded-full bg-lilac/70 shadow-[0_0_18px_hsl(var(--lilac)/0.45)] landing-glow-a" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <LandingCelebrationScene />

          <div className="relative z-[40] space-y-5">
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-medium text-muted shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lembra. • Seu app de aniversários
              </div>
            </Reveal>

            <Reveal delay={50}>
              <div className="relative">
                {showSparkles && (
                  <div className="pointer-events-none absolute inset-x-0 -top-4 h-10">
                    <span className="landing-sparkle landing-sparkle-1" />
                    <span className="landing-sparkle landing-sparkle-2" />
                    <span className="landing-sparkle landing-sparkle-3" />
                    <span className="landing-sparkle landing-sparkle-4" />
                    <span className="landing-sparkle landing-sparkle-5" />
                    <span className="landing-sparkle landing-sparkle-6" />
                  </div>
                )}
                <h1 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl">
                  Celebre todas as pessoas que <span className="landing-gradient-word">importam</span>.
                </h1>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                O Lembra. organiza aniversários de um jeito simples e acolhedor. Comece no seu dispositivo e, quando
                quiser, entre com Google para continuar sua lista em outros lugares.
              </p>
            </Reveal>

            <Reveal delay={150}>
              <div className="flex flex-wrap gap-2">
                <Chip as="span" variant="accent">Lembretes no tempo certo</Chip>
                <Chip as="span" variant="subtle">Importação CSV</Chip>
                <Chip as="span" variant="subtle">Comece sem login</Chip>
                <Chip as="span" variant="subtle">Sincronize depois</Chip>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="flex flex-col gap-3 sm:flex-row">
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

            <Reveal delay={240}>
              <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
                <p className="rounded-xl border border-border/70 bg-surface/70 px-3 py-2">• Veja quem faz aniversário hoje e nos próximos dias.</p>
                <p className="rounded-xl border border-border/70 bg-surface/70 px-3 py-2">• Compartilhe carinho com mensagens prontas e links simples.</p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={170} className="relative z-[30]">
            <Card
              variant="elevated"
              className={`feature-spotlight shine-sweep relative overflow-hidden p-5 sm:p-6 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg ${DEBUG_LANDING_SCENE ? "outline outline-2 outline-cyan-400" : ""}`}
              onPointerMove={handleFeaturePointerMove}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl landing-glow-a" />
              <div className="absolute -left-6 bottom-8 h-24 w-24 rounded-full bg-lilac/15 blur-2xl landing-glow-b" />
              <div className="relative space-y-4">
                <div className="rounded-lg border border-border bg-surface2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Hoje</p>
                  <p className="mt-1 text-lg font-semibold text-text">3 aniversários 🎉</p>
                  <p className="mt-1 text-sm text-muted">João, Ana e Marina estão na sua lista de hoje.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="feature-spotlight rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-250 ease-brand hover:-translate-y-0.5 hover:shadow-md" onPointerMove={handleFeaturePointerMove}>
                    <p className="text-sm font-medium text-text">Categorias</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip as="span" variant="warning">Família</Chip>
                      <Chip as="span" variant="subtle">Amigos</Chip>
                      <Chip as="span" variant="subtle">Trabalho</Chip>
                    </div>
                  </div>
                  <div className="feature-spotlight rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-250 ease-brand hover:-translate-y-0.5 hover:shadow-md" onPointerMove={handleFeaturePointerMove}>
                    <p className="text-sm font-medium text-text">Mensagem pronta</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      “Parabéns! Que seu dia seja leve, feliz e cheio de boas surpresas 🎂”
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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
