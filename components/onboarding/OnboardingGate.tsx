"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { NotificationCard } from "@/components/settings/NotificationCard";
import { EmailDailyCard } from "@/components/settings/EmailDailyCard";
import { PushCard } from "@/components/settings/PushCard";
import { getEmailReminderSettings, getPushSettings } from "@/lib/notificationSettingsRepo";
import { getSettings } from "@/lib/storage";
import {
  getOnboardingV2Seen,
  setOnboardingV2Seen
} from "@/lib/onboarding-ui";

type OnboardingGateProps = {
  peopleCount: number;
  mounted: boolean;
};

type Step = 1 | 2 | 3 | 4;

export function OnboardingGate({ peopleCount, mounted }: OnboardingGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<Step>(user ? 2 : 1);
  const [alertsDone, setAlertsDone] = useState(false);
  const [showGuestTooltip, setShowGuestTooltip] = useState(false);
  const primaryActionRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const guestTooltipRef = useRef<HTMLDivElement | null>(null);
  const guestTriggerRef = useRef<HTMLButtonElement | null>(null);
  const guestTooltipOpenRef = useRef(false);
  useEffect(() => {
    guestTooltipOpenRef.current = showGuestTooltip;
  }, [showGuestTooltip]);

  const onboardingParam = searchParams.get("onboarding") === "1";
  const force = searchParams.get("force") === "1";
  const v2Seen = mounted && getOnboardingV2Seen();
  const showWizard = mounted && !dismissed && (force || !v2Seen);

  const closeWizard = useCallback(() => {
    setOnboardingV2Seen();
    setDismissed(true);
    router.replace("/today");
  }, [router]);

  useEffect(() => {
    if (!mounted || step < 2) return;
    Promise.all([getSettings(), getEmailReminderSettings(), getPushSettings()])
      .then(([settings, email, push]) => {
        const anyOn = Boolean(
          settings?.notificationEnabled ||
            email?.emailEnabled ||
            push?.pushEnabled
        );
        if (anyOn) setAlertsDone(true);
      })
      .catch(() => {});
  }, [mounted, step, user?.id]);

  useEffect(() => {
    if (user && step === 1) setStep(2);
  }, [user, step]);

  useEffect(() => {
    if (!showWizard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (guestTooltipOpenRef.current) setShowGuestTooltip(false);
        else closeWizard();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showWizard, closeWizard]);

  useEffect(() => {
    if (showWizard && primaryActionRef.current) {
      primaryActionRef.current.focus({ preventScroll: true });
    }
  }, [showWizard, step]);

  useEffect(() => {
    if (!showGuestTooltip) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        guestTriggerRef.current?.contains(target) ||
        guestTooltipRef.current?.contains(target)
      ) return;
      setShowGuestTooltip(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [showGuestTooltip]);

  if (!showWizard) return null;

  const goToStep2 = () => setStep(2);
  const goToStep3 = () => setStep(3);
  const goToStep4 = () => setStep(4);
  const finish = () => {
    setOnboardingV2Seen();
    setDismissed(true);
    router.replace("/today");
  };

  return (
    <div
      className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      <div className="ui-modal-surface w-full max-w-md border p-6 relative">
        <button
          type="button"
          onClick={closeWizard}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Fechar onboarding"
        >
          <span aria-hidden>✕</span>
        </button>

        {step === 1 && (
          <>
            <h2 id="onboarding-wizard-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Sincronize em todos os dispositivos
            </h2>
            <p className="mt-2 text-sm text-muted">
              Entre com sua conta para acessar seus aniversários em qualquer lugar.
            </p>
            <p className="mt-1 text-xs text-muted">Você pode usar sem conta.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                ref={primaryActionRef as RefObject<HTMLAnchorElement>}
                href="/login?returnTo=%2Ftoday"
                className="btn-primary-brand ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Entrar com Google
              </Link>
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToStep2}
                  className="ui-cta-secondary inline-flex h-11 flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none"
                >
                  Continuar sem conta
                </button>
                <button
                  ref={guestTriggerRef}
                  type="button"
                  onClick={() => setShowGuestTooltip((v) => !v)}
                  className="ui-focus-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Saiba mais sobre usar sem conta"
                  aria-expanded={showGuestTooltip}
                >
                  ?
                </button>
                {showGuestTooltip && (
                  <div
                    ref={guestTooltipRef}
                    className="ui-panel-soft absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border p-3 shadow-lg"
                    role="dialog"
                    aria-label="Uso sem conta"
                  >
                    <p className="font-medium text-text">Uso sem conta</p>
                    <p className="mt-1 text-sm text-muted">
                      Seus aniversários ficam salvos neste dispositivo. Para ver em outros, entre com Google depois.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="onboarding-wizard-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Alertas
            </h2>
            <p className="mt-2 text-sm text-muted">
              Configure lembretes para não esquecer nenhum aniversário.
            </p>
            {!user && (
              <p className="mt-2 text-xs text-muted">
                Email e push exigem login e suporte do dispositivo.
              </p>
            )}
            <div className="mt-4 space-y-3">
              <NotificationCard variant="compact" />
              <EmailDailyCard variant="compact" />
              <PushCard variant="compact" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                ref={primaryActionRef as RefObject<HTMLButtonElement>}
                type="button"
                onClick={goToStep3}
                className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Continuar
              </button>
              <Link
                href="/settings"
                className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none"
              >
                Abrir configurações
              </Link>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ui-link-tertiary text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Voltar
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 id="onboarding-wizard-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Adicionar aniversários
            </h2>
            <p className="mt-2 text-sm text-muted">
              {peopleCount} de 5 pessoas cadastradas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                ref={primaryActionRef as RefObject<HTMLAnchorElement>}
                href="/person"
                className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Adicionar pessoa
              </Link>
              <button
                type="button"
                onClick={goToStep4}
                className="ui-link-tertiary text-sm font-medium"
              >
                Pular
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 id="onboarding-wizard-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Dicas rápidas
            </h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted">
              <li>
                <Link href="/people" className="ui-link-tertiary font-medium text-text">
                  Editar
                </Link>
                {" — altere nome, data e categorias em Pessoas."}
              </li>
              <li>
                <Link href="/people" className="ui-link-tertiary font-medium text-text">
                  Categorias
                </Link>
                {" — organize por família, trabalho, etc. em Pessoas."}
              </li>
              <li>
                <Link href="/share" className="ui-link-tertiary font-medium text-text">
                  Compartilhar
                </Link>
                {" — gere um link para alguém adicionar o aniversário à lista."}
              </li>
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                ref={primaryActionRef as RefObject<HTMLButtonElement>}
                type="button"
                onClick={finish}
                className="ui-cta-primary rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Entendi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
