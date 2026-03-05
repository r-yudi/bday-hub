"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LandingCelebrationScene } from "@/components/landing/LandingCelebrationScene";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function LandingPremiumPageClient() {
  const { configured, initialized, user } = useAuth();
  const isLoggedIn = Boolean(user);
  const primaryLabel = useMemo(() => (isLoggedIn ? "Continuar no app" : "Quero aparecer no dia"), [isLoggedIn]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-background px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle opacity-30" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-landing-depth-light" />

      <div className="relative mx-auto max-w-6xl space-y-10 lg:space-y-12">
        {/* Radial Cut Explosion: abstraction only — shape >= 60vw from corner, ribbon, orbs, large particles; copy over mass */}
        <section className="hero-radialcut-section relative py-10 sm:py-12 lg:py-14">
          <LandingCelebrationScene variant="radialcut" />
          <div className="hero-radialcut-spotlight" aria-hidden />
          <Reveal delay={30} className="hero-radialcut-copy flex flex-col items-start">
            <div className="hero-copy-backdrop landing-hero-copy max-w-[42rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.02em] text-muted shadow-sm" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-primary" />
                Lembra.
              </div>

              <h1 className="mt-5 text-balance text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.04em] text-text sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.25rem]">
                Estar presente é <span className="landing-gradient-word">celebrar</span>.
              </h1>

              <p className="mt-5 max-w-[38ch] text-[15px] leading-[1.55] text-muted/95 sm:text-[16px]">
                A gente te avisa no dia. Você celebra.
              </p>

              <Reveal delay={90}>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/today" className="w-full sm:w-auto">
                    <Button size="lg" className="landing-cta-premium landing-cta-dominant w-full sm:min-w-[14rem]">
                      {primaryLabel}
                    </Button>
                  </Link>
                  <Link
                    href="/login?returnTo=%2Ftoday"
                    className="landing-cta-support ui-focus-surface rounded-md px-2 py-1 text-sm font-medium text-muted hover:text-text"
                  >
                    {configured ? (initialized && isLoggedIn ? "Trocar conta" : "Entrar com Google") : "Entrar com Google"}
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={130}>
                <p className="mt-4 text-xs text-muted/90">
                  Use sem login. Sincronize quando quiser.
                </p>
              </Reveal>
            </div>
          </Reveal>
        </section>

        <section>
          <Reveal delay={80}>
            <div className="feature-row">
              <div className="feature-row-item">
                <div className="feature-row-icon" aria-hidden>1</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rápido para começar</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">Cadastre em minutos</h2>
                  <p className="mt-1 text-sm text-muted">
                    Adicione manualmente ou importe CSV. O app organiza por hoje e próximos dias automaticamente.
                  </p>
                </div>
              </div>

              <div className="feature-row-divider" aria-hidden />

              <div className="feature-row-item">
                <div className="feature-row-icon" aria-hidden>2</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Uso sem fricção</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Confiança multi-device</p>
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
          <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border/75 bg-surface/70 px-4 py-3 text-sm text-muted shadow-sm sm:flex-row sm:items-center">
            <p>Lembra. • Estar presente é celebrar. 🎉</p>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="ui-link-tertiary">Privacidade</Link>
              <Link href="/terms" className="ui-link-tertiary">Termos</Link>
              <Link href="/styleguide" className="ui-link-tertiary">Styleguide</Link>
            </div>
          </footer>
        </Reveal>
      </div>
    </div>
  );
}
