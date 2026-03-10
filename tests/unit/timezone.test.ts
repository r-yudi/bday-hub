import test from "node:test";
import assert from "node:assert/strict";
import { addDaysToDateKey, getDateKey } from "@/lib/timezone";

test("getDateKey returns YYYY-MM-DD for America/Sao_Paulo", () => {
  const date = new Date("2026-06-15T12:00:00Z");
  const result = getDateKey(date, "America/Sao_Paulo");
  assert.equal(result, "2026-06-15");
});

test("getDateKey 23:30 UTC → next day in Asia/Tokyo (+9)", () => {
  const date = new Date("2026-03-10T23:30:00Z");
  const result = getDateKey(date, "Asia/Tokyo");
  assert.equal(result, "2026-03-11");
});

test("getDateKey 23:30 UTC → same day in America/Sao_Paulo (UTC-3)", () => {
  const date = new Date("2026-03-10T23:30:00Z");
  const result = getDateKey(date, "America/Sao_Paulo");
  assert.equal(result, "2026-03-10");
});

test("getDateKey 02:00 UTC → previous day in America/Sao_Paulo (UTC-3)", () => {
  const date = new Date("2026-03-11T02:00:00Z");
  const result = getDateKey(date, "America/Sao_Paulo");
  assert.equal(result, "2026-03-10");
});

test("getDateKey handles midnight boundary", () => {
  const date = new Date("2026-01-01T02:59:00Z");
  const result = getDateKey(date, "America/Sao_Paulo");
  assert.equal(result, "2025-12-31");
});

test("getDateKey falls back to America/Sao_Paulo on invalid timezone", () => {
  const date = new Date("2026-06-15T12:00:00Z");
  const result = getDateKey(date, "Invalid/Zone");
  const expected = getDateKey(date, "America/Sao_Paulo");
  assert.equal(result, expected);
});

test("getDateKey works with UTC", () => {
  const date = new Date("2026-12-31T23:59:00Z");
  const result = getDateKey(date, "UTC");
  assert.equal(result, "2026-12-31");
});

test("addDaysToDateKey +1 day", () => {
  assert.equal(addDaysToDateKey("2026-03-10", 1), "2026-03-11");
});

test("addDaysToDateKey month rollover", () => {
  assert.equal(addDaysToDateKey("2026-03-31", 1), "2026-04-01");
});

test("addDaysToDateKey year rollover", () => {
  assert.equal(addDaysToDateKey("2026-12-31", 1), "2027-01-01");
});
