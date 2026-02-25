"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";

export function LandingPremiumPageClient() {
  const { configured, initialized, user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle landing-grid-drift opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full glow-coral blur-3xl landing-glow-a" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full glow-lilac blur-3xl landing-glow-b" />
      <div className="pointer-events-none absolute bottom-10 right-16 h-40 w-40 rounded-full bg-warning/15 blur-3xl landing-glow-a" />
      <div className="pointer-events-none absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-primary/60 shadow-[0_0_18px_hsl(var(--primary)/0.4)] landing-glow-b" />
      <div className="pointer-events-none absolute right-[18%] top-[32%] h-2 w-2 rounded-full bg-lilac/70 shadow-[0_0_18px_hsl(var(--lilac)/0.45)] landing-glow-a" />

      <div className="relative mx-auto max-w-6xl space-y-10">
        <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-medium text-muted shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lembra. • Seu app de aniversários
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div>
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl lg:text-6xl">
                  Nunca mais esqueça aniversários.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                  Um app acolhedor e rápido para lembrar quem importa. Comece sem login no seu dispositivo e, quando
                  quiser, entre com Google para manter sua lista com você.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/today">
                  <Button size="lg" className="w-full sm:w-auto">
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

            <Reveal delay={180}>
              <div className="flex flex-wrap gap-2">
                <Chip as="span" variant="accent">Lembretes rápidos</Chip>
                <Chip as="span" variant="subtle">CSV import</Chip>
                <Chip as="span" variant="subtle">Sem login para começar</Chip>
                <Chip as="span" variant="subtle">Sincronize quando quiser</Chip>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <Card variant="elevated" className="shine-sweep relative overflow-hidden p-5 sm:p-6 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl landing-glow-a" />
              <div className="absolute -left-6 bottom-8 h-24 w-24 rounded-full bg-lilac/15 blur-2xl landing-glow-b" />
              <div className="relative space-y-4">
                <div className="rounded-lg border border-border bg-surface2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Hoje</p>
                  <p className="mt-1 text-lg font-semibold text-text">3 aniversários 🎉</p>
                  <p className="mt-1 text-sm text-muted">João, Ana e Marina estão na sua lista de hoje.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-250 ease-brand hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-sm font-medium text-text">Categorias</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip as="span" variant="warning">Família</Chip>
                      <Chip as="span" variant="subtle">Amigos</Chip>
                      <Chip as="span" variant="subtle">Trabalho</Chip>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-250 ease-brand hover:-translate-y-0.5 hover:shadow-md">
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
            <Card variant="bento" className="shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Como funciona</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">1. Cadastre rápido</h2>
              <p className="mt-2 text-sm text-muted">
                Adicione manualmente ou importe CSV. O app organiza por hoje e próximos dias automaticamente.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={130} className="lg:col-span-4">
            <Card variant="bento" className="shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sem atrito</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">2. Use sem login</h2>
              <p className="mt-2 text-sm text-muted">
                Tudo funciona no seu dispositivo desde o primeiro uso. Se quiser, você pode entrar depois.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={190} className="lg:col-span-4">
            <Card variant="bento" className="shine-sweep p-5 transition-all duration-250 ease-brand hover:-translate-y-1 hover:shadow-lg">
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
