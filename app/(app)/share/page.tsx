"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppToast } from "@/components/AppToast";
import { encodeShareToken } from "@/lib/share";
import { formatDayMonth } from "@/lib/dates";
import { listBirthdays, upsertBirthday } from "@/lib/birthdaysRepo";
import { buildAddBirthdayToast, markOnboardingCompleted, type OnboardingToast } from "@/lib/onboarding-ui";
import type { BirthdayPerson } from "@/lib/types";

function buildShareUrl(person: BirthdayPerson) {
  const token = encodeShareToken({
    name: person.name,
    day: person.day,
    month: person.month,
    issuedAt: person.updatedAt
  });
  return `/share/${token}`;
}

function QuickAddBirthdayModal({
  open,
  saving,
  onCancel,
  onSave
}: {
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: { name: string; day: number; month: number }) => Promise<void>;
}) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDay(1);
      setMonth(1);
    }
  }, [open]);

  if (!open) return null;

  const canSave = name.trim().length > 0 && !saving;

  return (
    <div className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4">
      <div className="ui-modal-surface w-full max-w-md border p-5">
        <h2 className="text-lg font-semibold tracking-tight text-text">Adicionar para gerar link</h2>
        <p className="mt-2 text-sm text-muted">
          Precisamos de nome e data (dia e mês). Depois você copia o link na lista abaixo.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Nome</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ana"
              className="ui-focus-surface w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Dia</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="ui-focus-surface w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Mês</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="ui-focus-surface w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="ui-cta-secondary rounded-xl border px-4 py-2.5 text-sm disabled:opacity-70 focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onSave({ name: name.trim(), day, month })}
            disabled={!canSave}
            className="ui-cta-primary rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none"
          >
            {saving ? "Salvando…" : "Salvar e gerar link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShareLandingPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [savingQuickAdd, setSavingQuickAdd] = useState(false);
  const [toast, setToast] = useState<OnboardingToast | null>(null);

  async function loadPeople(): Promise<BirthdayPerson[]> {
    setLoading(true);
    try {
      const items = await listBirthdays();
      items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      setPeople(items);
      return items;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadPeople();
  }, [mounted]);

  const sortedPeople = useMemo(() => people, [people]);

  async function copyLink(person: BirthdayPerson) {
    const absoluteUrl = `${window.location.origin}${buildShareUrl(person)}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedPersonId(person.id);
      window.setTimeout(() => setCopiedPersonId(null), 1500);
    } catch {
      window.alert("Não foi possível copiar o link.");
    }
  }

  async function handleQuickAdd(values: { name: string; day: number; month: number }) {
    if (!values.name) return;

    setSavingQuickAdd(true);
    try {
      const now = Date.now();
      await upsertBirthday({
        id: crypto.randomUUID(),
        name: values.name,
        day: values.day,
        month: values.month,
        source: "manual",
        categories: [],
        tags: [],
        createdAt: now,
        updatedAt: now
      });

      const nextPeople = await loadPeople();
      if (nextPeople.length >= 5) {
        markOnboardingCompleted();
      }
      setToast(buildAddBirthdayToast(nextPeople.length));
      setShowQuickAdd(false);
    } finally {
      setSavingQuickAdd(false);
    }
  }

  return (
    <>
      <div className="ui-container" data-page-canonical="share">
        <section className="ui-section">
          <div className="ui-panel mx-auto w-full max-w-2xl p-6 sm:p-8">
            <header className="ui-section-header">
              <p className="ui-eyebrow">Convites</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Compartilhar</h1>
              <p className="ui-subtitle-editorial max-w-[68ch] text-sm sm:text-[15px]">
                Um link por pessoa. Quem receber vê só nome e dia/mês (sem ano) e pode salvar na própria lista do Lembra.
              </p>
            </header>

            <div className="mt-8">
              {loading ? (
                <p className="text-sm text-muted">Carregando...</p>
              ) : sortedPeople.length === 0 ? (
                <div className="ui-empty-hero py-6">
                  <div className="ui-empty-icon" aria-hidden>
                    🔗
                  </div>
                  <h2 className="ui-empty-title">Nada para compartilhar ainda</h2>
                  <p className="ui-empty-subtitle">
                    Cadastre alguém aqui ou em Pessoas; em seguida você gera o link de convite.
                  </p>
                  <div className="ui-empty-actions">
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(true)}
                      className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium focus-visible:outline-none"
                    >
                      Adicionar agora
                    </button>
                    <Link
                      href="/person"
                      className="ui-cta-secondary inline-flex h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none"
                    >
                      Cadastro completo
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/50 pb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Sua lista</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">Gerar links</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd(true)}
                      className="ui-cta-secondary inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium focus-visible:outline-none"
                    >
                      Adicionar outro
                    </button>
                  </div>

                  <ul className="ui-list overflow-hidden rounded-2xl border border-border/60" role="list">
                    {sortedPeople.map((person) => {
                      const relativeUrl = buildShareUrl(person);
                      return (
                        <li key={person.id} className="ui-list-item">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-base font-semibold tracking-tight text-text">{person.name}</p>
                              <p className="text-sm text-muted">{formatDayMonth(person.day, person.month)}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void copyLink(person)}
                                className="ui-cta-primary inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium focus-visible:outline-none"
                              >
                                Copiar link
                              </button>
                              <Link href={relativeUrl} className="ui-link-tertiary text-sm font-medium">
                                Ver como fica
                              </Link>
                            </div>
                          </div>
                          <p
                            className="mt-2 min-h-[1.25rem] text-xs text-success"
                            aria-live="polite"
                          >
                            {copiedPersonId === person.id ? "Copiado para a área de transferência." : ""}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <QuickAddBirthdayModal
        open={showQuickAdd}
        saving={savingQuickAdd}
        onCancel={() => setShowQuickAdd(false)}
        onSave={handleQuickAdd}
      />

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

