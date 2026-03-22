import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

/**
 * Mensagem sugerida para o dia do aniversário (V1).
 * Sem notes → frase fixa. Com notes → primeira linha + sufixo fixo (sem parsing extra).
 */
export function getTodaySuggestedMessage(person: Pick<BirthdayPerson, "notes">): string {
  const raw = person.notes?.trim() ?? "";
  if (!raw) {
    return "Feliz aniversário! 🎉";
  }

  const normalized = normalizeNfc(raw);
  const firstLine = normalized.split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) {
    return "Feliz aniversário! 🎉";
  }

  return `${firstLine}, feliz aniversário!! 🎉`;
}
