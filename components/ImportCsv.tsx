"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { decodeCsvBytes } from "@/lib/csv-file";
import { parseBirthdayCsv } from "@/lib/csv";
import type { BirthdayPerson } from "@/lib/types";

type ImportCsvProps = {
  onImport: (people: BirthdayPerson[]) => Promise<void> | void;
  /** When true, omits large page-style title (parent already provides context). */
  embedded?: boolean;
};

export function ImportCsv({ onImport, embedded = false }: ImportCsvProps) {
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

  const mono = "rounded-md border border-border/70 bg-surface2/40 px-1.5 py-0.5 font-mono text-[11px] text-text sm:text-xs";

  return (
    <div className="space-y-6">
      {!embedded && (
        <header className="ui-section-header">
          <p className="ui-eyebrow">Dados</p>
          <h2 className="ui-title-editorial text-2xl sm:text-[1.65rem]">Importar CSV</h2>
          <p className="ui-subtitle-editorial max-w-[68ch] text-sm">
            Um arquivo por vez. Linhas válidas entram na lista; inválidas são listadas para correção.
          </p>
        </header>
      )}

      <div className="rounded-2xl border border-dashed border-border/90 bg-surface2/20 px-4 py-8 text-center transition-colors hover:border-border sm:px-6">
        <label className="inline-flex cursor-pointer flex-col items-center gap-3">
          <span className="ui-cta-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium shadow-sm">
            Escolher arquivo .csv
          </span>
          <span className="max-w-[42ch] text-xs leading-relaxed text-muted">
            UTF-8 ou Latin-1. Colunas obrigatórias no cabeçalho:{" "}
            <span className={mono}>name, day, month</span>
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      </div>

      <div className="ui-callout rounded-xl border border-border/60 px-4 py-3 text-sm text-muted">
        <p>
          <span className="font-medium text-text">Opcional:</span>{" "}
          <span className={mono}>tags</span>, <span className={mono}>whatsapp</span>,{" "}
          <span className={mono}>instagram</span>, <span className={mono}>notes</span>. Em{" "}
          <span className={mono}>tags</span>, use vírgula, ponto e vírgula ou pipe para várias categorias.
        </p>
      </div>

      {parsed && (
        <div className="space-y-5 border-t border-border/50 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Chip as="span" variant="accent" className="ui-chip">
              Válidas: {parsed.valid.length}
            </Chip>
            <Chip as="span" variant="danger" className="ui-chip">
              Inválidas: {parsed.invalid.length}
            </Chip>
            {parsed.valid.length > 0 && parsed.invalid.length === 0 && (
              <span className="text-muted">Pronto para importar.</span>
            )}
            {parsed.valid.length === 0 && (
              <span className="text-muted">Ajuste o arquivo e envie de novo.</span>
            )}
          </div>

          {parsed.warnings.length > 0 && (
            <Alert variant="warning" className="text-sm">
              {parsed.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </Alert>
          )}

          {parsed.valid.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Pré-visualização</p>
              <ul className="divide-y divide-border/50 rounded-xl border border-border/60">
                {parsed.valid.slice(0, 8).map((row, idx) => (
                  <li key={`${row.name}-${idx}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-3 py-2.5 text-sm">
                    <span className="font-medium text-text">{row.name}</span>
                    <span className="text-muted">
                      {String(row.day).padStart(2, "0")}/{String(row.month).padStart(2, "0")}
                    </span>
                  </li>
                ))}
                {parsed.valid.length > 8 && (
                  <li className="px-3 py-2.5 text-sm text-muted">… e mais {parsed.valid.length - 8}</li>
                )}
              </ul>
            </div>
          )}

          {parsed.invalid.length > 0 && (
            <Alert variant="danger" className="text-sm">
              <p className="mb-2 font-medium">Linhas com erro</p>
              <ul className="space-y-1.5">
                {parsed.invalid.slice(0, 8).map((row) => (
                  <li key={row.rowNumber}>
                    Linha {row.rowNumber}: {row.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              disabled={parsed.valid.length === 0 || importing}
              onClick={() => void handleImport()}
              loading={importing}
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              {importing ? "Importando…" : "Importar"}
            </Button>
            {parsed.valid.length > 0 && !importing && (
              <p className="text-xs text-muted sm:max-w-[40ch]">
                Isso adiciona à lista local (e sincroniza se você estiver logado).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
