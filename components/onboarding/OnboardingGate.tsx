"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getEmailReminderSettings, getPushSettings } from "@/lib/notificationSettingsRepo";
import { getSettings } from "@/lib/storage";
import {
  getOnboardingStepDone,
  ONBOARDING_V1_ALERTS_DONE,
  ONBOARDING_V1_PEOPLE_DONE,
  ONBOARDING_V1_TIPS_DONE,
  setOnboardingStepDone
} from "@/lib/onboarding-ui";

type OnboardingGateProps = {
  peopleCount: number;
  mounted: boolean;
};

export function OnboardingGate({ peopleCount, mounted }: OnboardingGateProps) {
  const { user } = useAuth();
  const [alertsDone, setAlertsDone] = useState(false);
  const [peopleDone, setPeopleDone] = useState(false);
  const [tipsDone, setTipsDone] = useState(false);
  const [alertsChecked, setAlertsChecked] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);

  const persistAlertsDone = useCallback(() => {
    setOnboardingStepDone(ONBOARDING_V1_ALERTS_DONE);
    setAlertsDone(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    const stored = getOnboardingStepDone(ONBOARDING_V1_ALERTS_DONE);
    if (stored) {
      setAlertsDone(true);
      setAlertsChecked(true);
      return;
    }
    Promise.all([getSettings(), getEmailReminderSettings(), getPushSettings()])
      .then(([settings, email, push]) => {
        const anyOn = Boolean(
          settings?.notificationEnabled ||
            email?.emailEnabled ||
            push?.pushEnabled
        );
        if (anyOn) persistAlertsDone();
        setAlertsChecked(true);
      })
      .catch(() => setAlertsChecked(true));
  }, [mounted, user, persistAlertsDone]);

  useEffect(() => {
    if (!mounted) return;
    if (getOnboardingStepDone(ONBOARDING_V1_PEOPLE_DONE)) {
      setPeopleDone(true);
      return;
    }
    if (peopleCount >= 5) {
      setOnboardingStepDone(ONBOARDING_V1_PEOPLE_DONE);
      setPeopleDone(true);
    }
  }, [mounted, peopleCount]);

  useEffect(() => {
    if (!mounted) return;
    setTipsDone(getOnboardingStepDone(ONBOARDING_V1_TIPS_DONE));
  }, [mounted]);

  const skipPeople = useCallback(() => {
    setOnboardingStepDone(ONBOARDING_V1_PEOPLE_DONE);
    setPeopleDone(true);
  }, []);

  const openTips = useCallback(() => setShowTipsModal(true), []);
  const closeTips = useCallback(() => {
    setShowTipsModal(false);
    setOnboardingStepDone(ONBOARDING_V1_TIPS_DONE);
    setTipsDone(true);
  }, []);

  const skipTips = useCallback(() => {
    setOnboardingStepDone(ONBOARDING_V1_TIPS_DONE);
    setTipsDone(true);
  }, []);

  if (!mounted || !user || (alertsDone && peopleDone && tipsDone)) return null;

  const step1Done = alertsDone;
  const step2Done = peopleDone;
  const step3Done = tipsDone;

  return (
    <>
      <section
        className="ui-section ui-panel rounded-2xl border border-border/80 p-6 sm:p-8"
        aria-label="Onboarding"
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-text">
          Configure seu Lembra
        </h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-3">
            {step1Done ? (
              <span className="text-success" aria-hidden>✓</span>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-border" aria-hidden />
            )}
            <span className={step1Done ? "text-muted" : "text-text"}>
              1. Configurar alertas (email ou lembretes no app)
            </span>
          </li>
          <li className="flex items-center gap-3">
            {step2Done ? (
              <span className="text-success" aria-hidden>✓</span>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-border" aria-hidden />
            )}
            <span className={step2Done ? "text-muted" : "text-text"}>
              2. Adicionar 5 aniversários {!step2Done && `(${peopleCount} de 5)`}
            </span>
          </li>
          <li className="flex items-center gap-3">
            {step3Done ? (
              <span className="text-success" aria-hidden>✓</span>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-border" aria-hidden />
            )}
            <span className={step3Done ? "text-muted" : "text-text"}>
              3. Dicas rápidas (Editar, Categorias, Compartilhar)
            </span>
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          {!step1Done && (
            <Link
              href="/settings"
              className="btn-primary-brand ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
            >
              Configurar alertas
            </Link>
          )}
          {step1Done && !step2Done && (
            <>
              <Link
                href="/person"
                className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Adicionar pessoa
              </Link>
              <Link
                href="/people"
                className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
              >
                Ver pessoas
              </Link>
              <button
                type="button"
                onClick={skipPeople}
                className="ui-link-tertiary text-sm font-medium"
              >
                Pular por agora
              </button>
            </>
          )}
          {step1Done && step2Done && !step3Done && (
            <>
              <button
                type="button"
                onClick={openTips}
                className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Ver dicas
              </button>
              <button
                type="button"
                onClick={skipTips}
                className="ui-link-tertiary text-sm font-medium"
              >
                Pular por agora
              </button>
            </>
          )}
        </div>
      </section>

      {showTipsModal && (
        <div
          className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-tips-title"
        >
          <div className="ui-modal-surface w-full max-w-md border p-6">
            <h3 id="onboarding-tips-title" className="text-lg font-semibold tracking-tight text-text">
              Dicas rápidas
            </h3>
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
                type="button"
                onClick={closeTips}
                className="ui-cta-primary rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
