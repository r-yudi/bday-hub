"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  getEmailReminderSettings,
  getLastEmailDispatch,
  saveEmailReminderSettings,
  isValidTimezone
} from "@/lib/notificationSettingsRepo";
import { DEFAULT_EMAIL_REMINDER_SETTINGS, type EmailReminderSettings, type LastEmailDispatch, type ReminderTiming } from "@/lib/types";
import { parseTimeHHmm, formatTimeHHmm } from "./timeUtils";

type EmailDailyCardProps = { variant?: "default" | "compact" };

const EMAIL_HOW = "Enviado no horário que você escolher, no seu fuso.";

export function EmailDailyCard({ variant = "default" }: EmailDailyCardProps) {
  const compact = variant === "compact";
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailReminderSettings | null>(null);
  const [lastDispatch, setLastDispatch] = useState<LastEmailDispatch>(null);
  const [timezoneDraft, setTimezoneDraft] = useState(DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
  const [emailTimeDraft, setEmailTimeDraft] = useState(DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
  const [draftDirty, setDraftDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHow, setShowHow] = useState(false);
  const howTriggerRef = useRef<HTMLButtonElement>(null);
  const howPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    void getEmailReminderSettings().then((s) => {
      if (s) {
        setEmailSettings(s);
        setEmailTimeDraft(s.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
        setTimezoneDraft(s.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
      }
    });
    void getLastEmailDispatch().then(setLastDispatch);
  }, [mounted, user?.id]);

  useEffect(() => {
    if (!emailSettings || draftDirty) return;
    setEmailTimeDraft(emailSettings.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
  }, [emailSettings, draftDirty]);

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

  async function handleReminderTimingChange(value: ReminderTiming) {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await saveEmailReminderSettings({ reminderTiming: value });
      if (saved) {
        setEmailSettings(saved);
        setSuccess("Preferência salva.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const nextEnabled = !(emailSettings?.emailEnabled ?? false);
    const timezoneToSave =
      timezoneDraft.trim() && isValidTimezone(timezoneDraft.trim())
        ? timezoneDraft.trim()
        : (emailSettings?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
    try {
      const saved = await saveEmailReminderSettings({
        emailEnabled: nextEnabled,
        emailTime: emailTimeDraft,
        timezone: timezoneToSave,
        reminderTiming: emailSettings?.reminderTiming ?? DEFAULT_EMAIL_REMINDER_SETTINGS.reminderTiming
      });
      if (saved) {
        setEmailSettings(saved);
        setEmailTimeDraft(saved.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
        setDraftDirty(false);
        setError(null);
        setSuccess("Configurações salvas.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar lembretes por email.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTimeChange(nextTime: string) {
    if (!user) return;
    setEmailTimeDraft(nextTime);
    setDraftDirty(true);
    if (!(emailSettings?.emailEnabled)) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveEmailReminderSettings({ emailTime: nextTime });
      if (saved) {
        setEmailSettings(saved);
        setDraftDirty(false);
      }
    } catch {
      setDraftDirty(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleTimezoneBlur() {
    if (!user) return;
    const value = timezoneDraft.trim() || "America/Sao_Paulo";
    if (value === (emailSettings?.timezone ?? "")) return;
    if (!isValidTimezone(value)) {
      setTimezoneDraft(emailSettings?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
      setError("Timezone inválido; não foi salvo. Será usado America/Sao_Paulo se não corrigir.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await saveEmailReminderSettings({ timezone: value });
      if (next) {
        setEmailSettings(next);
        setSuccess("Fuso salvo.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o fuso horário.");
    } finally {
      setSaving(false);
    }
  }

  const summary = !user
    ? "Lembretes por email estão disponíveis para contas conectadas."
    : emailSettings?.emailEnabled
      ? `Email diário ativo às ${emailSettings.emailTime} (${emailSettings.timezone}).`
      : "Ative o email diário para receber lembretes fora do app.";

  return (
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <div className="flex items-center gap-2">
        <h2 className="ui-feature-title text-muted text-sm">Email diário</h2>
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
                {EMAIL_HOW}
              </div>
            )}
          </span>
        )}
      </div>
      {!compact && <p className="mt-2 text-sm leading-5 text-muted">{summary}</p>}
      {compact && <p className="mt-1 text-xs text-muted">{summary}</p>}

      {!user ? (
        <Link
          href={compact ? "/login?returnTo=%2Ftoday" : "/login?returnTo=%2Fsettings"}
          className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
        >
          {compact ? "Entrar com Google" : "Entrar para ativar email"}
        </Link>
      ) : (
        <>
          <div className={compact ? "mt-2 flex flex-wrap items-center gap-2" : "mt-3 flex flex-wrap items-center gap-2"}>
            <button
              type="button"
              onClick={() => void handleToggle()}
              disabled={saving}
              className={[
                "inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none",
                emailSettings?.emailEnabled ? "ui-cta-secondary border" : "btn-primary-brand ui-cta-primary bg-accent text-white"
              ].join(" ")}
            >
              {saving ? "Salvando..." : emailSettings?.emailEnabled ? "Desativar email diário" : "Ativar email diário"}
            </button>
            <label className="text-xs text-muted" id="daily-email-time-label">
              Horário (24h)
            </label>
            {(() => {
              const et = parseTimeHHmm(emailTimeDraft);
              return (
                <div className="flex flex-wrap items-center gap-1">
                  <select
                    id="daily-email-time"
                    aria-labelledby="daily-email-time-label"
                    value={et.h}
                    disabled={saving}
                    onChange={(e) => void handleTimeChange(formatTimeHHmm(parseInt(e.target.value, 10), et.m))}
                    className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                    aria-label="Hora do email diário"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}h</option>
                    ))}
                  </select>
                  <span className="text-muted">:</span>
                  <select
                    value={et.m}
                    disabled={saving}
                    onChange={(e) => void handleTimeChange(formatTimeHHmm(et.h, parseInt(e.target.value, 10)))}
                    className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                    aria-label="Minuto do email diário"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                    ))}
                  </select>
                </div>
              );
            })()}
            {!compact && (
              <>
                <label className="text-xs text-muted" id="daily-email-timing-label">
                  Lembrete
                </label>
                <select
                  id="daily-email-timing"
                  aria-labelledby="daily-email-timing-label"
                  value={emailSettings?.reminderTiming ?? DEFAULT_EMAIL_REMINDER_SETTINGS.reminderTiming}
                  disabled={saving}
                  onChange={(e) => void handleReminderTimingChange(e.target.value as ReminderTiming)}
                  className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                  aria-label="Quando receber o lembrete"
                >
                  <option value="day_of">No dia do aniversário</option>
                  <option value="day_before">No dia anterior</option>
                </select>
                <label className="text-xs text-muted" htmlFor="daily-email-timezone">
                  Fuso
                </label>
                <input
                  id="daily-email-timezone"
                  type="text"
                  placeholder="America/Sao_Paulo"
                  value={timezoneDraft}
                  disabled={saving}
                  onChange={(e) => setTimezoneDraft(e.target.value)}
                  onBlur={() => void handleTimezoneBlur()}
                  className="ui-focus-surface h-10 min-w-[10rem] rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                />
              </>
            )}
          </div>
          {!compact && (
            <>
              {(emailSettings?.timezone || timezoneDraft) && !isValidTimezone(timezoneDraft || emailSettings?.timezone || "") && (
                <p className="mt-2 text-xs text-warning">
                  Timezone inválido; não será salvo (será usado America/Sao_Paulo).
                </p>
              )}
              {lastDispatch && (
                <div className="mt-2 space-y-0.5 text-xs text-muted">
                  {lastDispatch.status === "sent" && (
                    <p>
                      Último envio: {lastDispatch.sentAt
                        ? new Date(lastDispatch.sentAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", hour12: false })
                        : lastDispatch.dateKey}
                    </p>
                  )}
                  {lastDispatch.status === "skipped" && <p>Último status: sem aniversários no dia ({lastDispatch.dateKey}).</p>}
                  {lastDispatch.status === "error" && (
                    <p>Último status: erro no envio{lastDispatch.errorMessage ? ` — ${lastDispatch.errorMessage}` : ""}</p>
                  )}
                  {lastDispatch.status === "pending" && <p>Último status: em processamento.</p>}
                </div>
              )}
              {emailSettings?.lastDailyEmailSentOn && !lastDispatch && (
                <p className="mt-2 text-xs text-muted">Último envio registrado: {emailSettings.lastDailyEmailSentOn}</p>
              )}
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              {success && <p className="mt-2 text-xs text-success">{success}</p>}
            </>
          )}
        </>
      )}
    </section>
  );
}
