/**
 * Normaliza WhatsApp e Instagram para URLs usadas no app.
 * Mantém URLs completas já salvas (legado) sem reescrever.
 */

export function persistWhatsappLink(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;

  const digits = t.replace(/\D/g, "");
  if (!digits) return undefined;

  let n = digits;
  if (n.length === 10 || n.length === 11) {
    n = `55${n}`;
  }

  return `https://wa.me/${n}`;
}

export function formatWhatsappForInput(stored: string | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  if (!/^https?:\/\//i.test(t)) return t;

  const wa = t.match(/wa\.me\/(\d+)/i);
  const param = t.match(/[?&]phone=(\d+)/i);
  const digits = wa?.[1] ?? param?.[1];
  if (!digits) return t;

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export function persistInstagramLink(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;

  const user = t.replace(/^@+/, "").replace(/\/+$/, "").trim();
  if (!user) return undefined;

  return `https://instagram.com/${encodeURIComponent(user)}`;
}

export function formatInstagramForInput(stored: string | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  if (!/^https?:\/\//i.test(t)) return t.replace(/^@+/, "").trim();

  const m = t.match(/instagram\.com\/([^/?#]+)/i);
  if (!m) return t;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}
