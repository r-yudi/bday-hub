"use client";

import { useState } from "react";
import { decodeCsvBytes } from "@/lib/csv-file";
import { parseBirthdayCsv } from "@/lib/csv";
import type { BirthdayPerson } from "@/lib/types";

type ImportCsvProps = {
  onImport: (people: BirthdayPerson[]) => Promise<void> | void;
};

export function ImportCsv({ onImport }: ImportCsvProps) {
  const [rawText, setRawText] = useState("");
  const parsed = rawText ? parseBirthdayCsv(rawText) : null;
  const [importing, setImporting] = useState(false);

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    const text = decodeCsvBytes(buffer);
    setRawText(text);
  }

  async function handleImport() {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);
    try {
      const now = Date.now();
      const people: BirthdayPerson[] = parsed.valid.map((row, idx) => ({
        ...row,
        id: crypto.randomUUID(),
        createdAt: now + idx,
        updatedAt: now + idx
      }));
      await onImport(people);
      setRawText("");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white/80 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-primary-brand cursor-pointer rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover">
          Selecionar CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        <span className="text-sm text-black/70">
          Header obrigatório: `name,day,month,tags,whatsapp,instagram,notes` (coluna `tags` = categorias)
        </span>
      </div>

      {parsed && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Válidas: {parsed.valid.length}
            </span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
              Inválidas: {parsed.invalid.length}
            </span>
          </div>

          {parsed.warnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {parsed.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {parsed.valid.length > 0 && (
            <div className="rounded-xl border border-black/10 p-3">
              <p className="mb-2 text-sm font-medium">Prévia (válidas)</p>
              <ul className="space-y-1 text-sm text-black/75">
                {parsed.valid.slice(0, 8).map((row, idx) => (
                  <li key={`${row.name}-${idx}`}>
                    {row.name} • {String(row.day).padStart(2, "0")}/{String(row.month).padStart(2, "0")}
                  </li>
                ))}
                {parsed.valid.length > 8 && <li>... e mais {parsed.valid.length - 8}</li>}
              </ul>
            </div>
          )}

          {parsed.invalid.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="mb-2 text-sm font-medium text-rose-800">Linhas inválidas</p>
              <ul className="space-y-1 text-sm text-rose-700">
                {parsed.invalid.slice(0, 8).map((row) => (
                  <li key={row.rowNumber}>
                    Linha {row.rowNumber}: {row.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled={parsed.valid.length === 0 || importing}
            onClick={() => void handleImport()}
            className="btn-primary-brand rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? "Importando..." : "Importar"}
          </button>
        </div>
      )}
    </section>
  );
}
