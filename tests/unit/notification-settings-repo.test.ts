import test from "node:test";
import assert from "node:assert/strict";
import { upsertUserSettingsEmail, buildEmailReminderPayload } from "@/lib/notificationSettingsRepo";

test("upsertUserSettingsEmail throws when DB upsert returns error", async () => {
  const mockSupabase = {
    from: () => ({
      upsert: async () => ({ error: { message: "RLS policy violation" } })
    })
  };
  await assert.rejects(
    () => upsertUserSettingsEmail(mockSupabase as never, { user_id: "u1", email_enabled: true }),
    (err: Error) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /RLS policy violation|Falha ao salvar/);
      return true;
    }
  );
});

test("upsertUserSettingsEmail does not throw when upsert succeeds", async () => {
  const mockSupabase = {
    from: () => ({
      upsert: async () => ({ error: null })
    })
  };
  await assert.doesNotReject(() =>
    upsertUserSettingsEmail(mockSupabase as never, { user_id: "u1", email_enabled: true })
  );
});

test("toggle only: buildEmailReminderPayload({ emailEnabled: true }) does not include email_time so DB keeps existing 00:13", () => {
  const payload = buildEmailReminderPayload({ emailEnabled: true }, "user-1");
  assert.equal(payload.user_id, "user-1");
  assert.equal(payload.email_enabled, true);
  assert.ok(!("email_time" in payload), "payload must not include email_time so toggle does not overwrite existing value");
  assert.ok(!("timezone" in payload), "payload must not include timezone");
});
