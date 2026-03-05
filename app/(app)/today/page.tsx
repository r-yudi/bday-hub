"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ImportCsv } from "@/components/ImportCsv";
import { PersonCard } from "@/components/PersonCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { AppToast } from "@/components/AppToast";
import {
  getEmailReminderSettings,
  getLastEmailDispatch,
  saveEmailReminderSettings,
  getPushSettings,
  savePushEnabled,
  isValidTimezone
} from "@/lib/notificationSettingsRepo";
import { getSafeBrowserSession } from "@/lib/supabase-browser";
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport
} from "@/lib/notifications";
import { getTodayPeople, todayParts } from "@/lib/dates";
import { clearAllData, getSettings, saveSettings } from "@/lib/storage";
import { deleteBirthday, importCsvBirthdays, listBirthdays } from "@/lib/birthdaysRepo";
import { buildAddBirthdayToast, consumeBirthdayAddedToast, type OnboardingToast } from "@/lib/onboarding-ui";
import {
  DEFAULT_EMAIL_REMINDER_SETTINGS,
  type AppSettings,
  type BirthdayPerson,
  type EmailReminderSettings,
  type LastEmailDispatch
} from "@/lib/types";

const INITIAL_NOTIFICATION_SUPPORT: NotificationSupport = {
  supported: false,
  permission: "unsupported"
};

function parseTimeHHmm(s: string): { h: number; m: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((s || "").trim());
  if (!match) return { h: 9, m: 0 };
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

function formatTimeHHmm(h: number, m: number): string {
  const hh = Math.max(0, Math.min(23, Math.floor(h)));
  const mm = Math.max(0, Math.min(59, Math.floor(m)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function ClearDataModal({
  open,
  value,
  loading,
  onChange,
  onCancel,
  onConfirm
}: {
  open: boolean;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const canConfirm = value.trim().toUpperCase() === "LIMPAR" && !loading;

  return (
    <div className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4">
      <div className="ui-modal-surface w-full max-w-md border p-5">
        <h3 className="text-lg font-semibold tracking-tight text-text">Tem certeza?</h3>
        <p className="mt-2 text-sm text-muted">
          Todos os aniversários salvos localmente neste dispositivo serão apagados. Esta ação não pode ser desfeita.
        </p>
        <p className="mt-3 text-xs text-muted">Digite "LIMPAR" para confirmar.</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite LIMPAR"
          className="mt-2 w-full rounded-xl border border-border/80 bg-surface2/60 px-3 py-2 text-sm text-text outline-none ring-0 placeholder:text-muted/70 focus:border-border focus-visible:ring-2 focus-visible:ring-primary/35"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="ui-cta-secondary rounded-xl border px-3 py-2 text-sm disabled:opacity-70 focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="rounded-xl bg-danger px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-95"
          >
            {loading ? "Limpando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [support, setSupport] = useState<NotificationSupport>(INITIAL_NOTIFICATION_SUPPORT);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearingData, setClearingData] = useState(false);
  const [toast, setToast] = useState<OnboardingToast | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [lastDispatch, setLastDispatch] = useState<LastEmailDispatch | null>(null);
  const [timezoneDraft, setTimezoneDraft] = useState<string>("");
  const [emailTimeDraft, setEmailTimeDraft] = useState<string>(DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
  const [emailDraftDirty, setEmailDraftDirty] = useState(false);
  const [pushSettings, setPushSettings] = useState<{ pushEnabled: boolean } | null>(null);
  const [pushSaving, setPushSaving] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);

  const notificationCtaLabel = !mounted
    ? "Carregando..."
    : !support.supported
      ? "Navegador sem suporte"
      : support.permission === "granted" && settings?.notificationEnabled
        ? "Desativar lembretes"
        : support.permission === "denied"
          ? "Permissão bloqueada"
          : "Ativar lembretes";

  async function loadData() {
    setLoading(true);
    try {
      const [storedPeople, storedSettings, remoteEmailSettings, remoteLastDispatch, remotePushSettings] =
        await Promise.all([
          listBirthdays(),
          getSettings(),
          user ? getEmailReminderSettings() : Promise.resolve(null),
          user ? getLastEmailDispatch() : Promise.resolve(null),
          user ? getPushSettings() : Promise.resolve(null)
        ]);
      setPeople(storedPeople);
      setSettings(storedSettings);
      const nextEmail = remoteEmailSettings ?? (user ? { ...DEFAULT_EMAIL_REMINDER_SETTINGS } : null);
      setEmailSettings(nextEmail);
      setTimezoneDraft(nextEmail?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
      setLastDispatch(remoteLastDispatch ?? null);
      setPushSettings(remotePushSettings ?? { pushEnabled: false });
      setEmailError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true
    );
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setSupport(getNotificationSupport());
    void loadData();
  }, [mounted, user?.id]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!consumeBirthdayAddedToast()) return;
    setToast(buildAddBirthdayToast(people.length));
  }, [mounted, loading, people.length]);

  useEffect(() => {
    if (!emailSettings || emailDraftDirty) return;
    setEmailTimeDraft(emailSettings.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
  }, [emailSettings, emailDraftDirty]);

  const todayPeople = useMemo(() => getTodayPeople(people), [people]);
  const todayIso = mounted ? todayParts().iso : null;
  const reminderSentToday = Boolean(todayIso && todayPeople.length > 0 && settings?.lastNotifiedDate === todayIso);

  useEffect(() => {
    if (!mounted || todayPeople.length === 0) {
      setBanner(null);
      return;
    }

    if (!settings?.notificationEnabled || support.permission !== "granted") {
      setBanner(`Hoje você tem ${todayPeople.length} aniversário(s). Ative os lembretes para não esquecer.`);
      return;
    }

    setBanner(null);
  }, [mounted, todayPeople, settings?.notificationEnabled, support.permission]);

  async function handleImport(imported: BirthdayPerson[]) {
    await importCsvBirthdays(imported);
    await loadData();
    setShowImport(false);
  }

  async function handleDelete(id: string) {
    await deleteBirthday(id);
    await loadData();
  }

  async function handleNotificationToggle() {
    if (!mounted) return;

    if (support.permission === "granted" && settings?.notificationEnabled) {
      setNotificationSaving(true);
      const next: AppSettings = {
        ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
        notificationEnabled: false
      };
      await saveSettings(next);
      setSettings(next);
      setNotificationSaving(false);
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === "unsupported") {
      setSupport({ supported: false, permission: "unsupported" });
      window.alert("Seu navegador não suporta notificações.");
      return;
    }

    setSupport({ supported: true, permission });

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

  async function handleNotificationTimeChange(value: string) {
    if (!mounted || !settings) return;
    setNotificationSaving(true);
    const next: AppSettings = { ...settings, notificationTime: value };
    await saveSettings(next);
    setSettings(next);
    setNotificationSaving(false);
  }

  async function handleEmailToggle() {
    if (!user) return;
    setEmailSaving(true);
    setEmailError(null);
    setEmailSuccess(null);
    const nextEnabled = !(emailSettings?.emailEnabled ?? false);
    const timezoneToSave =
      timezoneDraft.trim() && isValidTimezone(timezoneDraft.trim())
        ? timezoneDraft.trim()
        : (emailSettings?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
    try {
      const saved = await saveEmailReminderSettings({
        emailEnabled: nextEnabled,
        emailTime: emailTimeDraft,
        timezone: timezoneToSave
      });
      if (saved) {
        setEmailSettings(saved);
        setEmailTimeDraft(saved.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime);
        setEmailDraftDirty(false);
        setEmailError(null);
        setEmailSuccess("Configurações salvas.");
        setTimeout(() => setEmailSuccess(null), 3000);
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Não foi possível atualizar lembretes por email.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleTimezoneBlur() {
    if (!user) return;
    const value = timezoneDraft.trim() || "America/Sao_Paulo";
    if (value === (emailSettings?.timezone ?? "")) return;
    if (!isValidTimezone(value)) {
      setTimezoneDraft(emailSettings?.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone);
      setEmailError("Timezone inválido; não foi salvo. Será usado America/Sao_Paulo se não corrigir.");
      return;
    }
    setEmailSaving(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const next = await saveEmailReminderSettings({ timezone: value });
      if (next) {
        setEmailSettings(next);
        setEmailSuccess("Fuso salvo.");
        setTimeout(() => setEmailSuccess(null), 3000);
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Não foi possível salvar o fuso horário.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePushToggle() {
    if (!user || !mounted) return;
    setPushSaving(true);
    setPushError(null);
    const enabling = !(pushSettings?.pushEnabled ?? false);
    try {
      if (enabling) {
        const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
        await ("ready" in reg && reg.ready ? reg.ready : Promise.resolve(reg));
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setPushError("Permissão negada. Push permanece desativado.");
          setPushSaving(false);
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setPushError("Push não configurado no servidor.");
          setPushSaving(false);
          return;
        }
        const keyBytes = Uint8Array.from(atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
          c.charCodeAt(0)
        );
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes
        });
        const toBase64Url = (buf: ArrayBuffer) =>
          btoa(String.fromCharCode(...new Uint8Array(buf)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        const { session } = await getSafeBrowserSession();
        if (!session?.access_token) {
          setPushError("Sessão expirada. Faça login novamente.");
          setPushSaving(false);
          return;
        }
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: toBase64Url(sub.getKey("p256dh")!),
              auth: toBase64Url(sub.getKey("auth")!)
            }
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setPushError(data.message === "endpoint-already-used" ? "Este dispositivo já está em uso em outra conta." : "Falha ao ativar push.");
          setPushSaving(false);
          return;
        }
        const next = await savePushEnabled(true);
        if (next) setPushSettings(next);
      } else {
        const { session } = await getSafeBrowserSession();
        if (session?.access_token) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
        }
        const reg = await navigator.serviceWorker.getRegistration("/");
        if (reg?.pushManager) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe().catch(() => {});
        }
        const next = await savePushEnabled(false);
        if (next) setPushSettings(next);
      }
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Erro ao alterar push.");
    } finally {
      setPushSaving(false);
    }
  }

  function openClearModal() {
    setClearConfirmText("");
    setShowClearModal(true);
  }

  function closeClearModal() {
    if (clearingData) return;
    setShowClearModal(false);
    setClearConfirmText("");
  }

  async function confirmClearData() {
    if (clearConfirmText.trim().toUpperCase() !== "LIMPAR") return;
    setClearingData(true);
    try {
      await clearAllData();
      setShowClearModal(false);
      setClearConfirmText("");
      await loadData();
    } finally {
      setClearingData(false);
    }
  }

  const notificationSummary = !mounted
    ? "Carregando estado dos lembretes..."
    : !support.supported
      ? "Este navegador não suporta notificações. Você ainda pode usar a tela Hoje normalmente."
      : support.permission === "denied"
        ? "Permissão bloqueada. Reative no navegador se quiser receber lembretes."
        : support.permission === "granted" && settings?.notificationEnabled
          ? `Lembretes ativos: no dia do aniversário, você recebe um aviso no horário escolhido (ao abrir o app ou com o app aberto). Clique na notificação para abrir Hoje.`
          : "Ative os lembretes e escolha o horário. No dia do aniversário você recebe uma notificação (ao abrir o app ou com o app aberto).";

  const emailSummary = !user
    ? "Lembretes por email estão disponíveis para contas conectadas."
    : emailSettings?.emailEnabled
      ? `Email diário ativo às ${emailSettings.emailTime} (${emailSettings.timezone}).`
      : "Ative o email diário para receber lembretes fora do app.";

  return (
    <>
      <div className="ui-container space-y-9 lg:space-y-12">
        <section className="ui-section ui-panel p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="ui-section-header">
              <p className="ui-eyebrow">Painel principal</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Hoje</h1>
              <p className="ui-subtitle-editorial text-sm sm:text-[15px]">Veja quem faz aniversário hoje, mantenha seus lembretes ativos e registre pessoas sem perder ritmo.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Link href="/person" className="btn-primary-brand ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none">
                Adicionar
              </Link>
              <button
                type="button"
                onClick={() => setShowImport((v) => !v)}
                className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
              >
                {showImport ? "Fechar CSV" : "Importar CSV"}
              </button>
            </div>
          </div>
        </section>

        {!loading && <OnboardingBanner count={people.length} mounted={mounted} />}

        {banner && <div className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-text">{banner}</div>}

        <section className="grid gap-5 lg:grid-cols-[1.95fr_1fr] lg:gap-6">
          <div className="space-y-4">
            {showImport && <ImportCsv onImport={handleImport} />}

            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : todayPeople.length === 0 ? (
              <div className="ui-empty-hero">
                <div className="ui-empty-icon" aria-hidden>🎂</div>
                <h2 className="ui-empty-title">Hoje sua lista está tranquila 🎈</h2>
                <p className="ui-empty-subtitle">Use esse momento para preparar os próximos dias e não deixar nenhum parabéns passar.</p>
                <div className="ui-empty-actions">
                  <Link
                    href="/person"
                    aria-label="Criar novo aniversário"
                    className="btn-primary-brand ui-cta-primary order-first inline-flex h-11 min-w-[11rem] items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                  >
                    Adicionar agora
                  </Link>
                  <Link href="/upcoming" className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
                    Ver próximos 7 dias
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImport(true)}
                  className="ui-link-tertiary mt-4 text-xs font-medium"
                >
                  Abrir importação CSV
                </button>
              </div>
            ) : (
              <div className="ui-list">
                {todayPeople.map((person) => (
                  <div key={person.id} className="ui-list-item">
                    <PersonCard person={person} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="ui-feature-block">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="ui-feature-title text-muted">Lembretes</h2>
                {reminderSentToday && (
                  <span className="rounded-full border border-success/30 bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
                    Lembrete enviado hoje
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-5 text-muted">{notificationSummary}</p>

              <button
                type="button"
                onClick={() => void handleNotificationToggle()}
                disabled={!mounted || !support.supported || support.permission === "denied" || notificationSaving}
                className="btn-primary-brand ui-cta-primary mt-3 rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted focus-visible:outline-none"
              >
                {notificationSaving ? "Salvando..." : notificationCtaLabel}
              </button>

              {support.supported && support.permission === "granted" && (() => {
                const nt = parseTimeHHmm(settings?.notificationTime ?? "09:00");
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-muted" htmlFor="daily-notification-hour">
                      Horário do lembrete (24h)
                    </label>
                    <select
                      id="daily-notification-hour"
                      value={nt.h}
                      disabled={notificationSaving}
                      onChange={(e) => void handleNotificationTimeChange(formatTimeHHmm(parseInt(e.target.value, 10), nt.m))}
                      className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                      aria-label="Hora do lembrete"
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
                      disabled={notificationSaving}
                      onChange={(e) => void handleNotificationTimeChange(formatTimeHHmm(nt.h, parseInt(e.target.value, 10)))}
                      className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                      aria-label="Minuto do lembrete"
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
            </section>

            <section className="ui-feature-block">
              <h2 className="ui-feature-title text-muted">Email diário</h2>
              <p className="mt-2 text-sm leading-5 text-muted">{emailSummary}</p>
              {!user ? (
                <Link
                  href="/login?returnTo=%2Ftoday"
                  className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                >
                  Entrar para ativar email
                </Link>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleEmailToggle()}
                      disabled={emailSaving}
                      className={[
                        "inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none",
                        emailSettings?.emailEnabled ? "ui-cta-secondary border" : "btn-primary-brand ui-cta-primary bg-accent text-white"
                      ].join(" ")}
                    >
                      {emailSaving ? "Salvando..." : emailSettings?.emailEnabled ? "Desativar email diário" : "Ativar email diário"}
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
                            disabled={emailSaving}
                            onChange={(e) => {
                              const h = parseInt(e.target.value, 10);
                              setEmailTimeDraft(formatTimeHHmm(h, et.m));
                              setEmailDraftDirty(true);
                            }}
                            className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                            aria-label="Hora do email diário"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {String(i).padStart(2, "0")}h
                              </option>
                            ))}
                          </select>
                          <span className="text-muted">:</span>
                          <select
                            value={et.m}
                            disabled={emailSaving}
                            onChange={(e) => {
                              const m = parseInt(e.target.value, 10);
                              setEmailTimeDraft(formatTimeHHmm(et.h, m));
                              setEmailDraftDirty(true);
                            }}
                            className="ui-focus-surface h-10 rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                            aria-label="Minuto do email diário"
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
                    <label className="text-xs text-muted" htmlFor="daily-email-timezone">
                      Fuso
                    </label>
                    <input
                      id="daily-email-timezone"
                      type="text"
                      placeholder="America/Sao_Paulo"
                      value={timezoneDraft}
                      disabled={emailSaving}
                      onChange={(e) => setTimezoneDraft(e.target.value)}
                      onBlur={() => void handleTimezoneBlur()}
                      className="ui-focus-surface h-10 min-w-[10rem] rounded-xl border px-2.5 text-sm focus-visible:outline-none"
                    />
                  </div>
                  {(emailSettings?.timezone || timezoneDraft) && !isValidTimezone(timezoneDraft || emailSettings?.timezone || "") && (
                    <p className="mt-2 text-xs text-warning">
                      Timezone inválido; não será salvo (será usado America/Sao_Paulo).
                    </p>
                  )}
                  {(lastDispatch ?? emailSettings?.lastDailyEmailSentOn) && (
                    <div className="mt-2 space-y-0.5 text-xs text-muted">
                      {lastDispatch?.status === "sent" && (
                        <p>
                          Último envio: {lastDispatch.sentAt
                            ? new Date(lastDispatch.sentAt).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                                hour12: false
                              })
                            : lastDispatch.dateKey}
                        </p>
                      )}
                      {lastDispatch?.status === "skipped" && (
                        <p>Último status: sem aniversários no dia ({lastDispatch.dateKey}).</p>
                      )}
                      {lastDispatch?.status === "error" && (
                        <p>
                          Último status: erro no envio
                          {lastDispatch.errorMessage ? ` — ${lastDispatch.errorMessage}` : ""}
                        </p>
                      )}
                      {lastDispatch?.status === "pending" && (
                        <p>Último status: em processamento.</p>
                      )}
                      {!lastDispatch && emailSettings?.lastDailyEmailSentOn && (
                        <p>Último envio registrado: {emailSettings.lastDailyEmailSentOn}</p>
                      )}
                    </div>
                  )}
                  {emailError && <p className="mt-2 text-xs text-danger">{emailError}</p>}
                  {emailSuccess && <p className="mt-2 text-xs text-success">{emailSuccess}</p>}
                </>
              )}
            </section>

            <section className="ui-feature-block">
              <h2 className="ui-feature-title text-muted">Push (complementar)</h2>
              {!mounted ? (
                <p className="mt-2 text-sm text-muted">Carregando...</p>
              ) : !user ? (
                <>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Notificações push estão disponíveis para contas conectadas (PWA instalada).
                  </p>
                  <Link
                    href="/login?returnTo=%2Ftoday"
                    className="ui-cta-secondary mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                  >
                    Entrar para ativar push
                  </Link>
                </>
              ) : !isStandalone ? (
                <p className="mt-2 text-sm leading-5 text-muted">
                  Para ativar notificações push, instale o Lembra (PWA) na tela inicial.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    Receba um lembrete no dispositivo quando houver aniversários no dia (complementar ao email).
                  </p>
                  <button
                    type="button"
                    onClick={() => void handlePushToggle()}
                    disabled={pushSaving}
                    className={[
                      "mt-3 inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none",
                      pushSettings?.pushEnabled ? "ui-cta-secondary border" : "btn-primary-brand ui-cta-primary bg-accent text-white"
                    ].join(" ")}
                  >
                    {pushSaving ? "Salvando..." : pushSettings?.pushEnabled ? "Desativar push" : "Ativar push"}
                  </button>
                  {pushError && <p className="mt-2 text-xs text-danger">{pushError}</p>}
                </>
              )}
            </section>

            <section className="ui-feature-block">
              <h2 className="ui-feature-title text-muted">Dados</h2>
              <p className="mt-2 text-sm leading-5 text-muted">Seus aniversários ficam salvos neste dispositivo e você pode exportar em CSV quando quiser.</p>
              <button
                type="button"
                onClick={openClearModal}
                className="ui-cta-secondary mt-3 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-none"
              >
                Limpar todos os dados
              </button>
              <a
                href="/sample-birthdays.csv"
                download
                className="ui-focus-surface mt-2 block rounded-lg border px-3 py-2 text-center text-sm font-medium focus-visible:outline-none"
              >
                Baixar CSV de exemplo
              </a>
            </section>
          </aside>
        </section>
      </div>

      <ClearDataModal
        open={showClearModal}
        value={clearConfirmText}
        loading={clearingData}
        onChange={setClearConfirmText}
        onCancel={closeClearModal}
        onConfirm={() => void confirmClearData()}
      />

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

