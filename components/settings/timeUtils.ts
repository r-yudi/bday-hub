/** Parse "HH:mm" to { h, m }; invalid returns 09:00. */
export function parseTimeHHmm(s: string): { h: number; m: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((s || "").trim());
  if (!match) return { h: 9, m: 0 };
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
}

export function formatTimeHHmm(h: number, m: number): string {
  const hh = Math.max(0, Math.min(23, Math.floor(h)));
  const mm = Math.max(0, Math.min(59, Math.floor(m)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
