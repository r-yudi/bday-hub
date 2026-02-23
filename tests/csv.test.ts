import test from "node:test";
import assert from "node:assert/strict";
import { parseBirthdayCsv } from "@/lib/csv";

test("parseBirthdayCsv aceita CSV válido com header obrigatório", () => {
  const csv = [
    "name,day,month,tags,whatsapp,instagram,notes",
    "Ana Silva,23,2,amigos;faculdade,https://wa.me/5511,https://instagram.com/ana,Prefere mensagem cedo"
  ].join("\n");

  const result = parseBirthdayCsv(csv);

  assert.equal(result.valid.length, 1);
  assert.equal(result.invalid.length, 0);
  assert.equal(result.valid[0]?.name, "Ana Silva");
  assert.deepEqual(result.valid[0]?.tags, ["amigos", "faculdade"]);
});

test("parseBirthdayCsv marca linhas inválidas e reporta erros", () => {
  const csv = [
    "name,day,month,tags,whatsapp,instagram,notes",
    ",23,2,,,,",
    "Bruno,31,2,,,,"
  ].join("\n");

  const result = parseBirthdayCsv(csv);

  assert.equal(result.valid.length, 0);
  assert.equal(result.invalid.length, 2);
  assert.match(result.invalid[0]?.errors.join(", ") ?? "", /Nome obrigatório/);
  assert.match(result.invalid[1]?.errors.join(", ") ?? "", /Dia\/mês inválidos/);
});

test("parseBirthdayCsv rejeita header incompleto", () => {
  const csv = ["name,day,month", "Ana,23,2"].join("\n");
  const result = parseBirthdayCsv(csv);

  assert.equal(result.valid.length, 0);
  assert.equal(result.invalid.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("Header inválido")));
});
