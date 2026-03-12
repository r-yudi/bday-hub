import { isValidDayMonth } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";

/** One line parsed as "Name DD/MM" or "Name D/M" */
export type BirthdayPersonInput = {
  name: string;
  day: number;
  month: number;
};

export type QuickParseInvalid = {
  lineNumber: number;
  line: string;
};

export type QuickParseResult = {
  valid: BirthdayPersonInput[];
  invalid: QuickParseInvalid[];
};

const LINE_REGEX = /^(.+)\s(\d{1,2})\/(\d{1,2})$/;

/**
 * Parses multiline text where each line is "Name DD/MM" or "Name D/M".
 * Uses strict format; empty lines are skipped.
 */
export function parseQuickBirthdayLines(text: string): QuickParseResult {
  const valid: BirthdayPersonInput[] = [];
  const invalid: QuickParseInvalid[] = [];

  const normalized = normalizeNfc(text);
  const lines = normalized.split(/\r?\n/).map((line) => line.trimEnd());

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNumber = i + 1;

    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const match = trimmed.match(LINE_REGEX);
    if (!match) {
      invalid.push({ lineNumber, line: trimmed });
      continue;
    }

    const name = normalizeNfc(match[1].trim());
    const day = parseInt(match[2], 10);
    const month = parseInt(match[3], 10);

    if (!name) {
      invalid.push({ lineNumber, line: trimmed });
      continue;
    }
    if (!isValidDayMonth(day, month)) {
      invalid.push({ lineNumber, line: trimmed });
      continue;
    }

    valid.push({ name, day, month });
  }

  return { valid, invalid };
}
