"use client";

import { useEffect, useRef, useState } from "react";
import { getNotificationSupport, requestNotificationPermission } from "@/lib/notifications";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";
import { parseTimeHHmm, formatTimeHHmm } from "./timeUtils";

type NotificationSupport = { supported: boolean; permission: NotificationPermission | "unsupported" };

type NotificationCardProps = { variant?: "default" | "compact" };

const LEMBRETES_HOW = "Funciona quando você abre o app no horário escolhido. Não é push em segundo plano.";

export function NotificationCard({ variant = "default" }: NotificationCardProps) {
  const compact = variant === "compact";
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [support, setSupport] = useState<NotificationSupport>({ supported: false, permission: "unsupported" });
  const [saving, setSaving] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const howTriggerRef = useRef<HTMLButtonElement>(null);
  const howPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setSupport(getNotificationSupport());
    void getSettings().then(setSettings);
  }, [mounted]);

  useEffect(() => {
    if (!showHow) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowHow(false); };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (howTriggerRef.current?.contains(t) || howPanelRef.current?.contains(t)) return;
      setShowHow(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [showHow]);

  async function handleToggle() {
    if (!mounted) return;

    if (support.permission === "granted" && settings?.notificationEnabled) {
      setSaving(true);
      const next: AppSettings = {
        ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
        notificationEnabled: false
      };
      await saveSettings(next);
      setSettings(next);
      setSaving(false);
      return;
    }

    const permission = await requestNotificationPermission();
    setSupport(getNotificationSupport());

    const next: AppSettings = {
      ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
      notificationEnabled: permission === "granted"
    };
    await saveSettings(next);
    setSettings(next);

    if (permission !== "granted") {
      window.alert("Permissão não concedida. Você ainda verá avisos dentro do app.");
    }
  }

  async function handleTimeChange(value: string) {
    if (!mounted || !settings) return;
    setSaving(true);
    const next: AppSettings = { ...settings, notificationTime: value };
    await saveSettings(next);
    setSettings(next);
    setSaving(false);
  }

  const ctaLabel = !mounted
    ? "Carregando..."
    : !support.supported
      ? "Navegador sem suporte"
      : support.permission === "granted" && settings?.notificationEnabled
        ? "Desativar lembretes"
        : support.permission === "denied"
          ? "Permissão bloqueada"
          : "Ativar lembretes";

  const summary = !mounted
    ? "Carregando estado dos lembretes..."
    : !support.supported
      ? "Este navegador não suporta notificações. Você ainda pode usar a tela Hoje normalmente."
      : support.permission === "denied"
        ? "Permissão bloqueada. Reative no navegador se quiser receber lembretes."
        : support.permission === "granted" && settings?.notificationEnabled
          ? "Lembretes ativos: no dia do aniversário você recebe um aviso no horário escolhido (ao abrir o app ou com o app aberto)."
          : "Ative os lembretes e escolha o horário. No dia do aniversário você recebe uma notificação (ao abrir o app ou com o app aberto).";

  return (
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <div className="flex items-center gap-2">
        <h2 className="ui-feature-title text-muted text-sm">Lembretes</h2>
        {!compact && (
          <span className="relative">
            <button
              ref={howTriggerRef}
              type="button"
              onClick={() => setShowHow((v) => !v)}
              className="ui-focus-surface flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Como funciona?"
              aria-expanded={showHow}
            >
              ?
            </button>
            {showHow && (
              <div
                ref={howPanelRef}
                className="ui-panel-soft absolute left-0 top-full z-20 mt-1 min-w-[16rem] rounded-lg border p-2 text-xs shadow-lg"
                role="tooltip"
                aria-label="Como funciona?"
              >
                {LEMBRETES_HOW}
              </div>
            )}
          </span>
        )}
      </div>
      {!compact && <p className="mt-2 text-sm leading-5 text-muted">{summary}</p>}
      {compact && <p className="mt-1 text-xs text-muted">{summary}</p>}

      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={!mounted || !support.supported || support.permission === "denied" || saving}
        className="btn-primary-brand ui-cta-primary mt-3 rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted focus-visible:outline-none"
      >
        {saving ? "Salvando..." : ctaLabel}
      </button>

      {support.supported && support.permission === "granted" && settings && (() => {
        const nt = parseTimeHHmm(settings.notificationTime ?? "09:00");
        return (
          <div className={compact ? "mt-2 flex flex-wrap items-center gap-2" : "mt-3 flex flex-wrap items-center gap-2"}>
            <label className="text-xs text-muted" htmlFor={compact ? "daily-notification-hour-compact" : "daily-notification-hour"}>
              Horário do lembrete (24h)
            </label>
            <select
              id={compact ? "daily-notification-hour-compact" : "daily-notification-hour"}
              value={nt.h}
              disabled={saving}
              onChange={(e) => void handleTimeChange(formatTimeHHmm(parseInt(e.target.value, 10), nt.m))}
              className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
              aria-label="Hora do lembrete"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}h</option>
              ))}
            </select>
            <span className="text-muted">:</span>
            <select
              value={nt.m}
              disabled={saving}
              onChange={(e) => void handleTimeChange(formatTimeHHmm(nt.h, parseInt(e.target.value, 10)))}
              className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
              aria-label="Minuto do lembrete"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        );
      })()}
    </section>
  );
}
