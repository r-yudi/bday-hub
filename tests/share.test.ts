import test from "node:test";
import assert from "node:assert/strict";
import { decodeShareToken, encodeShareToken } from "@/lib/share";

test("share token v1 faz roundtrip de payload mínimo", () => {
  const payload = {
    name: "Ana Silva",
    day: 23,
    month: 2,
    issuedAt: 1_771_800_000_000
  };

  const token = encodeShareToken(payload);
  const decoded = decodeShareToken(token);

  assert.ok(token.length > 0);
  assert.deepEqual(decoded, payload);
});

test("share token inválido retorna null", () => {
  assert.equal(decodeShareToken("token-invalido"), null);
});
