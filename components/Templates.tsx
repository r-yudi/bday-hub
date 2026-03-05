"use client";

import { useState } from "react";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

export const getMessageTemplates = (person: BirthdayPerson): string[] => {
  const name = normalizeNfc(person.name);
  return [
    `Parabéns, ${name}! Que seu dia seja incrível 🎉`,
    `Feliz aniversário, ${name}! Muita saúde e alegria!`,
    `${name}, feliz aniversário! Tudo de melhor hoje e sempre!`
  ];
};

export function Templates({ person }: { person: BirthdayPerson }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const templates = getMessageTemplates(person);

  async function copyText(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      window.setTimeout(() => setCopiedIndex(null), 1200);
    } catch {
      window.alert("Não foi possível copiar a mensagem.");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Mais mensagens</p>
      <div className="space-y-2">
        {templates.map((template, idx) => (
          <button
            key={template}
            type="button"
            onClick={() => void copyText(template, idx)}
            className="ui-surface ui-border-subtle w-full rounded-xl border px-3 py-2 text-left text-sm text-text shadow-sm hover:-translate-y-px hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            title={template}
          >
            <span className="line-clamp-2 text-muted">{template}</span>
            {copiedIndex === idx && <span className="ml-2 text-xs text-accent">Mensagem copiada ✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
