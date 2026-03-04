import test from "node:test";
import assert from "node:assert/strict";

/**
 * Simulates the idempotency guard that will protect
 * the daily reminder email pipeline.
 *
 * In production this will be backed by a Supabase table
 * (`email_send_log` with UNIQUE on user_id + date_key).
 * Here we validate the logic with an in-memory Set.
 */
function createIdempotencyGuard() {
  const sent = new Set<string>();

  return {
    shouldSend(userId: string, dateKey: string): boolean {
      const key = `${userId}:${dateKey}`;
      if (sent.has(key)) return false;
      sent.add(key);
      return true;
    },
    reset() {
      sent.clear();
    }
  };
}

test("first execution for a date_key is allowed", () => {
  const guard = createIdempotencyGuard();
  assert.equal(guard.shouldSend("user-1", "2026-03-10"), true);
});

test("second execution with same date_key is blocked", () => {
  const guard = createIdempotencyGuard();
  guard.shouldSend("user-1", "2026-03-10");
  assert.equal(guard.shouldSend("user-1", "2026-03-10"), false);
});

test("different date_key for same user is allowed", () => {
  const guard = createIdempotencyGuard();
  guard.shouldSend("user-1", "2026-03-10");
  assert.equal(guard.shouldSend("user-1", "2026-03-11"), true);
});

test("same date_key for different user is allowed", () => {
  const guard = createIdempotencyGuard();
  guard.shouldSend("user-1", "2026-03-10");
  assert.equal(guard.shouldSend("user-2", "2026-03-10"), true);
});

test("rapid duplicate calls are both guarded", () => {
  const guard = createIdempotencyGuard();
  const first = guard.shouldSend("user-1", "2026-03-10");
  const second = guard.shouldSend("user-1", "2026-03-10");
  assert.equal(first, true);
  assert.equal(second, false);
});

test("reset clears previous state", () => {
  const guard = createIdempotencyGuard();
  guard.shouldSend("user-1", "2026-03-10");
  guard.reset();
  assert.equal(guard.shouldSend("user-1", "2026-03-10"), true);
});
