import test from "node:test";
import assert from "node:assert/strict";
import { isInvalidEndpointError } from "@/lib/server/push";

test("isInvalidEndpointError: 410 -> true", () => {
  assert.equal(isInvalidEndpointError("Subscription expired 410"), true);
});

test("isInvalidEndpointError: 404 -> true", () => {
  assert.equal(isInvalidEndpointError("404 Not Found"), true);
});

test("isInvalidEndpointError: Gone -> true", () => {
  assert.equal(isInvalidEndpointError("410 Gone"), true);
  assert.equal(isInvalidEndpointError("Gone"), true);
});

test("isInvalidEndpointError: Not Found -> true", () => {
  assert.equal(isInvalidEndpointError("Not Found"), true);
});

test("isInvalidEndpointError: invalid subscription -> true", () => {
  assert.equal(isInvalidEndpointError("invalid subscription"), true);
});

test("isInvalidEndpointError: other error -> false", () => {
  assert.equal(isInvalidEndpointError("ECONNRESET"), false);
  assert.equal(isInvalidEndpointError("Timeout"), false);
});
