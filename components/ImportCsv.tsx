"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
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
    <Card variant="elevated" className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer">
          <span className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accentForeground shadow-sm transition-all duration-150 ease-brand hover:-translate-y-px hover:shadow-md hover:brightness-95">
            Selecionar CSV
          </span>
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

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Chip as="span" variant="warning">Obrigatório</Chip>
          <span className="text-muted">
            Cabeçalho: <code className="rounded bg-surface2 px-1.5 py-0.5 text-[11px] sm:text-xs">name,day,month</code>
          </span>
          <Chip as="span" variant="subtle">Opcional</Chip>
          <span className="text-muted">
            <code className="rounded bg-surface2 px-1.5 py-0.5 text-[11px] sm:text-xs">tags, whatsapp, instagram, notes</code>
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        A coluna <code className="rounded bg-surface2 px-1 py-0.5">tags</code> vira categorias e aceita vírgula, ponto e vírgula ou pipe.
      </p>

      {parsed && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <Chip as="span" variant="accent">Válidas: {parsed.valid.length}</Chip>
            <Chip as="span" variant="danger">Inválidas: {parsed.invalid.length}</Chip>
          </div>

          {parsed.warnings.length > 0 && (
            <Alert variant="warning" className="text-sm">
              {parsed.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </Alert>
          )}

          {parsed.valid.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-2 text-sm font-medium text-text">Prévia (válidas)</p>
              <ul className="space-y-1 text-sm text-muted">
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
            <div className="rounded-xl border border-danger/25 bg-danger/10 p-3">
              <p className="mb-2 text-sm font-medium text-danger">Linhas inválidas</p>
              <ul className="space-y-1 text-sm text-danger">
                {parsed.invalid.slice(0, 8).map((row) => (
                  <li key={row.rowNumber}>
                    Linha {row.rowNumber}: {row.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            disabled={parsed.valid.length === 0 || importing}
            onClick={() => void handleImport()}
            loading={importing}
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </div>
      )}
    </Card>
  );
}
