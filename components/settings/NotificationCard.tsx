"use client";

import { useEffect, useState } from "react";
import { getNotificationSupport, requestNotificationPermission } from "@/lib/notifications";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";
import { parseTimeHHmm, formatTimeHHmm } from "./timeUtils";

type NotificationSupport = { supported: boolean; permission: NotificationPermission | "unsupported" };

type NotificationCardProps = { variant?: "default" | "compact" };

export function NotificationCard({ variant = "default" }: NotificationCardProps) {
  const compact = variant === "compact";
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [support, setSupport] = useState<NotificationSupport>({ supported: false, permission: "unsupported" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setSupport(getNotificationSupport());
    void getSettings().then(setSettings);
  }, [mounted]);

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
      <h2 className="ui-feature-title text-muted text-sm">Lembretes</h2>
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

      {!compact && (
        <details className="ui-disclosure mt-3 px-3 py-2">
          <summary className="ui-disclosure-summary">Ver detalhes técnicos</summary>
          <div className="ui-callout mt-2 px-3 py-2 text-xs leading-5">
            <p>Web Push MVP: notificação local no horário escolhido (ao abrir o app ou com o app aberto). Um aviso por dia; clique abre Hoje.</p>
            <p className="mt-1">Suporte: {mounted ? (support.supported ? "sim" : "não suportado") : "..."}</p>
            <p>Permissão: {mounted ? (support.permission === "denied" ? "negada" : support.permission) : "..."}</p>
            <p>Ativado no app: {mounted ? (settings?.notificationEnabled ? "sim" : "não") : "..."}</p>
            {support.permission === "denied" && (
              <p className="mt-1 text-warning">Permissão negada no navegador. Reative nas configurações do site para receber lembretes.</p>
            )}
            {!support.supported && mounted && (
              <p className="mt-1 text-muted">Em alguns navegadores (ex.: iOS/Safari) as notificações não estão disponíveis.</p>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
