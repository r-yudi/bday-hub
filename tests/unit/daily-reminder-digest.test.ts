import test from "node:test";
import assert from "node:assert/strict";
import { buildDailyReminderEmail } from "@/lib/server/dailyReminderDigest";

test("buildDailyReminderEmail with empty list returns fallback with Lembra branding", () => {
  const out = buildDailyReminderEmail([]);
  assert.ok(out.subject.includes("Lembra"));
  assert.ok(out.html.includes("Lembra."));
  assert.ok(out.text.includes("Lembra."));
  assert.ok(out.html.includes("Nenhum aniversário") || out.subject.includes("Lembra"));
  assert.ok(out.html.includes("Abrir Lembra"));
});

test("buildDailyReminderEmail with one person", () => {
  const out = buildDailyReminderEmail([{ name: "Ana", day: 7, month: 3 }]);
  assert.ok(out.subject.includes("Ana"));
  assert.ok(out.html.includes("Ana"));
  assert.ok(out.html.includes("07/03"));
  assert.ok(out.html.includes("Lembra."));
});

test("buildDailyReminderEmail mode tomorrow: subject and hero", () => {
  const out = buildDailyReminderEmail(
    [{ name: "Ana", day: 8, month: 3 }],
    "2026-03-08",
    "tomorrow"
  );
  assert.ok(out.subject.includes("Amanhã"));
  assert.ok(out.subject.includes("Ana"));
  assert.ok(out.html.includes("Amanhã alguém importante faz aniversário"));
  assert.ok(out.html.includes("Ana"));
  assert.ok(out.html.includes("Amanhã tem aniversário chegando"));
  assert.ok(out.html.includes("Vale se preparar desde já"));
  assert.ok(out.html.includes("faz aniversário amanhã"));
  assert.ok(out.html.includes("Lembra."));
});

test("buildDailyReminderEmail mode week: subject and hero", () => {
  const out = buildDailyReminderEmail(
    [{ name: "Carol", day: 17, month: 3 }],
    "2026-03-17",
    "week"
  );
  assert.ok(out.subject.includes("Carol"));
  assert.ok(out.subject.includes("7 dias") || out.subject.includes("semana"));
  assert.ok(out.html.includes("Um aniversário está chegando"));
  assert.ok(out.html.includes("Carol"));
  assert.ok(out.html.includes("Talvez seja uma boa hora para se preparar"));
  assert.ok(out.html.includes("faz aniversário em 7 dias"));
  assert.ok(out.html.includes("Lembra."));
  assert.ok(out.html.includes("🎁 Abrir Lembra"));
});
