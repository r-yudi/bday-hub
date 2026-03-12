"use client";

import { useState } from "react";
import { parseQuickBirthdayLines, type BirthdayPersonInput, type QuickParseInvalid } from "@/lib/quickBirthdayParser";

type QuickBirthdayEntryProps = {
  onImport: (valid: BirthdayPersonInput[]) => Promise<void>;
};

type Feedback = {
  imported: number;
  invalid: number;
  invalidLines: QuickParseInvalid[];
};

const EXAMPLE_LINES = "Maria 12/03\nJoão 18/06\nAna 7/9";

export function QuickBirthdayEntry({ onImport }: QuickBirthdayEntryProps) {
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleImport() {
    const { valid, invalid } = parseQuickBirthdayLines(text);
    if (valid.length === 0 && invalid.length === 0) return;

    setImporting(true);
    setFeedback(null);
    try {
      if (valid.length > 0) {
        await onImport(valid);
      }
      setFeedback({ imported: valid.length, invalid: invalid.length, invalidLines: invalid });
      setText("");
    } finally {
      setImporting(false);
    }
  }

  const { valid } = parseQuickBirthdayLines(text);
  const canImport = valid.length > 0 && !importing;

  return (
    <div className="ui-panel rounded-2xl border border-border/80 bg-surface/50 p-4 sm:p-5">
      <p className="text-sm font-medium text-text">
        Colar vários de uma vez
      </p>
      <p className="mt-1 text-sm text-muted">
        Uma linha por pessoa: <strong className="font-medium text-text">Nome DD/MM</strong>. Dia e mês podem ser 1 ou 2 dígitos.
      </p>
      <div className="ui-callout mt-3 rounded-xl border border-border/80 bg-surface2/40 px-3 py-2">
        <p className="text-xs font-medium text-muted">Exemplo</p>
        <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-text" aria-hidden>
          {EXAMPLE_LINES}
        </pre>
      </div>
      <label className="sr-only" htmlFor="quick-birthday-textarea">
        Linhas no formato Nome DD/MM
      </label>
      <textarea
        id="quick-birthday-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE_LINES}
        rows={4}
        className="ui-focus-surface mt-3 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-describedby={feedback ? "quick-entry-feedback" : undefined}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={!canImport}
          className="ui-cta-primary inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none"
        >
          {importing ? "Importando…" : "Importar aniversários"}
        </button>
        {feedback && (
          <div id="quick-entry-feedback" className="min-w-0" role="status">
            {feedback.imported > 0 && (
              <p className="text-sm text-success">
                {feedback.imported} importado{feedback.imported !== 1 ? "s" : ""} com sucesso.
              </p>
            )}
            {feedback.invalid > 0 && (
              <p className="text-sm text-warning">
                {feedback.invalid} linha{feedback.invalid !== 1 ? "s" : ""} inválida{feedback.invalid !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
        )}
      </div>
      {feedback && feedback.invalidLines.length > 0 && (
        <details className="ui-disclosure mt-3 rounded-xl border border-border/80 bg-surface/50 px-3 py-2">
          <summary className="ui-disclosure-summary cursor-pointer text-xs font-medium text-muted">
            Ver linhas ignoradas
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {feedback.invalidLines.slice(0, 10).map((item) => (
              <li key={`${item.lineNumber}-${item.line}`}>
                Linha {item.lineNumber}: <span className="font-mono text-danger/90">{item.line || "(vazia)"}</span>
              </li>
            ))}
            {feedback.invalidLines.length > 10 && (
              <li className="text-muted">… e mais {feedback.invalidLines.length - 10}</li>
            )}
          </ul>
        </details>
      )}
    </div>
  );
}
