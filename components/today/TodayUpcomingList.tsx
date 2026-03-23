import type { BirthdayPerson } from "@/lib/types";
import { normalizeNfc } from "@/lib/text";
import { formatUpcomingShortDayMonth } from "./todayPageFormatters";

export type UpcomingPersonRow = BirthdayPerson & { daysUntil: number };

type TodayUpcomingListProps = {
  people: UpcomingPersonRow[];
};

export function TodayUpcomingList({ people }: TodayUpcomingListProps) {
  return (
    <ul className="ui-list list-none p-0">
      {people.map((person) => (
        <li key={person.id} className="ui-list-item flex flex-wrap items-center gap-3">
          <span className="ui-chip inline-flex min-w-[2.25rem] shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums">
            {person.daysUntil}d
          </span>
          <span className="min-w-0 flex-1 font-medium text-text">{normalizeNfc(person.name)}</span>
          <span className="shrink-0 text-sm text-muted tabular-nums">
            {formatUpcomingShortDayMonth(person.day, person.month)}
          </span>
        </li>
      ))}
    </ul>
  );
}
