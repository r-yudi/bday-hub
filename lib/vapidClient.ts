/**
 * Decode VAPID applicationServerKey from the same string shape as web-push / Vercel env:
 * URL-safe base64 (no PEM). Unpadded URL-safe strings must be padded before atob().
 */
export function decodeVapidPublicKeyBase64(vapidKeyRaw: string): Uint8Array {
  let s = vapidKeyRaw.trim().replace(/\s/g, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  if (!s) {
    throw new Error("empty vapid key");
  }
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const rem = b64.length % 4;
  if (rem === 2) {
    b64 += "==";
  } else if (rem === 3) {
    b64 += "=";
  } else if (rem === 1) {
    throw new Error("invalid base64 length");
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/** Web Push expects uncompressed EC point: 65 bytes (0x04 + X + Y). */
export const VAPID_PUBLIC_KEY_BYTE_LENGTH = 65;

export type ClientVapidProbe = {
  envPresent: boolean;
  decodeOk: boolean;
  lenOk: boolean;
  byteLength: number | null;
};

/**
 * Safe probe for debug UI and preflight (no secrets). Uses NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * inlined at build time in the browser bundle.
 */
export function probeClientVapidPublicKey(envValue: string | undefined): ClientVapidProbe {
  const k = envValue?.trim();
  if (!k) {
    return { envPresent: false, decodeOk: false, lenOk: false, byteLength: null };
  }
  try {
    const bytes = decodeVapidPublicKeyBase64(k);
    const lenOk = bytes.length === VAPID_PUBLIC_KEY_BYTE_LENGTH;
    return {
      envPresent: true,
      decodeOk: true,
      lenOk,
      byteLength: bytes.length
    };
  } catch {
    return { envPresent: true, decodeOk: false, lenOk: false, byteLength: null };
  }
}

