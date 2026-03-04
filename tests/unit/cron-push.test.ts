import test from "node:test";
import assert from "node:assert/strict";
import { runPushForUser } from "@/lib/server/cronPush";

const NOW = new Date("2026-03-10T12:00:00Z");

test("runPushForUser: sendPush throws -> no exception; reason send_failed; no revoke update", async () => {
  let updateCalled = false;
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { endpoint: "https://push.example.com/send/1", p256dh: "key", auth: "auth" }
                })
              })
            })
          })
        })
      }),
      update: () => ({
        eq: () => {
          updateCalled = true;
          return Promise.resolve();
        }
      })
    })
  } as never;

  const result = await runPushForUser({
    supabase,
    userId: "user-1",
    now: NOW,
    outcome: { outcome: "skipped", reason: "no_birthday" },
    sendPush: async () => {
      throw new Error("fail");
    }
  });

  assert.equal(result.attempted, true);
  assert.equal(result.sent, false);
  assert.equal("reason" in result && result.reason, "send_failed");
  assert.equal(updateCalled, false);
});

test("runPushForUser: no subscription -> attempted false, reason no_subscription", async () => {
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null })
              })
            })
          })
        })
      })
    })
  } as never;

  const result = await runPushForUser({
    supabase,
    userId: "user-1",
    now: NOW,
    sendPush: async () => ({ ok: true })
  });

  assert.equal(result.attempted, false);
  assert.equal(result.reason, "no_subscription");
});

test("runPushForUser: sendPush returns invalidEndpoint -> revoke called, result revoked true", async () => {
  let revokedAt: string | null = null;
  const supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: { endpoint: "https://push.example.com/send/2", p256dh: "k", auth: "a" }
                })
              })
            })
          })
        })
      }),
      update: (obj: { revoked_at?: string }) => {
        revokedAt = obj.revoked_at ?? null;
        return { eq: () => Promise.resolve() };
      }
    })
  } as never;

  const result = await runPushForUser({
    supabase,
    userId: "user-2",
    now: NOW,
    outcome: { outcome: "sent" },
    sendPush: async () => ({ ok: false, invalidEndpoint: true })
  });

  assert.equal(result.attempted, true);
  assert.equal(result.sent, false);
  assert.equal("revoked" in result && result.revoked, true);
  assert.equal(result.reason, "invalid_endpoint");
  assert.ok(revokedAt !== null);
});
