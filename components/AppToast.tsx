"use client";

import { useEffect } from "react";
import type { OnboardingToast } from "@/lib/onboarding-ui";

type AppToastProps = {
  toast: OnboardingToast | null;
  onClose: () => void;
};

export function AppToast({ toast, onClose }: AppToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const toneClasses =
    toast.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))]">
      <div className={`rounded-2xl border px-4 py-3 shadow-lg ${toneClasses}`}>
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.subtitle && <p className="mt-1 text-xs opacity-90">{toast.subtitle}</p>}
      </div>
    </div>
  );
}
