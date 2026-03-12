import test from "node:test";
import assert from "node:assert/strict";
import { parseQuickBirthdayLines } from "@/lib/quickBirthdayParser";

test("parseQuickBirthdayLines aceita linhas válidas no formato Nome DD/MM", () => {
  const text = ["Maria 12/03", "João 18/06", "Ana 07/09"].join("\n");
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 3);
  assert.equal(result.invalid.length, 0);
  assert.equal(result.valid[0]?.name, "Maria");
  assert.equal(result.valid[0]?.day, 12);
  assert.equal(result.valid[0]?.month, 3);
  assert.equal(result.valid[1]?.name, "João");
  assert.equal(result.valid[1]?.day, 18);
  assert.equal(result.valid[1]?.month, 6);
  assert.equal(result.valid[2]?.name, "Ana");
  assert.equal(result.valid[2]?.day, 7);
  assert.equal(result.valid[2]?.month, 9);
});

test("parseQuickBirthdayLines aceita formato 1 dígito (D/M)", () => {
  const text = "Ana 7/9";
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 1);
  assert.equal(result.invalid.length, 0);
  assert.equal(result.valid[0]?.name, "Ana");
  assert.equal(result.valid[0]?.day, 7);
  assert.equal(result.valid[0]?.month, 9);
});

test("parseQuickBirthdayLines marca linhas inválidas", () => {
  const text = ["Maria 12/03", "sem-data", "João 32/01", "  ", "Pedro 15/13"].join("\n");
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0]?.name, "Maria");

  assert.equal(result.invalid.length, 3);
  assert.equal(result.invalid[0]?.lineNumber, 2);
  assert.equal(result.invalid[0]?.line, "sem-data");
  assert.equal(result.invalid[1]?.lineNumber, 3);
  assert.equal(result.invalid[1]?.line, "João 32/01");
  assert.equal(result.invalid[2]?.lineNumber, 5);
  assert.equal(result.invalid[2]?.line, "Pedro 15/13");
});

test("parseQuickBirthdayLines mistura válidas e inválidas e importa só válidas", () => {
  const text = ["Maria 12/03", "inválido", "João 18/06", "Ana 7/9"].join("\n");
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 3);
  assert.equal(result.invalid.length, 1);
  assert.equal(result.invalid[0]?.lineNumber, 2);
  assert.equal(result.invalid[0]?.line, "inválido");
});

test("parseQuickBirthdayLines ignora linhas vazias", () => {
  const text = ["Maria 12/03", "", "  ", "João 18/06"].join("\n");
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 2);
  assert.equal(result.invalid.length, 0);
});

test("parseQuickBirthdayLines preserva nome com múltiplas palavras", () => {
  const text = "Maria Silva Santos 1/1";
  const result = parseQuickBirthdayLines(text);

  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0]?.name, "Maria Silva Santos");
  assert.equal(result.valid[0]?.day, 1);
  assert.equal(result.valid[0]?.month, 1);
});
