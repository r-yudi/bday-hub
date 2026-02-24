import { dedupeCategoryNames } from "@/lib/categories";
import { isValidDayMonth } from "@/lib/dates";
import { normalizeNfc } from "@/lib/text";
import type { BirthdayPerson } from "@/lib/types";

export type CsvRowPreview = {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
};

export type ParsedCsvResult = {
  valid: Omit<BirthdayPerson, "id" | "createdAt" | "updatedAt">[];
  invalid: CsvRowPreview[];
  warnings: string[];
};

const REQUIRED_HEADERS = ["name", "day", "month", "tags", "whatsapp", "instagram", "notes"] as const;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((cell) => normalizeNfc(cell.trim()));
}

export function parseBirthdayCsv(text: string): ParsedCsvResult {
  const lines = normalizeNfc(text)
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { valid: [], invalid: [], warnings: ["CSV vazio."] };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      valid: [],
      invalid: [],
      warnings: [`Header inválido. Faltando: ${missing.join(", ")}`]
    };
  }

  const valid: ParsedCsvResult["valid"] = [];
  const invalid: CsvRowPreview[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = normalizeNfc((cells[idx] ?? "").trim());
    });

    const rowErrors: string[] = [];
    const name = normalizeNfc((raw.name ?? "").trim());
    const day = Number(raw.day);
    const month = Number(raw.month);

    if (!name) rowErrors.push("Nome obrigatório");
    if (!isValidDayMonth(day, month)) rowErrors.push("Dia/mês inválidos");

    if (rowErrors.length > 0) {
      invalid.push({ rowNumber: i + 1, raw, errors: rowErrors });
      continue;
    }

    const tags = dedupeCategoryNames(
      normalizeNfc(raw.tags ?? "")
        .split(/[;,|]/)
        .map((tag) => normalizeNfc(tag.trim()))
        .filter(Boolean)
    );

    const key = `${name.toLowerCase()}::${day}::${month}`;
    if (seen.has(key)) {
      warnings.push(`Linha ${i + 1}: possível duplicata (${name} ${day}/${month})`);
    }
    seen.add(key);

    valid.push({
      name,
      day,
      month,
      categories: tags,
      source: "csv",
      tags,
      notes: raw.notes || undefined,
      links: {
        whatsapp: raw.whatsapp || undefined,
        instagram: raw.instagram || undefined
      }
    });
  }

  return { valid, invalid, warnings };
}
