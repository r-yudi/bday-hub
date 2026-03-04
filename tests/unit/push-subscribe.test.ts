import test from "node:test";
import assert from "node:assert/strict";
import { validateSubscribeBody } from "@/lib/server/push-subscribe-validation";

test("validateSubscribeBody: null -> false", () => {
  assert.equal(validateSubscribeBody(null), false);
});

test("validateSubscribeBody: non-object -> false", () => {
  assert.equal(validateSubscribeBody("string"), false);
  assert.equal(validateSubscribeBody(123), false);
});

test("validateSubscribeBody: missing endpoint -> false", () => {
  assert.equal(
    validateSubscribeBody({ keys: { p256dh: "x", auth: "y" } }),
    false
  );
});

test("validateSubscribeBody: empty endpoint -> false", () => {
  assert.equal(
    validateSubscribeBody({ endpoint: "", keys: { p256dh: "x", auth: "y" } }),
    false
  );
});

test("validateSubscribeBody: missing keys -> false", () => {
  assert.equal(validateSubscribeBody({ endpoint: "https://push.example.com" }), false);
});

test("validateSubscribeBody: missing p256dh -> false", () => {
  assert.equal(
    validateSubscribeBody({
      endpoint: "https://push.example.com",
      keys: { auth: "y" }
    }),
    false
  );
});

test("validateSubscribeBody: missing auth -> false", () => {
  assert.equal(
    validateSubscribeBody({
      endpoint: "https://push.example.com",
      keys: { p256dh: "x" }
    }),
    false
  );
});

test("validateSubscribeBody: valid payload -> true", () => {
  assert.equal(
    validateSubscribeBody({
      endpoint: "https://push.example.com/send/abc",
      keys: { p256dh: "key256", auth: "authkey" }
    }),
    true
  );
});
