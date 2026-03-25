"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddBirthdayEntryModal } from "@/components/AddBirthdayEntryModal";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { AppToast } from "@/components/AppToast";
import { TodayListItem } from "@/components/today/TodayListItem";
import { TodayUpcomingList } from "@/components/today/TodayUpcomingList";
import { formatTodayPageDateEyebrow } from "@/components/today/todayPageFormatters";
import { getTodayPeople, getUpcomingPeople } from "@/lib/dates";
import { importCsvBirthdays, listBirthdays } from "@/lib/birthdaysRepo";
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
    const imported: BirthdayPerson[] = valid.map((row, idx) => ({
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
    await importCsvBirthdays(imported);
    await loadData();
    queueBirthdayAddedToast();
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
      <div className="ui-container space-y-6" data-page-canonical="today">
        <section className="ui-section ui-panel-soft rounded-2xl border p-6">
          <p className="text-sm font-medium text-danger">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="ui-cta-secondary ui-focus-surface mt-3 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline-none"
          >
            Tentar de novo
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="ui-container" data-page-canonical="today">
        {!loading && mounted && (
          <Suspense fallback={null}>
            <OnboardingGate
              peopleCount={people.length}
              mounted={mounted}
              onOpenAddModal={onOpenAddModal}
            />
          </Suspense>
        )}

        {!loading && <OnboardingBanner count={people.length} mounted={mounted} returnTo={returnTo} />}

        <section className="ui-section">
          <div className="ui-panel mx-auto w-full max-w-2xl p-6 sm:p-8">
            <header className="ui-section-header">
              <p className="ui-eyebrow">{formatTodayPageDateEyebrow(new Date())}</p>
              <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Aniversários 🎂</h1>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="ui-cta-primary ui-focus-surface inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium focus-visible:outline-none"
                >
                  Adicionar aniversário
                </button>
              </div>
            </header>

            <div className="ui-stack-lg mt-8">
              {loading ? (
                <p className="text-sm text-muted">Carregando...</p>
              ) : people.length === 0 ? (
                <div className="ui-empty-hero">
                  <div className="ui-empty-icon" aria-hidden>
                    🎂
                  </div>
                  <h2 className="ui-empty-title">Ninguém faz aniversário hoje</h2>
                  <p className="ui-empty-subtitle">Adicione pessoas importantes para não esquecer</p>
                  <div className="ui-empty-actions">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="ui-cta-primary ui-focus-surface inline-flex h-11 min-w-[11rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold focus-visible:outline-none"
                    >
                      Adicionar aniversário
                    </button>
                  </div>
                  <p className="mt-3 text-center text-sm text-muted">ou cole vários de uma vez</p>
                </div>
              ) : (
                <>
                  <section
                    className="today-page-birthday-sheet ui-panel-soft rounded-2xl border p-3 sm:p-5"
                    aria-labelledby="today-section-title upcoming-section-title"
                  >
                    <h2 id="today-section-title" className="ui-feature-title text-text">
                      Hoje
                    </h2>
                    {todayPeople.length === 0 ? (
                      <div className="ui-empty-hero mt-3 sm:mt-4">
                        <div className="ui-empty-icon" aria-hidden>
                          🎈
                        </div>
                        <h3 className="ui-empty-title">Ninguém faz aniversário hoje</h3>
                        <p className="ui-empty-subtitle">Adicione pessoas importantes para não esquecer</p>
                        <div className="ui-empty-actions">
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="ui-cta-primary ui-focus-surface inline-flex h-11 min-w-[11rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold focus-visible:outline-none"
                          >
                            Adicionar aniversário
                          </button>
                        </div>
                        <p className="mt-3 text-center text-sm text-muted">
                          <Link href="/people" className="ui-link-tertiary">
                            Ver todas as pessoas
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <ul className="m-0 mt-2 list-none divide-y divide-border/20 p-0 dark:divide-white/[0.08] sm:mt-3">
                        {todayPeople.map((person) => (
                          <TodayListItem key={person.id} person={person} onToast={setToast} />
                        ))}
                      </ul>
                    )}

                    <h2
                      id="upcoming-section-title"
                      className="ui-feature-title today-page-em-breve-title mt-5 text-text sm:mt-6"
                    >
                      Em breve
                    </h2>
                    {upcomingPeople.length === 0 ? (
                      <div className="mt-3">
                        <p className="text-sm text-muted">
                          Nada nos próximos dias. Adicione pessoas para o Lembra te ajudar.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddModal(true)}
                          className="ui-cta-secondary ui-focus-surface mt-3 inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
                        >
                          Adicionar aniversário
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 sm:mt-3">
                        <TodayUpcomingList people={upcomingPeople} />
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </section>
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
    <Suspense
      fallback={
        <div className="ui-container" data-page-canonical="today">
          <section className="ui-section">
            <div className="ui-panel mx-auto w-full max-w-2xl p-8">
              <p className="text-sm text-muted">Carregando...</p>
            </div>
          </section>
        </div>
      }
    >
      <TodayPageContent />
    </Suspense>
  );
}
