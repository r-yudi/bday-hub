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
