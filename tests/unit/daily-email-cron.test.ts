import test from "node:test";
import assert from "node:assert/strict";
import {
  processOneCandidate,
  dateKeyToDayMonth,
  truncateError,
  shouldSendNow,
  shouldSendForNow,
  getCandidateDebug,
  type UserSettingsReminderRow,
  type DailyEmailCronDeps,
  type DispatchRow
} from "@/lib/server/dailyEmailCronLogic";

const ROW: UserSettingsReminderRow = {
  user_id: "user-1",
  email_enabled: true,
  email_time: "09:00",
  timezone: "America/Sao_Paulo"
};

const NOW = new Date("2026-03-10T09:05:00Z");
const TZ = "America/Sao_Paulo";
const EMAIL_TIME = "09:00";

test("shouldSendNow: 1 min before window -> false", () => {
  const now = new Date("2026-03-10T11:59:00Z"); // 08:59 in SP (UTC-3)
  assert.equal(shouldSendNow(now, TZ, EMAIL_TIME, 15), false);
});

test("shouldSendNow: exactly at email_time -> true", () => {
  const now = new Date("2026-03-10T12:00:00Z"); // 09:00 in SP
  assert.equal(shouldSendNow(now, TZ, EMAIL_TIME, 15), true);
});

test("shouldSendNow: 16 min after window start -> false", () => {
  const now = new Date("2026-03-10T12:16:00Z"); // 09:16 in SP (outside [09:00, 09:15))
  assert.equal(shouldSendNow(now, TZ, EMAIL_TIME, 15), false);
});

test("user with email_enabled=true, email_time in window, America/Sao_Paulo => isCandidate true", () => {
  const now = new Date("2026-03-10T12:00:00Z"); // 09:00 in SP
  assert.equal(shouldSendForNow(EMAIL_TIME, TZ, now), true);
  const debug = getCandidateDebug(ROW, now);
  assert.equal(debug.isCandidate, true);
  assert.equal(debug.email_enabled, true);
  assert.equal(debug.email_time, "09:00");
  assert.equal(debug.timezone, "America/Sao_Paulo");
  assert.ok(debug.localNowHHMM === "09:00" || debug.localNowHHMM.startsWith("09:"));
});

test("shouldSendNow: window crossing midnight (23:50 -> 00:05)", () => {
  // 02:50 UTC = 23:50 SP (UTC-3); 03:00 UTC = 00:00 SP; 03:04 UTC = 00:04 SP (inside window)
  assert.equal(shouldSendNow(new Date("2026-03-10T02:50:00Z"), TZ, "23:50", 15), true);
  assert.equal(shouldSendNow(new Date("2026-03-10T03:04:00Z"), TZ, "23:50", 15), true);
  assert.equal(shouldSendNow(new Date("2026-03-10T03:06:00Z"), TZ, "23:50", 15), false);
});

test("shouldSendNow: Europe/London 09:00 local => in window (January = GMT, 09:00 UTC = 09:00 London)", () => {
  const tzLondon = "Europe/London";
  const now = new Date("2026-01-15T09:00:00Z");
  assert.equal(shouldSendNow(now, tzLondon, "09:00", 15), true);
  assert.equal(shouldSendNow(now, tzLondon, "09:15", 15), false);
});

test("getCandidateDebug: push_only user in window => isCandidate true", () => {
  const pushOnlyRow: UserSettingsReminderRow = {
    user_id: "user-push-only",
    email_enabled: false,
    push_enabled: true,
    email_time: "09:00",
    timezone: "America/Sao_Paulo"
  };
  const now = new Date("2026-03-10T12:00:00Z");
  const debug = getCandidateDebug(pushOnlyRow, now);
  assert.equal(debug.isCandidate, true);
  assert.equal(debug.timezone, "America/Sao_Paulo");
});

test("dateKeyToDayMonth parses YYYY-MM-DD", () => {
  assert.deepEqual(dateKeyToDayMonth("2026-03-10"), { day: 10, month: 3 });
});

test("truncateError shortens long messages", () => {
  const long = "a".repeat(250);
  assert.equal(truncateError(long).length, 200);
  assert.ok(truncateError(long).endsWith("..."));
});

test("concurrency: first insert wins, second gets 23505 and skips", async () => {
  let insertCount = 0;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => {
      insertCount += 1;
      if (insertCount === 1) return { id: "dispatch-1" };
      return { error: "duplicate", code: "23505" };
    },
    getExistingDispatch: async () => ({
      id: "dispatch-1",
      user_id: "user-1",
      date_key: "2026-03-10",
      status: "sent",
      created_at: NOW.toISOString()
    }),
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async () => [],
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async () => ({ ok: true })
  };

  const first = await processOneCandidate(deps, ROW, NOW);
  assert.equal(first.outcome, "skipped");
  assert.equal(first.outcome === "skipped" && first.reason, "no_birthday");

  const second = await processOneCandidate(deps, ROW, NOW);
  assert.equal(second.outcome, "skipped");
  assert.equal(second.outcome === "skipped" && second.reason, "already_sent");
  assert.equal(insertCount, 2);
});

test("no birthdays -> status skipped and sendReminderEmail NOT called", async () => {
  let sendCalls = 0;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async () => [],
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async () => {
      sendCalls += 1;
      return { ok: true };
    }
  };

  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "skipped");
  assert.equal(outcome.outcome === "skipped" && outcome.reason, "no_birthday");
  assert.equal(sendCalls, 0);
});

test("email send failure -> status error and error_message set", async () => {
  let updateCalls: Array<{ status: string; error_message?: string }> = [];
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async (_id, update) => {
      updateCalls.push(update);
    },
    getBirthdays: async () => [{ name: "Alice", day: 10, month: 3 }],
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async () => ({ ok: false, reason: "provider-error", detail: "Resend 500" })
  };

  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "failed");
  assert.equal(outcome.outcome === "failed" && outcome.reason, "Resend 500");
  const errorUpdate = updateCalls.find((u) => u.status === "error");
  assert.ok(errorUpdate);
  assert.ok(errorUpdate!.error_message);
});

test("stale pending: atomic claim succeeds -> process and update status", async () => {
  const oldCreated = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
  let updateCalls: Array<{ status: string }> = [];
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ error: "duplicate", code: "23505" }),
    getExistingDispatch: async () => ({
      id: "stale-1",
      user_id: "user-1",
      date_key: "2026-03-10",
      status: "pending",
      created_at: oldCreated
    }),
    claimStalePending: async () => true,
    updateDispatch: async (_id, update) => {
      updateCalls.push({ status: update.status });
    },
    getBirthdays: async () => [],
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async () => ({ ok: true })
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "skipped");
  assert.equal(outcome.outcome === "skipped" && outcome.reason, "no_birthday");
  assert.ok(outcome.outcome === "skipped" && outcome.recoveredStale);
  assert.ok(updateCalls.some((u) => u.status === "skipped"));
});

test("today wins: when today has birthdays only one getBirthdays (today) and send today email", async () => {
  let getBirthdaysCalls: Array<{ day: number; month: number }> = [];
  let sentSubject = "";
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async (_userId, day, month) => {
      getBirthdaysCalls.push({ day, month });
      return [{ name: "Alice", day: 10, month: 3 }];
    },
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async (input) => {
      sentSubject = input.subject;
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "sent");
  assert.equal(getBirthdaysCalls.length, 1);
  assert.equal(getBirthdaysCalls[0].day, 10);
  assert.equal(getBirthdaysCalls[0].month, 3);
  assert.ok(sentSubject.includes("Hoje") || sentSubject.includes("Alice"));
  assert.ok(!sentSubject.includes("Amanhã"));
});

test("reminder_timing day_before: digest uses tomorrow's birthdays and mode tomorrow", async () => {
  const rowDayBefore: UserSettingsReminderRow = { ...ROW, reminder_timing: "day_before" };
  let getBirthdaysCalls: Array<{ day: number; month: number }> = [];
  let sentSubject = "";
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async (_userId, day, month) => {
      getBirthdaysCalls.push({ day, month });
      if (day === 11 && month === 3) return [{ name: "Bob", day: 11, month: 3 }];
      return [];
    },
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async (input) => {
      sentSubject = input.subject;
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, rowDayBefore, NOW);
  assert.equal(outcome.outcome, "sent");
  assert.equal(getBirthdaysCalls.length, 1);
  assert.equal(getBirthdaysCalls[0].day, 11);
  assert.equal(getBirthdaysCalls[0].month, 3);
  assert.ok(sentSubject.includes("Amanhã"));
  assert.ok(sentSubject.includes("Bob"));
});

test("tomorrow sends when today empty: subject and hero are tomorrow copy", async () => {
  let sentPayload: { subject: string; html: string } | null = null;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async (_userId, day, month) => {
      if (day === 10 && month === 3) return [];
      return [{ name: "Bob", day: 11, month: 3 }];
    },
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async (input) => {
      sentPayload = { subject: input.subject, html: input.html };
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "sent");
  assert.ok(sentPayload);
  assert.ok(sentPayload!.subject.includes("Amanhã"));
  assert.ok(sentPayload!.subject.includes("Bob"));
  assert.ok(sentPayload!.html.includes("Amanhã alguém importante faz aniversário"));
  assert.ok(sentPayload!.html.includes("Amanhã tem aniversário chegando"));
});

test("priority tomorrow over 7 days: when today empty, tomorrow and 7 days both have birthdays, send tomorrow email", async () => {
  let getBirthdaysCalls: Array<{ day: number; month: number }> = [];
  let sentPayload: { subject: string; html: string } | null = null;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async (_userId, day, month) => {
      getBirthdaysCalls.push({ day, month });
      if (day === 10 && month === 3) return [];
      if (day === 11 && month === 3) return [{ name: "Bob", day: 11, month: 3 }];
      return [{ name: "Carol", day: 17, month: 3 }];
    },
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async (input) => {
      sentPayload = { subject: input.subject, html: input.html };
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "sent");
  assert.equal(getBirthdaysCalls.length, 2, "must query only today and tomorrow, not 7 days");
  assert.deepEqual(getBirthdaysCalls[0], { day: 10, month: 3 });
  assert.deepEqual(getBirthdaysCalls[1], { day: 11, month: 3 });
  assert.ok(sentPayload);
  assert.ok(sentPayload!.subject.includes("Amanhã"));
  assert.ok(sentPayload!.subject.includes("Bob"));
  assert.ok(!sentPayload!.subject.includes("7 dias") && !sentPayload!.subject.includes("semana"));
  assert.ok(sentPayload!.html.includes("Amanhã alguém importante faz aniversário"));
  assert.ok(sentPayload!.html.includes("Bob"));
  assert.ok(!sentPayload!.html.includes("Um aniversário está chegando"));
});

test("7 days sends when today and tomorrow empty: subject and hero are week copy", async () => {
  let sentPayload: { subject: string; html: string } | null = null;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ id: "id-1" }),
    getExistingDispatch: async () => null,
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async (_userId, day, month) => {
      if (day === 10 && month === 3) return [];
      if (day === 11 && month === 3) return [];
      return [{ name: "Carol", day: 17, month: 3 }];
    },
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async (input) => {
      sentPayload = { subject: input.subject, html: input.html };
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "sent");
  assert.ok(sentPayload);
  assert.ok(sentPayload!.subject.includes("7 dias") || sentPayload!.subject.includes("semana"));
  assert.ok(sentPayload!.subject.includes("Carol"));
  assert.ok(sentPayload!.html.includes("Um aniversário está chegando"));
  assert.ok(sentPayload!.html.includes("Carol"));
});

test("stale pending: atomic claim fails -> already_processing, sendReminderEmail NOT called", async () => {
  const oldCreated = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
  let sendCalls = 0;
  const deps: DailyEmailCronDeps = {
    insertDispatch: async () => ({ error: "duplicate", code: "23505" }),
    getExistingDispatch: async () => ({
      id: "stale-1",
      user_id: "user-1",
      date_key: "2026-03-10",
      status: "pending",
      created_at: oldCreated
    }),
    claimStalePending: async () => false,
    updateDispatch: async () => {},
    getBirthdays: async () => [{ name: "Alice", day: 10, month: 3 }],
    getUserEmail: async () => "u@example.com",
    sendReminderEmail: async () => {
      sendCalls += 1;
      return { ok: true };
    }
  };
  const outcome = await processOneCandidate(deps, ROW, NOW);
  assert.equal(outcome.outcome, "skipped");
  assert.equal(outcome.outcome === "skipped" && outcome.reason, "already_processing");
  assert.equal(sendCalls, 0);
});

test("cron route returns 401 without valid CRON_SECRET", async () => {
  const { GET } = await import("@/app/api/cron/email/route");
  const req = new Request("https://uselembra.com.br/api/cron/email", {
    headers: { Authorization: "Bearer wrong-secret" }
  });
  const res = await GET(req);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.message, "unauthorized");
});