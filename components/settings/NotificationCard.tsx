"use client";

import { useEffect, useState } from "react";
import { getNotificationSupport, requestNotificationPermission } from "@/lib/notifications";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";
import { parseTimeHHmm, formatTimeHHmm } from "./timeUtils";

type NotificationSupport = { supported: boolean; permission: NotificationPermission | "unsupported" };

type NotificationCardProps = { variant?: "default" | "compact"; listEmpty?: boolean };

export function NotificationCard({ variant = "default", listEmpty = false }: NotificationCardProps) {
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

  async function handleSwitchToggle() {
    if (!mounted || !support.supported || support.permission === "denied") return;
    setSaving(true);
    try {
      if (support.permission === "granted" && settings?.notificationEnabled) {
        const next: AppSettings = {
          ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
          notificationEnabled: false
        };
        await saveSettings(next);
        setSettings(next);
        return;
      }

      let result: NotificationPermission | "unsupported";
      if (support.permission === "granted") {
        result = "granted";
      } else {
        result = await requestNotificationPermission();
        setSupport(getNotificationSupport());
      }

      const next: AppSettings = {
        ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
        notificationEnabled: result === "granted"
      };
      await saveSettings(next);
      setSettings(next);

      if (result !== "granted") {
        window.alert("Permissão não concedida. Você ainda vê os lembretes ao abrir o app.");
      }
    } finally {
      setSaving(false);
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

  const switchDisabled =
    !mounted || !support.supported || support.permission === "denied" || saving;
  const switchOn = Boolean(
    support.permission === "granted" && settings?.notificationEnabled
  );

  return (
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <h2 className="ui-feature-title text-muted text-sm">Lembretes no app</h2>
      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Ao abrir o Lembra neste aparelho, no horário que você escolher.
        </p>
      )}
      {compact && (
        <p className="mt-1 text-xs text-muted">
          Neste aparelho, ao abrir o Lembra, no horário escolhido.
        </p>
      )}
      {listEmpty && (
        <p className={compact ? "mt-1.5 text-xs text-muted" : "mt-2 text-xs text-muted"}>
          Lista vazia: sem datas, não há o que mostrar; o horário vale quando houver pessoas na lista.
        </p>
      )}

      <div className={compact ? "mt-2 flex flex-wrap items-center gap-3" : "mt-4 flex flex-wrap items-center gap-3"}>
        <button
          type="button"
          role="switch"
          aria-checked={switchOn}
          disabled={switchDisabled}
          onClick={() => void handleSwitchToggle()}
          className={[
            "relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            switchDisabled ? "cursor-not-allowed bg-surface2 opacity-60" : switchOn ? "bg-accent" : "bg-surface2"
          ].join(" ")}
          aria-label={
            switchOn ? "Desativar lembretes no app" : "Ativar lembretes no app"
          }
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
              switchOn ? "left-7" : "left-1"
            ].join(" ")}
          />
        </button>
        <span className="text-sm text-text">
          {!mounted
            ? "Carregando..."
            : !support.supported
              ? "Indisponível neste navegador"
              : support.permission === "denied"
                ? "Permissão bloqueada"
                : switchOn
                  ? "Ativado"
                  : "Desativado"}
        </span>
      </div>

      {support.permission === "default" && support.supported && !switchOn && !compact && (
        <p className="mt-2 text-xs text-muted">Toque no controle para permitir alertas ao abrir o Lembra.</p>
      )}

      {support.supported &&
        support.permission === "granted" &&
        settings &&
        (() => {
          const nt = parseTimeHHmm(settings.notificationTime ?? "09:00");
          return (
            <div className={compact ? "mt-2 flex flex-wrap items-center gap-2" : "mt-3 flex flex-wrap items-center gap-2"}>
              <label className="text-xs text-muted" htmlFor={compact ? "inapp-time-h-compact" : "inapp-time-h"}>
                Horário (24h)
              </label>
              <select
                id={compact ? "inapp-time-h-compact" : "inapp-time-h"}
                value={nt.h}
                disabled={saving}
                onChange={(e) => void handleTimeChange(formatTimeHHmm(parseInt(e.target.value, 10), nt.m))}
                className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                aria-label="Hora do lembrete no app"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}h
                  </option>
                ))}
              </select>
              <span className="text-muted">:</span>
              <select
                value={nt.m}
                disabled={saving}
                onChange={(e) => void handleTimeChange(formatTimeHHmm(nt.h, parseInt(e.target.value, 10)))}
                className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                aria-label="Minuto do lembrete no app"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          );
        })()}
    </section>
  );
}
