"use client";

import { useEffect, useMemo, useState } from "react";
import { hasCompletedOnboarding, markOnboardingCompleted } from "@/lib/onboarding-ui";

type OnboardingBannerProps = {
  count: number;
  mounted: boolean;
};

export function OnboardingBanner({ count, mounted }: OnboardingBannerProps) {
  const [completionKnown, setCompletionKnown] = useState(false);
  const [completedPersisted, setCompletedPersisted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const progress = Math.max(0, Math.min(5, count));

  useEffect(() => {
    if (!mounted) return;
    setCompletedPersisted(hasCompletedOnboarding());
    setCompletionKnown(true);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !completionKnown) return;
    if (completedPersisted) return;
    if (count < 5) return;

    markOnboardingCompleted();
    setCompletedPersisted(true);
    setShowSuccess(true);

    const timer = window.setTimeout(() => setShowSuccess(false), 4200);
    return () => window.clearTimeout(timer);
  }, [mounted, completionKnown, completedPersisted, count]);

  const progressWidth = useMemo(() => `${(progress / 5) * 100}%`, [progress]);

  if (!mounted || !completionKnown) return null;

  if (showSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-emerald-900">🎉 Pronto! Seu Lembra está pronto para comemorar.</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700">5/5</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/90">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  if (completedPersisted || progress >= 5) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-amber-900">Adicione 5 aniversários para nunca mais esquecer ninguém 🎉</p>
        <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm">
          {progress}/5
        </span>
      </div>
      <p className="mt-1 text-xs text-amber-800/90">Comece com 5 contatos e já sinta o Lembra funcionando por você.</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/90">
        <div className="h-full rounded-full bg-warm transition-all" style={{ width: progressWidth }} />
      </div>
    </div>
  );
}
