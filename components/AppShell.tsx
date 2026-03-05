"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { maybeNotifyTodayBirthdays } from "@/lib/notifications";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/components/AuthProvider";

// ... keep existing types below

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPlatform = "ios" | "desktop-chrome" | "other";

const PWA_BANNER_DISMISSED_UNTIL_KEY = "bdayhub_pwa_banner_dismissed_until";
const PWA_BANNER_DISMISSED_SESSION_KEY = "lembra_pwa_banner_dismissed_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function SessionGuardNotice() {
  const { sessionNotice, dismissSessionNotice } = useAuth();

  if (!sessionNotice) return null;

  return (
    <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
      <div className="flex items-start justify-between gap-3">
        <p>{sessionNotice}</p>
        <button
          type="button"
          onClick={dismissSessionNotice}
          className="rounded-md px-2 py-0.5 text-xs text-muted hover:bg-warning/20"
          aria-label="Fechar aviso de sessão"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMedia || iosStandalone;
}

function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";

  const isDesktop = !/mobile/.test(ua);
  const isChromeDesktop = isDesktop && /chrome/.test(ua) && !/edg|opr/.test(ua);
  return isChromeDesktop ? "desktop-chrome" : "other";
}

function shouldHidePwaBannerByDismiss() {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(PWA_BANNER_DISMISSED_SESSION_KEY) === "1") return true;
    const raw = window.localStorage.getItem(PWA_BANNER_DISMISSED_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function dismissPwaBannerFor30Days() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PWA_BANNER_DISMISSED_SESSION_KEY, "1");
    window.localStorage.setItem(PWA_BANNER_DISMISSED_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS));
  } catch {
    // ignore
  }
}

function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [isInstalled, setIsInstalled] = useState(true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlatform(detectInstallPlatform());
    setIsInstalled(isStandaloneMode());
    setDismissed(shouldHidePwaBannerByDismiss());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsInstalled(false);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canShowInstallSuggestion = platform === "ios" || platform === "desktop-chrome" || installEvent !== null;
  const canShowBanner = mounted && !dismissed && !isInstalled && canShowInstallSuggestion;

  async function handleInstallClick() {
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") {
        setIsInstalled(true);
      }
      return;
    }

    setShowInstructions((value) => !value);
  }

  function handleDismiss() {
    dismissPwaBannerFor30Days();
    setDismissed(true);
  }

  if (!canShowBanner) return null;

  const showIosInstructions = platform === "ios";
  const showDesktopInstructions = platform === "desktop-chrome" || installEvent !== null;

  return (
    <section className="ui-panel-soft mb-4 rounded-xl border px-3 py-2 shadow-sm sm:px-4 sm:py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-text">Instale o Lembra. para acessar seus aniversários mais rápido.</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => void handleInstallClick()}
            className="ui-cta-primary inline-flex h-9 items-center justify-center px-4 py-2 text-sm font-medium leading-none focus-visible:outline-none"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar sugestão de instalação"
            className="ui-focus-surface inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border p-0 text-sm leading-none focus-visible:outline-none"
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowInstructions((value) => !value)}
          className="ui-link-tertiary text-xs"
          aria-expanded={showInstructions}
        >
          {showInstructions ? "Ocultar" : "Saiba mais"}
        </button>
      </div>

      {showInstructions && (
        <div className="ui-callout mt-2 px-3 py-2">
          <div className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] text-text">i</span>
            <p className="leading-5">Instale para abrir mais rápido e acessar sua lista direto da tela inicial.</p>
          </div>

          <details className="ui-disclosure mt-2 px-3 py-2">
            <summary className="ui-disclosure-summary">
              Como instalar
            </summary>
            <div className="mt-2 space-y-1 text-xs leading-5 text-muted">
              {showIosInstructions && <p>No iPhone/iPad (Safari): toque em "Compartilhar" e depois em "Adicionar à Tela de Início".</p>}
              {showDesktopInstructions && (
                <p>No Chrome (desktop): clique em "Instalar" ou use o ícone de instalação na barra de endereço.</p>
              )}
              {!showIosInstructions && !showDesktopInstructions && (
                <p>Se seu navegador mostrar opção de instalar, use o menu ou o ícone da barra de endereço.</p>
              )}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCampaign = pathname === "/campaign";
  const isLanding = pathname === "/" || pathname === "/landing";
  const isLegalPage = pathname === "/privacy" || pathname === "/terms";
  const isDebugRoute = Boolean(pathname?.startsWith("/debug"));
  const isLoginPage = pathname === "/login";
  const showGlobalFooter = !isLanding && !isLegalPage && !isDebugRoute;

  useEffect(() => {
    void maybeNotifyTodayBirthdays();
    const interval = setInterval(() => void maybeNotifyTodayBirthdays(), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (isCampaign) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell-wrap min-h-screen">
      <TopNav />
      <main className={["app-shell-main mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6", isLoginPage ? "pt-4 sm:pt-5" : "pt-6"].join(" ")}>
        {!isDebugRoute && <SessionGuardNotice />}
        {!isLanding && (
          <div className={isLoginPage ? "mx-auto w-full max-w-md" : undefined}>
            <PwaInstallBanner />
          </div>
        )}
        {children}

        {showGlobalFooter && (
          <footer className="ui-surface mt-10 rounded-2xl border px-4 py-4 text-center text-xs text-muted shadow-sm sm:text-right">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
              <Link href="/privacy" className="ui-link-tertiary">
                Política de Privacidade
              </Link>
              <Link href="/terms" className="ui-link-tertiary">
                Termos
              </Link>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
