"use client";

import { useEffect, useMemo, useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
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
    <div className="space-y-7">
      <section className="ui-page-hero p-5 sm:p-6">
        <h1 className="ui-title-editorial text-3xl sm:text-[2rem]">Próximos 7 dias</h1>
        <p className="ui-subtitle-editorial mt-2 text-sm">Inclui hoje e considera virada de ano.</p>
      </section>

      {!loading && <OnboardingBanner count={people.length} mounted={mounted} />}

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : upcoming.length === 0 ? (
        <div className="ui-panel-soft rounded-2xl border border-dashed p-6 text-sm text-muted">
          Nenhum aniversário nos próximos 7 dias.
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              relativeDays={person.daysUntil}
              onDelete={async (id) => {
                await deleteBirthday(id);
                await loadData();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
