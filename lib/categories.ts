import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

export const PREDEFINED_CATEGORIES = [
  "Família",
  "Amigos",
  "Colegas",
  "Trabalho",
  "Escola",
  "Faculdade",
  "Curso",
  "Outros"
] as const;

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeCategoryName(value: string) {
  return normalizeNfc(value)
    .replace(/\s+/g, " ")
    .trim();
}

export function toCategoryArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === "string" ? item.split(/[;,|]/) : []))
      .map((item) => normalizeCategoryName(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[;,|]/)
      .map((item) => normalizeCategoryName(item))
      .filter(Boolean);
  }

  return [];
}

export function normalizeCategory(label: string): string {
  return stripDiacritics(normalizeCategoryName(label))
    .toLocaleLowerCase("pt-BR")
    .replace(/[._/\\-]+/g, " ")
    .replace(/[()\[\]{}'"´`~^!?;:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeCategoryNames(values: Array<string | undefined | null>) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const pretty = normalizeCategoryName(value);
    if (!pretty) continue;
    const key = normalizeCategory(pretty);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(pretty);
  }

  return out;
}

export function normalizeCategoryNames(values: Array<string | undefined | null>) {
  return dedupeCategoryNames(values);
}

export function extractCategoriesFromPerson(person: Partial<BirthdayPerson> & { category?: unknown; tags?: unknown; categories?: unknown }) {
  return dedupeCategoryNames([
    ...toCategoryArray(person.categories as string[] | string | null | undefined),
    ...toCategoryArray(person.tags as string[] | string | null | undefined),
    ...toCategoryArray(person.category as string | string[] | null | undefined)
  ]);
}

export function birthdayCategoriesFromAny(input: {
  categories?: unknown;
  category?: unknown;
  tags?: unknown;
}) {
  return extractCategoriesFromPerson(input as Partial<BirthdayPerson> & { category?: unknown; tags?: unknown; categories?: unknown });
}

export function buildCategoryIndex(labels: string[]) {
  const index = new Map<string, string>();
  for (const label of labels) {
    const pretty = normalizeCategoryName(label);
    if (!pretty) continue;
    const key = normalizeCategory(pretty);
    if (!key) continue;
    if (!index.has(key)) {
      index.set(key, pretty);
    }
  }
  return index;
}

export function mergeSuggestions(
  defaultCategories: ReadonlyArray<string>,
  fromPersons: ReadonlyArray<string>,
  fromUserCategories?: ReadonlyArray<string>
) {
  const merged = dedupeCategoryNames([...defaultCategories, ...fromPersons, ...(fromUserCategories ?? [])]);
  return merged.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}

export function levenshteinDistance(aRaw: string, bRaw: string) {
  const a = normalizeCategory(aRaw);
  const b = normalizeCategory(bRaw);
  if (!a) return b.length;
  if (!b) return a.length;
  if (a === b) return 0;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

export function findCloseCategorySuggestion(input: string, labels: string[]): string | null {
  const normalizedInput = normalizeCategory(input);
  if (!normalizedInput) return null;

  const index = buildCategoryIndex(labels);
  if (index.has(normalizedInput)) {
    return index.get(normalizedInput) ?? null;
  }

  let best: { label: string; distance: number } | null = null;
  for (const label of index.values()) {
    const distance = levenshteinDistance(normalizedInput, label);
    const maxDistance = normalizedInput.length <= 5 ? 1 : 2;
    if (distance > maxDistance) continue;
    if (!best || distance < best.distance) {
      best = { label, distance };
    }
  }

  return best?.label ?? null;
}
