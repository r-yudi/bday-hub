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
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="ui-title-editorial text-3xl sm:text-[2.15rem]">
            {id ? "Editar pessoa" : "Adicionar pessoa"}
          </h1>
          <p className="ui-subtitle-editorial mt-2 text-sm sm:text-[15px]">Preencha com calma. Você pode ajustar depois.</p>
        </div>
        <Link
          href="/today"
          className="ui-cta-secondary inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium focus-visible:outline-none"
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
