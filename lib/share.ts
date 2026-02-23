export type SharePayload = {
  name: string;
  day: number;
  month: number;
  issuedAt: number;
};

function base64UrlEncode(input: string): string {
  let base64: string;
  if (typeof window === "undefined") {
    base64 = Buffer.from(input, "utf-8").toString("base64");
  } else {
    base64 = btoa(unescape(encodeURIComponent(input)));
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  if (typeof window === "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  return decodeURIComponent(escape(atob(base64)));
}

export function encodeShareToken(payload: SharePayload): string {
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeShareToken(token: string): SharePayload | null {
  try {
    const parsed = JSON.parse(base64UrlDecode(token)) as Partial<SharePayload>;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.day !== "number" ||
      typeof parsed.month !== "number" ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }
    return {
      name: parsed.name,
      day: parsed.day,
      month: parsed.month,
      issuedAt: parsed.issuedAt
    };
  } catch {
    return null;
  }
}
