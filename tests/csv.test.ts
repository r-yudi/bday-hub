import test from "node:test";
import assert from "node:assert/strict";
import { parseBirthdayCsv } from "@/lib/csv";
import { decodeCsvBytes } from "@/lib/csv-file";

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

test("decodeCsvBytes faz fallback para Latin1 quando detecta mojibake", () => {
  const latin1Bytes = Buffer.from("name,day,month,tags,whatsapp,instagram,notes\nJoão,1,1,,,,Parabéns", "latin1");
  const decoded = decodeCsvBytes(latin1Bytes.buffer.slice(latin1Bytes.byteOffset, latin1Bytes.byteOffset + latin1Bytes.byteLength));

  assert.match(decoded, /João/);
  assert.match(decoded, /Parabéns/);
  assert.ok(!decoded.includes("ParabÃ©ns"));
});
