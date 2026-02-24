export function normalizeNfc(value: string): string {
  return value.normalize("NFC");
}

export function normalizeMaybeString(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  return normalizeNfc(value);
}

export function normalizeRecordStrings<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string") {
      (next as Record<string, unknown>)[key] = normalizeNfc(value);
    }
  }
  return next;
}

export function looksLikeMojibake(text: string): boolean {
  if (!text) return false;
  const suspiciousMatches = text.match(/Ã.|Â.|�/g) ?? [];
  const suspiciousCount = suspiciousMatches.length;
  if (suspiciousCount === 0) return false;

  // Heurística simples: padrões típicos de UTF-8 lido como Latin1 aparecem repetidamente.
  const commonPortugueseBroken = /(ParabÃ©ns|aniversÃ¡rio|nÃ£o|VocÃª|mÃªs|invÃ¡lido|sessÃ£o)/i.test(text);
  return commonPortugueseBroken || suspiciousCount >= 2;
}
