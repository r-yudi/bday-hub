"use client";

import { useEffect, useMemo, useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import { getUpcomingPeople } from "@/lib/dates";
import { deletePerson, listPeople } from "@/lib/storage";
import type { BirthdayPerson } from "@/lib/types";

export default function UpcomingPage() {
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      setPeople(await listPeople());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const upcoming = useMemo(() => getUpcomingPeople(people), [people]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Próximos 7 dias</h1>
        <p className="text-sm text-black/70">Inclui hoje e considera virada de ano.</p>
      </section>

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
                await deletePerson(id);
                await loadData();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
