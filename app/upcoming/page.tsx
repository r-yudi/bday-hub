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
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">Próximos 7 dias</h1>
        <p className="text-sm text-black/70">Inclui hoje e considera virada de ano.</p>
      </section>

      {!loading && <OnboardingBanner count={people.length} mounted={mounted} />}

      {loading ? (
        <p className="text-sm text-black/60">Carregando...</p>
      ) : upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-6 text-sm text-black/70">
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
