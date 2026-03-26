"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getEmailReminderSettings, getLastEmailDispatch, saveEmailReminderSettings } from "@/lib/notificationSettingsRepo";
import { DEFAULT_EMAIL_REMINDER_SETTINGS, type EmailReminderSettings, type LastEmailDispatch } from "@/lib/types";

type EmailDailyCardProps = { variant?: "default" | "compact"; listEmpty?: boolean };

function EmailExplanation({ compact, listEmpty }: { compact: boolean; listEmpty?: boolean }) {
  if (compact) {
    return (
      <div className="mt-1 space-y-1.5 text-xs leading-relaxed text-muted">
        <p>Enviamos lembretes: 7 dias antes, 1 dia antes ou no dia do aniversário.</p>
        <p>No máximo um email por dia, quando fizer sentido na sua lista.</p>
        {listEmpty && (
          <p className="text-xs text-muted">Lista vazia: nenhum email é enviado, mesmo com o alerta ligado.</p>
        )}
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
      <p className="font-medium text-text">Enviamos lembretes:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>7 dias antes</li>
        <li>1 dia antes</li>
        <li>no dia do aniversário</li>
      </ul>
      <p className="text-xs">No máximo um email por dia, quando fizer sentido na sua lista.</p>
      {listEmpty && (
        <p className="text-xs text-muted">Sem aniversários na lista, não há envio — independente do interruptor.</p>
      )}
    </div>
  );
}

export function EmailDailyCard({ variant = "default", listEmpty = false }: EmailDailyCardProps) {
  const compact = variant === "compact";
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailReminderSettings | null>(null);
  const [lastDispatch, setLastDispatch] = useState<LastEmailDispatch>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    void getEmailReminderSettings().then((s) => {
      if (s) setEmailSettings(s);
    });
    void getLastEmailDispatch().then(setLastDispatch);
  }, [mounted, user?.id]);

  async function handleToggle() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const nextEnabled = !(emailSettings?.emailEnabled ?? false);
    try {
      const saved = await saveEmailReminderSettings({
        emailEnabled: nextEnabled,
        emailTime: emailSettings?.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime,
        timezone: emailSettings?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone,
        reminderTiming: emailSettings?.reminderTiming ?? DEFAULT_EMAIL_REMINDER_SETTINGS.reminderTiming
      });
      if (saved) {
        setEmailSettings(saved);
        setSuccess(nextEnabled ? "Lembretes por email ativados." : "Lembretes por email desativados.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar.");
    } finally {
      setSaving(false);
    }
  }

  const enabled = Boolean(emailSettings?.emailEnabled);

  return (
    <section className={compact ? "rounded-xl border border-border bg-surface/50 p-3" : "ui-feature-block"}>
      <h2 className="ui-feature-title text-muted text-sm">Lembretes por email</h2>
      <p className={compact ? "mt-1 text-xs text-muted" : "mt-2 text-sm text-muted"}>
        Receba lembretes na sua conta, mesmo quando não abrir o app.
      </p>
      <EmailExplanation compact={compact} listEmpty={listEmpty} />

      {!user ? (
        <div className={compact ? "mt-2" : "mt-4"}>
          <p className="text-sm text-muted">Faça login para ativar emails</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked="false"
              disabled
              className="relative h-8 w-14 shrink-0 cursor-not-allowed rounded-full bg-surface2 opacity-60"
              aria-label="Lembretes por email desativados — faça login"
            >
              <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-muted shadow transition-transform" />
            </button>
            <Link
              href={compact ? "/login?returnTo=%2Ftoday" : "/login?returnTo=%2Fsettings"}
              className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
            >
              Entrar com Google
            </Link>
          </div>
        </div>
      ) : (
        <div className={compact ? "mt-2" : "mt-4"}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={saving}
              onClick={() => void handleToggle()}
              className={[
                "relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                enabled ? "bg-accent" : "bg-surface2"
              ].join(" ")}
              aria-label={enabled ? "Desativar lembretes por email" : "Ativar lembretes por email"}
            >
              <span
                className={[
                  "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  enabled ? "left-7" : "left-1"
                ].join(" ")}
              />
            </button>
            <span className="text-sm text-text">{enabled ? "Ativado" : "Desativado"}</span>
          </div>
          {!compact && lastDispatch && (
            <div className="mt-3 space-y-0.5 text-xs text-muted">
              {lastDispatch.status === "sent" && (
                <p>
                  Último envio:{" "}
                  {lastDispatch.sentAt
                    ? new Date(lastDispatch.sentAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        hour12: false
                      })
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
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          {success && <p className="mt-2 text-xs text-success">{success}</p>}
        </div>
      )}
    </section>
  );
}
