import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

const FALLBACK_MESSAGE = "Feliz aniversário! 🎉";
const MAX_NICKNAME_LEN = 48;

const TEMPLATES = [
  (v: string) => `${v}, feliz aniversário! Que seu dia seja leve e especial 🎉`,
  (v: string) => `${v}, parabéns! Te desejo um ano incrível por aí.`,
  (v: string) => `${v}, feliz aniversário! Tudo de mais bonito pra você hoje.`
] as const;

function templateIndexForId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return Math.abs(sum) % TEMPLATES.length;
}

function firstNameFromName(name: string): string {
  const trimmed = normalizeNfc(name).trim();
  if (!trimmed) return "";
  const first = trimmed.split(/\s+/)[0]?.trim() ?? "";
  return first;
}

function normalizedNickname(raw: string | undefined): string {
  const t = raw?.trim() ?? "";
  if (!t || t.length > MAX_NICKNAME_LEN) return "";
  return normalizeNfc(t);
}

/**
 * Mensagem sugerida no dia do aniversário (V2).
 * Usa `nickname` ou primeiro nome de `name`; uma de 3 frases fixas. Não usa `notes`.
 */
export function getTodaySuggestedMessage(person: Pick<BirthdayPerson, "id" | "name" | "nickname">): string {
  const vocative = normalizedNickname(person.nickname) || firstNameFromName(person.name);
  if (!vocative) {
    return FALLBACK_MESSAGE;
  }
  const idx = templateIndexForId(person.id || "");
  return TEMPLATES[idx](vocative);
}
