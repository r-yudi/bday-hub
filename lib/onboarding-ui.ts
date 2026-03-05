"use client";

export const ONBOARDING_COMPLETED_KEY = "bdayhub_onboarding_completed_v1";
export const PENDING_ADD_TOAST_KEY = "bdayhub_pending_add_toast_v1";

export const ONBOARDING_V1_ALERTS_DONE = "onboarding_v1_alerts_done";
export const ONBOARDING_V1_PEOPLE_DONE = "onboarding_v1_people_done";
export const ONBOARDING_V1_TIPS_DONE = "onboarding_v1_tips_done";

export type OnboardingToast = {
  title: string;
  subtitle?: string;
  tone: "info" | "success";
};

function canUseWindow() {
  return typeof window !== "undefined";
}

export function hasCompletedOnboarding(): boolean {
  if (!canUseWindow()) return false;
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  if (!canUseWindow()) return;
  try {
    window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
  } catch {
    // ignore
  }
}

export function queueBirthdayAddedToast(): void {
  if (!canUseWindow()) return;
  try {
    window.localStorage.setItem(PENDING_ADD_TOAST_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function consumeBirthdayAddedToast(): boolean {
  if (!canUseWindow()) return false;
  try {
    const raw = window.localStorage.getItem(PENDING_ADD_TOAST_KEY);
    if (!raw) return false;
    window.localStorage.removeItem(PENDING_ADD_TOAST_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getOnboardingStepDone(key: string): boolean {
  if (!canUseWindow()) return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingStepDone(key: string): void {
  if (!canUseWindow()) return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

export function buildAddBirthdayToast(totalCount: number): OnboardingToast {
  if (totalCount >= 5) {
    return {
      title: "Setup completo! Agora é só comemorar 🎉",
      subtitle: "Seu Lembra está pronto para lembrar os aniversários por você.",
      tone: "success"
    };
  }

  const remaining = Math.max(0, 5 - totalCount);
  return {
    title: "+1 aniversário adicionado 🎉",
    subtitle: `Faltam ${remaining} para completar seu setup`,
    tone: "info"
  };
}
