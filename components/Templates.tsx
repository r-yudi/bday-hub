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
      <p className="text-xs font-medium uppercase tracking-wide text-black/60">Mais mensagens</p>
      <div className="space-y-2">
        {templates.map((template, idx) => (
          <button
            key={template}
            type="button"
            onClick={() => void copyText(template, idx)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-sm hover:border-black/20"
            title={template}
          >
            <span className="line-clamp-2">{template}</span>
            {copiedIndex === idx && <span className="ml-2 text-xs text-accent">Mensagem copiada ✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
