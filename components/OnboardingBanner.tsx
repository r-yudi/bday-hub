"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "onboarding_banner_dismissed_v1";

type OnboardingBannerProps = {
  count: number;
  mounted: boolean;
  returnTo?: string;
};

export function OnboardingBanner({ count, mounted, returnTo = "/today" }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [mounted]);

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  if (!mounted || count >= 5 || dismissed) return null;

  return (
    <div className="ui-panel-soft rounded-2xl border border-border/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="ui-eyebrow text-[11px]">Sua lista</p>
          <h2 className="mt-1 font-semibold tracking-tight text-text">
            {count} de 5 pessoas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Com cinco cadastros, os lembretes fazem mais sentido — dá para dispensar este aviso quando quiser.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/person?returnTo=${encodeURIComponent(returnTo)}`}
            className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
          >
            Adicionar pessoa
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="ui-link-tertiary text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}
