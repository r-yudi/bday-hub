/**
 * Timezone-aware date utilities.
 *
 * Uses Intl.DateTimeFormat to resolve the local calendar date
 * in any IANA timezone — no external dependencies.
 */

const FALLBACK_TZ = "America/Sao_Paulo";

/**
 * Returns the calendar date key (YYYY-MM-DD) for `date` in the given
 * IANA `timezone`. Falls back to America/Sao_Paulo on invalid zone.
 */
export function getDateKey(date: Date, timezone: string): string {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = fmt(timezone).formatToParts(date);
  } catch {
    parts = fmt(FALLBACK_TZ).formatToParts(date);
  }

  const v = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${v("year")}-${v("month")}-${v("day")}`;
}

/**
 * Adds calendar days to a date key (YYYY-MM-DD). DST-safe: uses calendar arithmetic only.
 * Example: addDaysToDateKey("2026-03-31", 1) => "2026-04-01"
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = dateKey.split("-").map(Number);
  const [y, m, d] = parts;
  if (parts.length !== 3 || !Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return dateKey;
  }
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
