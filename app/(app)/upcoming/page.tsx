"use client";

import { useEffect, useMemo, useState } from "react";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { UpcomingListItem } from "@/components/upcoming/UpcomingListItem";
import { getUpcomingPeople } from "@/lib/dates";
import { deleteBirthday, listBirthdays } from "@/lib/birthdaysRepo";
import type { BirthdayPerson } from "@/lib/types";

export default function UpcomingPage() {
  const [mounted, setMounted] = useState(false);
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      setPeople(await listBirthdays());
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

  const upcoming = useMemo(() => getUpcomingPeople(people), [people]);

  return (
    <div className="ui-container" data-page-canonical="upcoming">
      {!loading && <OnboardingBanner count={people.length} mounted={mounted} />}

      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-2xl p-6 sm:p-8">
          <header className="ui-section-header">
            <p className="ui-eyebrow">Agenda</p>
            <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">Próximos 7 dias</h1>
            <p className="ui-subtitle-editorial text-sm sm:text-[15px]">
              Inclui hoje e considera virada de ano. Toque no nome para editar.
            </p>
          </header>

          <div className="ui-stack-lg mt-8">
            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : upcoming.length === 0 ? (
              <div className="ui-empty-hero">
                <div className="ui-empty-icon" aria-hidden>
                  📅
                </div>
                <h2 className="ui-empty-title">Nada nesta semana</h2>
                <p className="ui-empty-subtitle">Nenhum aniversário nos próximos 7 dias.</p>
              </div>
            ) : (
              <ul className="ui-list m-0 list-none p-0">
                {upcoming.map((person) => (
                  <UpcomingListItem
                    key={person.id}
                    person={person}
                    relativeDays={person.daysUntil}
                    onDelete={async (id) => {
                      await deleteBirthday(id);
                      await loadData();
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
