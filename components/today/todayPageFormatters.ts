/** pt-BR date line for /today page eyebrow (e.g. "TERÇA, 4 MAR"). */
export function formatTodayPageDateEyebrow(now = new Date()): string {
  const weekdayLong = now.toLocaleDateString("pt-BR", { weekday: "long" });
  const weekday = (weekdayLong.split("-")[0] ?? weekdayLong).trim();
  const day = now.getDate();
  const monthRaw = now.toLocaleDateString("pt-BR", { month: "short" });
  const month = monthRaw.replace(/\./g, "").trim();
  return `${weekday.toUpperCase()}, ${day} ${month.toUpperCase()}`;
}

/** Compact upcoming date (e.g. "7 mar") for the "Em breve" list. */
export function formatUpcomingShortDayMonth(day: number, month: number): string {
  const d = new Date(new Date().getFullYear(), month - 1, day);
  const mo = d
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(/\./g, "")
    .trim();
  return `${day} ${mo}`;
}
