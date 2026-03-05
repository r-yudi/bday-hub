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
      <div className="rounded-2xl border border-success/30 bg-success/15 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-success">🎉 Pronto! Seu Lembra está pronto para comemorar.</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-success">5/5</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/90">
          <div className="h-full rounded-full bg-success" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  if (completedPersisted || progress >= 5) return null;

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text">Adicione 5 aniversários para nunca mais esquecer ninguém 🎉</p>
        <span className="rounded-full border border-warning/40 bg-white px-2.5 py-1 text-xs font-medium text-warning shadow-sm">
          {progress}/5
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">Comece com 5 contatos e já sinta o Lembra funcionando por você.</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/90">
        <div className="h-full rounded-full bg-warning transition-all" style={{ width: progressWidth }} />
      </div>
    </div>
  );
}
