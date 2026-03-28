import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import {
  decodeVapidPublicKeyBase64,
  probeClientVapidPublicKey,
  VAPID_PUBLIC_KEY_BYTE_LENGTH
} from "@/lib/vapidClient";

function toB64UrlUnpadded(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

test("decodeVapidPublicKeyBase64: aceita URL-safe base64 sem padding (65 bytes)", () => {
  const raw = new Uint8Array(VAPID_PUBLIC_KEY_BYTE_LENGTH);
  raw[0] = 0x04;
  for (let i = 1; i < raw.length; i++) raw[i] = i & 0xff;
  const key = toB64UrlUnpadded(raw);
  const decoded = decodeVapidPublicKeyBase64(key);
  assert.equal(decoded.length, VAPID_PUBLIC_KEY_BYTE_LENGTH);
  assert.equal(decoded[0], 0x04);
});

test("decodeVapidPublicKeyBase64: remove aspas externas no env", () => {
  const raw = new Uint8Array(VAPID_PUBLIC_KEY_BYTE_LENGTH);
  raw[0] = 0x04;
  for (let i = 1; i < raw.length; i++) raw[i] = (i * 7) & 0xff;
  const key = toB64UrlUnpadded(raw);
  const decoded = decodeVapidPublicKeyBase64(JSON.stringify(key));
  assert.equal(decoded.length, VAPID_PUBLIC_KEY_BYTE_LENGTH);
});

test("probeClientVapidPublicKey: missing env", () => {
  const p = probeClientVapidPublicKey(undefined);
  assert.equal(p.envPresent, false);
  assert.equal(p.decodeOk, false);
});

test("probeClientVapidPublicKey: key inválida", () => {
  const p = probeClientVapidPublicKey("not-base64!!!");
  assert.equal(p.envPresent, true);
  assert.equal(p.decodeOk, false);
});
