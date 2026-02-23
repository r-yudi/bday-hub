"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ImportCsv } from "@/components/ImportCsv";
import { PersonCard } from "@/components/PersonCard";
import { getNotificationSupport, requestNotificationPermission } from "@/lib/notifications";
import { getTodayPeople } from "@/lib/dates";
import { clearAllData, deletePerson, getSettings, listPeople, saveSettings, upsertManyPeople } from "@/lib/storage";
import type { AppSettings, BirthdayPerson } from "@/lib/types";

export default function TodayPage() {
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const support = getNotificationSupport();
  const notificationCtaLabel = !support.supported
    ? "Navegador sem suporte"
    : support.permission === "granted" && settings?.notificationEnabled
      ? "Notificações ativadas"
      : support.permission === "denied"
        ? "Permissão bloqueada"
        : "Solicitar / Ativar notificações";

  async function loadData() {
    setLoading(true);
    try {
      const [storedPeople, storedSettings] = await Promise.all([listPeople(), getSettings()]);
      setPeople(storedPeople);
      setSettings(storedSettings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const todayPeople = useMemo(() => getTodayPeople(people), [people]);

  useEffect(() => {
    if (todayPeople.length === 0) {
      setBanner(null);
      return;
    }
    if (!settings?.notificationEnabled || support.permission !== "granted") {
      setBanner(`Hoje você tem ${todayPeople.length} aniversariante(s).`);
      return;
    }
    setBanner(null);
  }, [todayPeople, settings?.notificationEnabled, support.permission]);

  async function handleImport(imported: BirthdayPerson[]) {
    await upsertManyPeople(imported);
    await loadData();
    setShowImport(false);
  }

  async function handleDelete(id: string) {
    await deletePerson(id);
    await loadData();
  }

  async function handleEnableNotifications() {
    const permission = await requestNotificationPermission();
    if (permission === "unsupported") {
      window.alert("Seu navegador não suporta Notification API.");
      return;
    }

    const next: AppSettings = {
      ...(settings ?? { notificationEnabled: false, notificationTime: "09:00" }),
      notificationEnabled: permission === "granted"
    };

    await saveSettings(next);
    setSettings(next);

    if (permission !== "granted") {
      window.alert("Permissão não concedida. O app continuará mostrando o aviso ao abrir.");
    }
  }

  async function handleClearData() {
    const confirmed = window.confirm("Limpar todos os dados locais? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    await clearAllData();
    await loadData();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hoje</h1>
          <p className="text-sm text-black/70">Aniversariantes do dia e ações rápidas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/person" className="rounded-xl bg-ink px-4 py-2 text-sm text-paper">
            Adicionar
          </Link>
          <button type="button" onClick={() => setShowImport((v) => !v)} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm">
            {showImport ? "Fechar CSV" : "Importar CSV"}
          </button>
        </div>
      </section>

      {banner && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{banner}</div>}

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {showImport && <ImportCsv onImport={handleImport} />}

          {loading ? (
            <p className="text-sm text-black/60">Carregando...</p>
          ) : todayPeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-6 text-sm text-black/70">
              Nenhum aniversário hoje. Veja a aba &quot;Próximos 7 dias&quot; ou adicione uma pessoa.
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
          <section className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black/70">Notificações</h2>
            <p className="mt-2 text-sm text-black/70">
              Estratégia MVP: melhor esforço. Se suportado e permitido, o app notifica ao abrir e evita duplicar no mesmo dia.
            </p>
            <div className="mt-3 space-y-1 text-xs text-black/60">
              <p>Suporte: {support.supported ? "sim" : "não"}</p>
              <p>Permissão: {String(support.permission)}</p>
              <p>Ativado no app: {settings?.notificationEnabled ? "sim" : "não"}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleEnableNotifications()}
              disabled={!support.supported || (support.permission === "granted" && Boolean(settings?.notificationEnabled))}
              className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notificationCtaLabel}
            </button>
            {support.permission === "denied" && (
              <p className="mt-2 text-xs text-amber-700">
                Permissão negada no navegador. Reative manualmente nas configurações do site para usar notificações.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black/70">Dados</h2>
            <p className="mt-2 text-sm text-black/70">Persistência local via IndexedDB com fallback para localStorage.</p>
            <button type="button" onClick={() => void handleClearData()} className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Limpar todos os dados
            </button>
            <a href="/sample-birthdays.csv" download className="mt-2 block rounded-lg border border-black/10 px-3 py-2 text-center text-sm hover:bg-black/5">
              Baixar CSV de exemplo
            </a>
          </section>
        </aside>
      </section>
    </div>
  );
}
