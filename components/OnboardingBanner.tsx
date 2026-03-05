"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "today_add_more_banner_dismissed";

type OnboardingBannerProps = {
  count: number;
  mounted: boolean;
};

export function OnboardingBanner({ count, mounted }: OnboardingBannerProps) {
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
    <div className="ui-panel-soft rounded-2xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 className="font-semibold tracking-tight text-text">
            Adicione mais algumas pessoas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Com 5 aniversários cadastrados o Lembra já começa a te ajudar no dia a dia.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/person"
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
