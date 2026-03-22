import test from "node:test";
import assert from "node:assert/strict";
import { getTodaySuggestedMessage } from "@/lib/suggestedBirthdayMessage";

const base = { name: "Maria", day: 1, month: 1, source: "manual" as const, tags: [], createdAt: 0, updatedAt: 0 };

test("sem notes → mensagem padrão", () => {
  assert.equal(getTodaySuggestedMessage({ ...base, id: "1" }), "Feliz aniversário! 🎉");
});

test("notes só whitespace → mensagem padrão", () => {
  assert.equal(getTodaySuggestedMessage({ ...base, id: "1", notes: "  \n  " }), "Feliz aniversário! 🎉");
});

test("primeira linha única", () => {
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "1", notes: "Ju, ama café" }),
    "Ju, ama café, feliz aniversário!! 🎉"
  );
});

test("várias linhas: só a primeira entra na sugestão", () => {
  assert.equal(
    getTodaySuggestedMessage({ ...base, id: "1", notes: "Linha um\nLinha dois" }),
    "Linha um, feliz aniversário!! 🎉"
  );
});

test("notes undefined → mensagem padrão", () => {
  assert.equal(getTodaySuggestedMessage({ ...base, id: "1", notes: undefined }), "Feliz aniversário! 🎉");
});
