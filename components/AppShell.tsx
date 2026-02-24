"use client";

import { useEffect, useState } from "react";
import { maybeNotifyTodayBirthdays } from "@/lib/notifications";
import { TopNav } from "@/components/TopNav";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPlatform = "ios" | "desktop-chrome" | "other";

const PWA_BANNER_DISMISSED_UNTIL_KEY = "bdayhub_pwa_banner_dismissed_until";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    <section className="mb-4 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black/90">Instale o Lembra. e deixe seus lembretes por perto</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleInstallClick()}
            className="btn-primary-brand rounded-xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accentHover"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar sugestão de instalação"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-black/60 hover:bg-black/5"
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowInstructions((value) => !value)}
          className="text-xs text-black/65 underline decoration-black/20 underline-offset-2 hover:text-black/85"
          aria-expanded={showInstructions}
        >
          {showInstructions ? "Ocultar" : "Como instalar"}
        </button>
      </div>

      {showInstructions && (
        <div className="mt-2 rounded-xl border border-black/5 bg-black/[0.03] px-3 py-2 text-xs text-black/70">
          {showIosInstructions && (
            <p>No iPhone/iPad (Safari): toque em "Compartilhar" e depois em "Adicionar à Tela de Início".</p>
          )}
          {showDesktopInstructions && (
            <p>No Chrome (desktop): clique em "Instalar" ou use o ícone de instalação na barra de endereço.</p>
          )}
          {!showIosInstructions && !showDesktopInstructions && (
            <p>Se seu navegador mostrar opção de instalar, use o menu ou o ícone da barra de endereço.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void maybeNotifyTodayBirthdays();
  }, []);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
        <PwaInstallBanner />
        {children}
      </main>
    </div>
  );
}
