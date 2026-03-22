import test from "node:test";
import assert from "node:assert/strict";
import {
  formatInstagramForInput,
  formatWhatsappForInput,
  persistInstagramLink,
  persistWhatsappLink
} from "@/lib/personLinks";

test("WhatsApp: número BR 11 dígitos → wa.me com 55", () => {
  assert.equal(persistWhatsappLink("11 98765-4321"), "https://wa.me/5511987654321");
});

test("WhatsApp: já com 55", () => {
  assert.equal(persistWhatsappLink("5511987654321"), "https://wa.me/5511987654321");
});

test("WhatsApp: URL legada preservada", () => {
  assert.equal(persistWhatsappLink("https://wa.me/5511999887766"), "https://wa.me/5511999887766");
});

test("WhatsApp: formato display a partir de URL", () => {
  assert.equal(formatWhatsappForInput("https://wa.me/5511987654321"), "11987654321");
});

test("Instagram: @user → URL", () => {
  assert.equal(persistInstagramLink("@ana"), "https://instagram.com/ana");
});

test("Instagram: URL legada preservada", () => {
  assert.equal(persistInstagramLink("https://instagram.com/ana"), "https://instagram.com/ana");
});

test("Instagram: display a partir de URL", () => {
  assert.equal(formatInstagramForInput("https://instagram.com/ana%20silva"), "ana silva");
});
