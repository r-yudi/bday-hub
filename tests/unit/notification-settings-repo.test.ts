import test from "node:test";
import assert from "node:assert/strict";
import {
  upsertUserSettingsEmail,
  buildEmailReminderPayload,
  mapUserSettingsRowToEmailSettings,
  ensureUserSettingsRowForNewUserWithSupabase
} from "@/lib/notificationSettingsRepo";

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

test("buildEmailReminderPayload with only emailEnabled returns partial payload (no email_time/timezone)", () => {
  const payload = buildEmailReminderPayload({ emailEnabled: true }, "user-1");
  assert.equal(payload.user_id, "user-1");
  assert.equal(payload.email_enabled, true);
  assert.ok(!("email_time" in payload));
  assert.ok(!("timezone" in payload));
});

test("ensureUserSettingsRowForNewUserWithSupabase inserts when no row", async () => {
  let inserted: Record<string, unknown> | null = null;
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null })
        })
      }),
      insert: async (row: Record<string, unknown>) => {
        inserted = row;
        return { error: null };
      }
    })
  };
  await ensureUserSettingsRowForNewUserWithSupabase(mockSupabase as never, "new-user");
  assert.deepEqual(inserted, { user_id: "new-user", email_enabled: true });
});

test("ensureUserSettingsRowForNewUserWithSupabase does not insert when row exists", async () => {
  let insertCalls = 0;
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { user_id: "u1" }, error: null })
        })
      }),
      insert: async () => {
        insertCalls += 1;
        return { error: null };
      }
    })
  };
  await ensureUserSettingsRowForNewUserWithSupabase(mockSupabase as never, "u1");
  assert.equal(insertCalls, 0);
});

test("ensureUserSettingsRowForNewUserWithSupabase treats unique violation as noop", async () => {
  let insertCalls = 0;
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null })
        })
      }),
      insert: async () => {
        insertCalls += 1;
        return { error: { message: "duplicate", code: "23505" } };
      }
    })
  };
  await assert.doesNotReject(() => ensureUserSettingsRowForNewUserWithSupabase(mockSupabase as never, "u-race"));
  assert.equal(insertCalls, 1);
});

test("mapUserSettingsRowToEmailSettings: null row matches defaults", () => {
  const s = mapUserSettingsRowToEmailSettings(null);
  assert.equal(s.emailEnabled, false);
  assert.equal(s.emailTime, "09:00");
  assert.equal(s.reminderTiming, "day_of");
});

test("mapUserSettingsRowToEmailSettings: preserves enabled and custom time", () => {
  const s = mapUserSettingsRowToEmailSettings({
    user_id: "u1",
    email_enabled: true,
    email_time: "14:30",
    timezone: "America/Sao_Paulo",
    reminder_timing: "day_before"
  });
  assert.equal(s.emailEnabled, true);
  assert.equal(s.emailTime, "14:30");
  assert.equal(s.timezone, "America/Sao_Paulo");
  assert.equal(s.reminderTiming, "day_before");
});
