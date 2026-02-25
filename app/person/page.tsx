"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonForm } from "@/components/PersonForm";
import { deleteBirthday, getBirthdayById, upsertBirthday } from "@/lib/birthdaysRepo";
import { queueBirthdayAddedToast } from "@/lib/onboarding-ui";
import type { BirthdayPerson } from "@/lib/types";

function PersonPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [initialPerson, setInitialPerson] = useState<BirthdayPerson | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setInitialPerson(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void getBirthdayById(id).then((person) => {
      if (cancelled) return;
      setInitialPerson(person);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(person: BirthdayPerson) {
    const isNewPerson = !id;
    await upsertBirthday(person);
    if (isNewPerson) {
      queueBirthdayAddedToast();
    }
    router.push("/today");
  }

  async function handleDelete(personId: string) {
    const confirmed = window.confirm("Excluir este aniversário?");
    if (!confirmed) return;
    await deleteBirthday(personId);
    router.push("/today");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-[2rem]">
            {id ? "Editar pessoa" : "Adicionar pessoa"}
          </h1>
          <p className="text-sm text-muted">Preencha com calma. Você pode ajustar depois.</p>
        </div>
        <Link
          href="/today"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border/90 bg-surface2/80 px-4 text-sm font-medium text-text shadow-sm transition-all duration-150 ease-brand hover:-translate-y-px hover:border-border hover:bg-surface2 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/25 focus-visible:ring-2 focus-visible:ring-primary/45"
        >
          Voltar
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : id && !initialPerson ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-text">
          Pessoa não encontrada.
        </div>
      ) : (
        <PersonForm initialPerson={initialPerson} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
      <PersonPageContent />
    </Suspense>
  );
}
