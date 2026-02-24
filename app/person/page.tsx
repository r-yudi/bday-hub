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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">{id ? "Editar pessoa" : "Adicionar pessoa"}</h1>
          <p className="text-sm text-black/70">Cadastro manual de aniversário.</p>
        </div>
        <Link href="/today" className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          Voltar
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-black/60">Carregando...</p>
      ) : id && !initialPerson ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
    <Suspense fallback={<p className="text-sm text-black/60">Carregando...</p>}>
      <PersonPageContent />
    </Suspense>
  );
}
