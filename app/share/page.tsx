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
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-surface p-5 shadow-xl">
        <h2 className="text-lg font-semibold tracking-tight text-text">Adicionar meu aniversÃ¡rio</h2>
        <p className="mt-2 text-sm text-muted">Cadastre nome e dia/mÃªs para gerar seu link de compartilhamento.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Nome</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ana"
              className="w-full rounded-xl border border-border/80 bg-surface2/70 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/70 focus:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Dia</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full rounded-xl border border-border/80 bg-surface2/70 px-3 py-2 text-sm text-text outline-none focus:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">MÃªs</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-border/80 bg-surface2/70 px-3 py-2 text-sm text-text outline-none focus:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
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

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="ui-cta-secondary rounded-xl border px-3 py-2 text-sm disabled:opacity-70 focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onSave({ name: name.trim(), day, month })}
            disabled={!canSave}
            className="btn-primary-brand ui-cta-primary rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none"
          >
            {saving ? "Salvando..." : "Salvar e gerar link"}
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
      window.alert("NÃ£o foi possÃ­vel copiar o link.");
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
      <div className="space-y-8 lg:space-y-10">
        <section className="ui-copy-backdrop px-1 py-1 sm:px-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Lembra â€¢ Compartilhamento</p>
          <h1 className="ui-title-editorial mt-2 text-3xl sm:text-[2.15rem]">Compartilhe aniversÃ¡rios com um link</h1>
          <p className="ui-subtitle-editorial mt-3 max-w-[64ch] text-sm sm:text-[15px]">
            O link mostra apenas nome e dia/mÃªs (sem ano). Escolha um aniversÃ¡rio abaixo para gerar ou copiar.
          </p>
        </section>

        {loading ? (
          <p className="text-sm text-black/60">Carregando...</p>
        ) : sortedPeople.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border/70 bg-surface/70 p-8 text-center shadow-sm dark:bg-surface/20">
            <p className="text-lg font-semibold tracking-tight text-text">VocÃª ainda nÃ£o tem aniversÃ¡rios cadastrados</p>
            <p className="mt-2 text-sm text-muted">
              Adicione o seu primeiro aniversÃ¡rio para gerar um link de compartilhamento em segundos.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="btn-primary-brand ui-cta-primary rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none"
              >
                Adicionar meu aniversÃ¡rio
              </button>
              <Link href="/person" className="ui-cta-secondary inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm focus-visible:outline-none">
                Abrir cadastro completo
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 shadow-sm dark:bg-surface/20">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Seus aniversÃ¡rios</h2>
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="ui-focus-surface rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-none"
              >
                Adicionar outro
              </button>
            </div>

            <div className="space-y-3">
              {sortedPeople.map((person) => {
                const relativeUrl = buildShareUrl(person);
                return (
                  <div key={person.id} className="rounded-2xl border border-border/65 bg-surface/80 p-4 shadow-sm dark:bg-surface/15">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text">{person.name}</p>
                        <p className="text-sm text-muted">{formatDayMonth(person.day, person.month)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={relativeUrl} className="btn-primary-brand ui-cta-primary inline-flex items-center justify-center rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none">
                          Gerar link
                        </Link>
                        <button
                          type="button"
                          onClick={() => void copyLink(person)}
                          className="ui-cta-secondary rounded-xl border px-3 py-2 text-sm focus-visible:outline-none"
                        >
                          Copiar link
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 min-h-5 text-xs text-emerald-700">{copiedPersonId === person.id ? "Link copiado âœ“" : ""}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
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

