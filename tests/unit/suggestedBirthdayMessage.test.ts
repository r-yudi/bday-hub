import test from "node:test";
import assert from "node:assert/strict";
import { getTodaySuggestedMessage } from "@/lib/suggestedBirthdayMessage";

const base = { name: "Maria Silva", day: 1, month: 1, source: "manual" as const, tags: [], createdAt: 0, updatedAt: 0 };

test("sem nome e sem nickname → fallback", () => {
  assert.equal(getTodaySuggestedMessage({ ...base, id: "x", name: "", nickname: undefined }), "Feliz aniversário! 🎉");
});

test("nickname válido tem prioridade sobre nome (template por id)", () => {
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "0", name: "Maria Silva", nickname: "Ju" }),
    "Ju, feliz aniversário! Que seu dia seja leve e especial 🎉"
  );
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "1", name: "Maria Silva", nickname: "Ju" }),
    "Ju, parabéns! Te desejo um ano incrível por aí."
  );
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "2", name: "Maria Silva", nickname: "Ju" }),
    "Ju, feliz aniversário! Tudo de mais bonito pra você hoje."
  );
});

test("sem nickname → primeiro nome de name", () => {
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "0", name: "Hope Oliveira", nickname: undefined }),
    "Hope, feliz aniversário! Que seu dia seja leve e especial 🎉"
  );
});

test("nickname só espaços → usa primeiro nome", () => {
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "0", name: "Ana", nickname: "   " }),
    "Ana, feliz aniversário! Que seu dia seja leve e especial 🎉"
  );
});

test("nickname acima do limite → ignora, usa primeiro nome", () => {
  const long = "a".repeat(49);
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "0", name: "Pedro", nickname: long }),
    "Pedro, feliz aniversário! Que seu dia seja leve e especial 🎉"
  );
});

