"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImportCsv } from "@/components/ImportCsv";
import { QuickBirthdayEntry } from "@/components/QuickBirthdayEntry";
import type { BirthdayPersonInput } from "@/lib/quickBirthdayParser";
import type { BirthdayPerson } from "@/lib/types";

type View = "menu" | "quick" | "csv";

type AddBirthdayEntryModalProps = {
  open: boolean;
  onClose: () => void;
  returnTo: string;
  onQuickImport: (valid: BirthdayPersonInput[]) => Promise<void>;
  onCsvImport: (people: BirthdayPerson[]) => Promise<void>;
};

export function AddBirthdayEntryModal({
  open,
  onClose,
  returnTo,
  onQuickImport,
  onCsvImport
}: AddBirthdayEntryModalProps) {
  const [view, setView] = useState<View>("menu");

  useEffect(() => {
    if (open) setView("menu");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view !== "menu") setView("menu");
        else onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, view, onClose]);

  if (!open) return null;

  async function handleQuickImport(valid: BirthdayPersonInput[]) {
    await onQuickImport(valid);
    onClose();
  }

  async function handleCsvImport(people: BirthdayPerson[]) {
    await onCsvImport(people);
    onClose();
  }

  function goBack() {
    setView("menu");
  }

  return (
    <div
      className="ui-overlay-backdrop fixed inset-0 z-30 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-birthday-modal-title"
    >
      <div className="ui-modal-surface w-full max-w-lg border p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={view === "menu" ? onClose : goBack}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={view === "menu" ? "Fechar" : "Voltar"}
        >
          <span aria-hidden>{view === "menu" ? "✕" : "←"}</span>
        </button>

        {view === "menu" && (
          <>
            <h2 id="add-birthday-modal-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Adicionar aniversários
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/person?returnTo=${encodeURIComponent(returnTo)}`}
                className="ui-cta-primary inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Adicionar pessoa
              </Link>
              <button
                type="button"
                onClick={() => setView("quick")}
                className="ui-cta-secondary inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Colar vários de uma vez
              </button>
              <button
                type="button"
                onClick={() => setView("csv")}
                className="ui-cta-secondary inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Importar CSV
              </button>
            </div>
          </>
        )}

        {view === "quick" && (
          <>
            <h2 id="add-birthday-modal-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Colar vários de uma vez
            </h2>
            <div className="mt-4">
              <QuickBirthdayEntry onImport={handleQuickImport} />
            </div>
          </>
        )}

        {view === "csv" && (
          <>
            <h2 id="add-birthday-modal-title" className="pr-8 text-lg font-semibold tracking-tight text-text">
              Importar CSV
            </h2>
            <div className="mt-4">
              <ImportCsv onImport={handleCsvImport} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
