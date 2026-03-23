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

  const returnTo = searchParams.get("returnTo") || "/today";

  async function handleSave(person: BirthdayPerson) {
    const isNewPerson = !id;
    await upsertBirthday(person);
    if (isNewPerson) {
      queueBirthdayAddedToast();
    }
    router.push(returnTo);
  }

  async function handleDelete(personId: string) {
    const confirmed = window.confirm("Excluir este aniversário?");
    if (!confirmed) return;
    await deleteBirthday(personId);
    router.push(returnTo);
  }

  return (
    <div className="ui-container" data-page-canonical="person">
      <section className="ui-section">
        <div className="ui-panel mx-auto w-full max-w-2xl p-6 sm:p-8">
          <header className="ui-section-header">
            <p className="ui-eyebrow">Cadastro</p>
            <h1 className="ui-title-editorial text-4xl sm:text-[2.45rem]">
              {id ? "Editar pessoa" : "Adicionar pessoa"}
            </h1>
            <p className="ui-subtitle-editorial text-sm sm:text-[15px]">
              Nome, data e categorias em poucos passos. Campos opcionais deixam o Lembra mais útil no dia a dia.
            </p>
            <p className="mt-3">
              <Link href={returnTo} className="ui-link-tertiary text-sm font-medium">
                ← Voltar
              </Link>
            </p>
          </header>

          <div className="ui-stack-lg mt-8">
            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : id && !initialPerson ? (
              <div className="ui-callout rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm text-text">
                <p className="font-medium">Pessoa não encontrada.</p>
                <p className="mt-1 text-muted">Confira o link ou volte à lista.</p>
                <Link href={returnTo} className="ui-link-tertiary mt-3 inline-block text-sm font-medium">
                  Ir para o app
                </Link>
              </div>
            ) : (
              <PersonForm initialPerson={initialPerson} onSave={handleSave} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-container" data-page-canonical="person">
          <section className="ui-section">
            <div className="ui-panel mx-auto w-full max-w-2xl p-8">
              <p className="text-sm text-muted">Carregando...</p>
            </div>
          </section>
        </div>
      }
    >
      <PersonPageContent />
    </Suspense>
  );
}
