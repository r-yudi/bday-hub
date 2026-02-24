import { normalizeNfc } from "@/lib/text";

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

export function normalizeCategoryName(value: string) {
  return normalizeNfc(value)
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeCategoryNames(values: Array<string | undefined | null>) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeCategoryName(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}

export function normalizeCategoryNames(values: Array<string | undefined | null>) {
  return dedupeCategoryNames(values);
}

export function birthdayCategoriesFromAny(input: {
  categories?: unknown;
  category?: unknown;
  tags?: unknown;
}) {
  const fromCategories = Array.isArray(input.categories)
    ? input.categories.filter((value): value is string => typeof value === "string")
    : [];
  const fromTags = Array.isArray(input.tags) ? input.tags.filter((value): value is string => typeof value === "string") : [];
  const fromCategory = typeof input.category === "string" ? [input.category] : [];
  return dedupeCategoryNames([...fromCategories, ...fromTags, ...fromCategory]);
}
