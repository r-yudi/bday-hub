import test from "node:test";
import assert from "node:assert/strict";
import { getUpcomingPeople } from "@/lib/dates";
import type { BirthdayPerson } from "@/lib/types";

function person(overrides: Partial<BirthdayPerson>): BirthdayPerson {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Pessoa",
    day: overrides.day ?? 1,
    month: overrides.month ?? 1,
    source: overrides.source ?? "manual",
    tags: overrides.tags ?? [],
    notes: overrides.notes,
    links: overrides.links,
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now()
  };
}

test("getUpcomingPeople inclui hoje e ordena por proximidade", () => {
  const base = new Date("2026-02-23T10:00:00");
  const people = [
    person({ name: "Bruno", day: 24, month: 2 }),
    person({ name: "Ana", day: 23, month: 2 }),
    person({ name: "Carla", day: 1, month: 3 }),
    person({ name: "Longe", day: 5, month: 3 })
  ];

  const result = getUpcomingPeople(people, base, 7);

  assert.deepEqual(
    result.map((p) => [p.name, p.daysUntil]),
    [
      ["Ana", 0],
      ["Bruno", 1],
      ["Carla", 6]
    ]
  );
});

test("getUpcomingPeople considera virada de ano", () => {
  const base = new Date("2026-12-29T09:00:00");
  const people = [
    person({ name: "Ano Novo", day: 1, month: 1 }),
    person({ name: "Virada", day: 31, month: 12 }),
    person({ name: "Depois", day: 6, month: 1 })
  ];

  const result = getUpcomingPeople(people, base, 7);

  assert.deepEqual(
    result.map((p) => [p.name, p.daysUntil]),
    [
      ["Virada", 2],
      ["Ano Novo", 3],
      ["Depois", 8]
    ].filter(([, days]) => Number(days) <= 7)
  );
});
