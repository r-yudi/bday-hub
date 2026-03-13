"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddBirthdayEntryModal } from "@/components/AddBirthdayEntryModal";
import { PersonCard } from "@/components/PersonCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { AppToast } from "@/components/AppToast";
import { Chip } from "@/components/ui/Chip";
import { getTodayPeople, getUpcomingPeople, formatRelativeLabel } from "@/lib/dates";
import { deleteBirthday, importCsvBirthdays, listBirthdays } from "@/lib/birthdaysRepo";
import { buildAddBirthdayToast, consumeBirthdayAddedToast, queueBirthdayAddedToast, type OnboardingToast } from "@/lib/onboarding-ui";
import type { BirthdayPersonInput } from "@/lib/quickBirthdayParser";
import type { BirthdayPerson } from "@/lib/types";

function TodayPageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialView, setAddModalInitialView] = useState<"menu" | "quick" | "csv" | null>(null);
  const [toast, setToast] = useState<OnboardingToast | null>(null);

  const returnTo =
    searchParams.get("onboarding") === "1"
      ? "/today?onboarding=1&obStep=people"
      : "/today";

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const storedPeople = await listBirthdays();
      setPeople(storedPeople);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadData();
  }, [mounted]);

  const LIST_COMPLETE_TOAST_KEY = "onboarding_banner_complete_toast_shown_v1";
  useEffect(() => {
    if (!mounted || loading) return;
    if (consumeBirthdayAddedToast()) {
      setToast(buildAddBirthdayToast(people.length));
      return;
    }
    if (people.length >= 5) {
      try {
        if (localStorage.getItem(LIST_COMPLETE_TOAST_KEY) !== "1") {
          localStorage.setItem(LIST_COMPLETE_TOAST_KEY, "1");
          setToast({ title: "Perfeito — sua lista já está pronta 🎉", tone: "success" });
        }
      } catch {
        // ignore
      }
    }
  }, [mounted, loading, people.length]);

  const todayPeople = useMemo(() => getTodayPeople(people), [people]);
  const upcomingPeople = useMemo(
    () => getUpcomingPeople(people).filter((p) => p.daysUntil > 0),
    [people]
  );

  async function handleImport(imported: BirthdayPerson[]) {
    await importCsvBirthdays(imported);
    await loadData();
    closeAddModal();
  }

  async function handleQuickImport(valid: BirthdayPersonInput[]) {
    if (valid.length === 0) return;
    const now = Date.now();
    const people: BirthdayPerson[] = valid.map((row, idx) => ({
      id: crypto.randomUUID(),
      name: row.name,
      day: row.day,
      month: row.month,
      source: "manual",
      categories: [],
      tags: [],
      createdAt: now + idx,
      updatedAt: now + idx
    }));
    await importCsvBirthdays(people);
    await loadData();
    queueBirthdayAddedToast();
  }

  async function handleDelete(id: string) {
    await deleteBirthday(id);
    await loadData();
  }

  function onOpenAddModal(view: "menu" | "quick" | "csv") {
    setAddModalInitialView(view);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setAddModalInitialView(null);
  }

  if (error) {
    return (
      <div className="ui-container space-y-6">
        <section className="ui-section ui-panel-soft rounded-2xl border p-6">
          <p className="text-sm font-medium text-danger">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="ui-cta-secondary mt-3 rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Tentar de novo
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="ui-container space-y-9 lg:space-y-12" data-page-canonical="today">
        <section className="ui-section ui-panel p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="ui-section-header">
              <p className="ui-eyebrow">Painel principal</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Hoje</h1>
              <p className="ui-subtitle-editorial text-sm sm:text-[15px]">
                Veja quem faz aniversário hoje e os próximos dias. Adicione ou importe aniversários para não perder nenhum parabéns.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-primary-brand ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm text-white hover:bg-accentHover focus-visible:outline-none"
              >
                + Adicionar aniversário
              </button>
            </div>
          </div>
        </section>

        {!loading && mounted && (
          <Suspense fallback={null}>
            <OnboardingGate
              peopleCount={people.length}
              mounted={mounted}
              onOpenAddModal={onOpenAddModal}
            />
          </Suspense>
        )}

        {!loading && (
          <OnboardingBanner count={people.length} mounted={mounted} returnTo={returnTo} />
        )}

        {loading ? (
          <section className="ui-section ui-panel-soft rounded-2xl border p-8">
            <p className="text-sm text-muted">Carregando...</p>
          </section>
        ) : people.length === 0 ? (
          <section className="ui-section">
            <div className="ui-empty-hero">
              <div className="ui-empty-icon" aria-hidden>
                🎂
              </div>
              <h2 className="ui-empty-title">Nenhum aniversário hoje</h2>
              <p className="ui-empty-subtitle">
                Adicione aniversários para começar.
              </p>
              <div className="ui-empty-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary-brand ui-cta-primary order-first inline-flex h-11 min-w-[11rem] items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  Adicionar aniversário
                </button>
              </div>
              <p className="mt-3 text-center text-sm text-muted">
                ou cole vários de uma vez
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="ui-section" aria-label="Aniversariantes de hoje">
              <h2 className="ui-section-header mb-4 text-lg font-semibold tracking-tight text-text">
                Hoje
              </h2>
              {todayPeople.length === 0 ? (
                <div className="ui-empty-hero rounded-2xl border border-border/80 bg-surface2/40 p-6 sm:p-8">
                  <div className="ui-empty-icon" aria-hidden>
                    🎈
                  </div>
                  <h3 className="ui-empty-title text-base">Nenhum aniversário hoje</h3>
                  <p className="ui-empty-subtitle text-sm">
                    Você tem {people.length} pessoa(s) cadastrada(s). Veja os próximos ou adicione mais.
                  </p>
                  <div className="ui-empty-actions mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/people"
                      className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
                    >
                      Ver pessoas
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
                    >
                      Adicionar aniversário
                    </button>
                  </div>
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
            </section>

            <section className="ui-section" aria-label="Próximos aniversários">
              <h2 className="ui-section-header mb-4 text-lg font-semibold tracking-tight text-text">
                Próximos aniversários
              </h2>
              {upcomingPeople.length === 0 ? (
                <div className="ui-panel-soft rounded-2xl border border-border/80 p-6">
                  <p className="text-sm text-muted">
                    Nada nos próximos dias. Adicione algumas pessoas para o Lembra começar a te ajudar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="ui-cta-primary mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
                  >
                    Adicionar aniversário
                  </button>
                </div>
              ) : (
                <div className="ui-list rounded-2xl border border-border/80 bg-surface2/30 divide-y divide-border/60">
                  {upcomingPeople.map((person, index) => (
                    <div key={person.id} className="ui-list-item flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex flex-wrap items-center gap-2">
                        {index === 0 && (
                          <Chip as="span" variant="subtle" className="ui-chip">
                            Próximo
                          </Chip>
                        )}
                        <span className="font-medium text-text">{person.name}</span>
                        <span className="text-sm text-muted">
                          {formatRelativeLabel(person.daysUntil)} · {String(person.day).padStart(2, "0")}/{String(person.month).padStart(2, "0")}
                        </span>
                      </div>
                      <Link
                        href={`/person?id=${encodeURIComponent(person.id)}`}
                        className="ui-link-tertiary text-sm font-medium"
                      >
                        Ver
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="ui-section flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none"
              >
                + Adicionar aniversário
              </button>
            </section>
          </>
        )}
      </div>

      <AddBirthdayEntryModal
        open={showAddModal}
        onClose={closeAddModal}
        returnTo={returnTo}
        onQuickImport={handleQuickImport}
        onCsvImport={handleImport}
        initialView={addModalInitialView ?? undefined}
      />

      <AppToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={
      <div className="ui-container space-y-6">
        <section className="ui-section ui-panel-soft rounded-2xl border p-8">
          <p className="text-sm text-muted">Carregando...</p>
        </section>
      </div>
    }>
      <TodayPageContent />
    </Suspense>
  );
}
