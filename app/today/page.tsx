"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ImportCsv } from "@/components/ImportCsv";
import { PersonCard } from "@/components/PersonCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { AppToast } from "@/components/AppToast";
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport
} from "@/lib/notifications";
import { getTodayPeople, todayParts } from "@/lib/dates";
import { clearAllData, getSettings, saveSettings } from "@/lib/storage";
import { deleteBirthday, importCsvBirthdays, listBirthdays } from "@/lib/birthdaysRepo";
import { buildAddBirthdayToast, consumeBirthdayAddedToast, type OnboardingToast } from "@/lib/onboarding-ui";
import type { AppSettings, BirthdayPerson } from "@/lib/types";

const INITIAL_NOTIFICATION_SUPPORT: NotificationSupport = {
  supported: false,
  permission: "unsupported"
};

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
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-surface p-5 shadow-xl dark:bg-surface2/70">
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
            className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Limpando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [support, setSupport] = useState<NotificationSupport>(INITIAL_NOTIFICATION_SUPPORT);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearingData, setClearingData] = useState(false);
  const [toast, setToast] = useState<OnboardingToast | null>(null);

  const notificationCtaLabel = !mounted
    ? "Carregando..."
    : !support.supported
      ? "Navegador sem suporte"
      : support.permission === "granted" && settings?.notificationEnabled
        ? "Lembretes ativados"
        : support.permission === "denied"
          ? "Permissão bloqueada"
          : "Ativar lembretes";

  async function loadData() {
    setLoading(true);
    try {
      const [storedPeople, storedSettings] = await Promise.all([listBirthdays(), getSettings()]);
      setPeople(storedPeople);
      setSettings(storedSettings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setSupport(getNotificationSupport());
    void loadData();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!consumeBirthdayAddedToast()) return;
    setToast(buildAddBirthdayToast(people.length));
  }, [mounted, loading, people.length]);

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

  async function handleEnableNotifications() {
    if (!mounted) return;

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
          ? "Lembretes ativos: ao abrir o app, você recebe um aviso dos aniversários de hoje."
          : "Ative os lembretes para ser avisado ao abrir o app nos dias com aniversários.";

  return (
    <>
      <div className="space-y-8 lg:space-y-10">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="ui-title-editorial text-3xl sm:text-[2.15rem]">Hoje</h1>
            <p className="ui-subtitle-editorial mt-2 max-w-[60ch] text-sm sm:text-[15px]">Veja quem faz aniversário hoje e registre pessoas com categorias quando precisar.</p>
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
        </section>

        {!loading && <OnboardingBanner count={people.length} mounted={mounted} />}

        {banner && <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm">{banner}</div>}

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:gap-5">
          <div className="space-y-4">
            {showImport && <ImportCsv onImport={handleImport} />}

            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : todayPeople.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-surface/65 p-6 text-center shadow-sm dark:bg-surface/20 sm:p-7">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper text-2xl shadow-sm">🎂</div>
                <p className="mt-4 text-lg font-semibold tracking-tight text-text">Nenhum aniversário hoje 🎈</p>
                <p className="mt-2 text-sm text-muted">Aproveite para revisar os próximos dias ou adicionar alguém agora.</p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link
                    href="/person"
                    aria-label="Criar novo aniversario"
                    className="btn-primary-brand ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none"
                  >
                    Adicionar aniversário
                  </Link>
                  <Link href="/upcoming" className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none">
                    Ver próximos 7 dias
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImport(true)}
                  className="mt-3 text-xs font-medium text-muted underline decoration-border underline-offset-2 hover:text-text"
                >
                  Abrir importação CSV
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {todayPeople.map((person) => (
                  <PersonCard key={person.id} person={person} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 shadow-sm dark:bg-surface/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Lembretes</h2>
                {reminderSentToday && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 shadow-sm">
                    Lembrete enviado hoje
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-5 text-muted">{notificationSummary}</p>

              <button
                type="button"
                onClick={() => void handleEnableNotifications()}
                disabled={!mounted || !support.supported || (support.permission === "granted" && Boolean(settings?.notificationEnabled))}
                className="btn-primary-brand ui-cta-primary mt-3 rounded-xl bg-accent px-3 py-2 text-sm text-white shadow-sm hover:bg-accentHover disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted disabled:shadow-none focus-visible:outline-none"
              >
                {notificationCtaLabel}
              </button>

              <button
                type="button"
                onClick={() => setShowNotificationDetails((v) => !v)}
                className="mt-2 block text-xs text-muted underline decoration-border underline-offset-2 hover:text-text"
              >
                {showNotificationDetails ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
              </button>

              {showNotificationDetails && (
                <div className="mt-3 rounded-xl border border-border/60 bg-surface2/50 px-3 py-2 text-xs text-muted dark:bg-surface/20">
                  <p>Estratégia MVP: melhor esforço (notifica ao abrir o app, quando suportado).</p>
                  <p className="mt-1">Suporte: {mounted ? (support.supported ? "sim" : "não") : "..."}</p>
                  <p>Permissão: {mounted ? String(support.permission) : "..."}</p>
                  <p>Ativado no app: {mounted ? (settings?.notificationEnabled ? "sim" : "não") : "..."}</p>
                  {support.permission === "denied" && (
                    <p className="mt-1 text-amber-700">Permissão negada no navegador. Reative nas configurações do site.</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 shadow-sm dark:bg-surface/20">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Dados</h2>
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
