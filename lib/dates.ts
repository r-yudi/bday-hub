import type { BirthdayPerson } from "@/lib/types";

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(month: number, year = new Date().getFullYear()): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function isValidDayMonth(day: number, month: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(month, 2024); // allow Feb 29 in MVP
}

export function formatDayMonth(day: number, month: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export function todayParts(now = new Date()): { day: number; month: number; iso: string } {
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const iso = `${now.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { day, month, iso };
}

export function personMatchesToday(person: BirthdayPerson, now = new Date()): boolean {
  const { day, month } = todayParts(now);
  return person.day === day && person.month === month;
}

export function nextOccurrenceDate(person: Pick<BirthdayPerson, "day" | "month">, base = new Date()): Date {
  const currentYear = base.getFullYear();
  const candidate = new Date(currentYear, person.month - 1, person.day);

  if (
    candidate.getMonth() !== person.month - 1 ||
    candidate.getDate() !== person.day
  ) {
    // Invalid in this specific year (e.g., Feb 29 in non-leap year) -> clamp to Feb 29 semantics via Mar 1 is not desired.
    // In MVP, treat Feb 29 as Feb 29 and next occurrence in next leap year.
    if (person.month === 2 && person.day === 29) {
      let y = currentYear;
      while (!isLeapYear(y) || new Date(y, 1, 29).getDate() !== 29) {
        y += 1;
      }
      return new Date(y, 1, 29);
    }
  }

  if (candidate < startOfDay(base)) {
    const next = new Date(currentYear + 1, person.month - 1, person.day);
    if (person.month === 2 && person.day === 29 && next.getDate() !== 29) {
      let y = currentYear + 1;
      while (!isLeapYear(y)) y += 1;
      return new Date(y, 1, 29);
    }
    return next;
  }
  return candidate;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function diffDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function getTodayPeople(people: BirthdayPerson[], now = new Date()): BirthdayPerson[] {
  return people
    .filter((p) => personMatchesToday(p, now))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function getUpcomingPeople(
  people: BirthdayPerson[],
  now = new Date(),
  horizonDays = 7
): Array<BirthdayPerson & { daysUntil: number }> {
  return people
    .map((person) => {
      const nextDate = nextOccurrenceDate(person, now);
      return { ...person, daysUntil: diffDays(nextDate, now) };
    })
    .filter((person) => person.daysUntil >= 0 && person.daysUntil <= horizonDays)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.name.localeCompare(b.name, "pt-BR");
    });
}

export function formatRelativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `em ${daysUntil} dias`;
}
