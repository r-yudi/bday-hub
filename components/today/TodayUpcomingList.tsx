import type { BirthdayPerson } from "@/lib/types";
import { normalizeNfc } from "@/lib/text";
import { emojiForPersonId } from "@/lib/personListEmoji";
import { formatUpcomingShortDayMonth } from "./todayPageFormatters";

export type UpcomingPersonRow = BirthdayPerson & { daysUntil: number };

type TodayUpcomingListProps = {
  people: UpcomingPersonRow[];
};

export function TodayUpcomingList({ people }: TodayUpcomingListProps) {
  return (
    <ul className="m-0 list-none divide-y divide-border/20 p-0 dark:divide-white/[0.08]">
      {people.map((person) => (
        <li
          key={person.id}
          className="flex flex-nowrap items-center gap-2 px-0.5 py-2 sm:gap-2.5 sm:py-2"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center text-[13px] leading-none opacity-95 sm:h-7 sm:w-7 sm:text-[14px]"
            aria-hidden
          >
            {emojiForPersonId(person.id)}
          </span>
          <span className="min-w-0 flex-1 text-[12px] font-medium leading-tight text-text [overflow-wrap:anywhere]">
            {normalizeNfc(person.name)}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted sm:text-xs">
            {formatUpcomingShortDayMonth(person.day, person.month)}
          </span>
          <span className="inline-flex min-w-[1.875rem] shrink-0 items-center justify-center rounded-md border border-border/55 bg-surface2/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-text dark:border-border/45 dark:bg-white/[0.08] dark:text-text/95 sm:min-w-[2.125rem] sm:text-[11px]">
            {person.daysUntil}d
          </span>
        </li>
      ))}
    </ul>
  );
}
