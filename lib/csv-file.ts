import { looksLikeMojibake, normalizeNfc } from "@/lib/text";

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function decodeLatin1(bytes: Uint8Array): string {
  return new TextDecoder("iso-8859-1").decode(bytes);
}

export function decodeCsvBytes(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input);
  const utf8 = decodeUtf8(bytes);
  const needsFallback = looksLikeMojibake(utf8);
  const decoded = needsFallback ? decodeLatin1(bytes) : utf8;
  return normalizeNfc(decoded);
}
