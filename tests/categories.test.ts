import test from "node:test";
import assert from "node:assert/strict";
import {
  extractCategoriesFromPerson,
  findCloseCategorySuggestion,
  mergeSuggestions,
  normalizeCategory,
  toCategoryArray
} from "@/lib/categories";

test("normalizeCategory remove acento/case/espaços e deduplica chave", () => {
  assert.equal(normalizeCategory("  Curso de Inglês  "), "curso de ingles");
  assert.equal(normalizeCategory("curso-de-ingles"), "curso de ingles");
});

test("toCategoryArray suporta string simples e separadores CSV", () => {
  assert.deepEqual(toCategoryArray("amigos; trabalho | escola, faculdade"), ["amigos", "trabalho", "escola", "faculdade"]);
  assert.deepEqual(toCategoryArray(["curso; inglês", "outros"]), ["curso", "inglês", "outros"]);
});

test("extractCategoriesFromPerson lê categories/tags/category legado", () => {
  const person = {
    categories: ["Família", "Curso de Inglês"],
    tags: ["amigos", "curso de ingles"],
    category: "Trabalho"
  };

  assert.deepEqual(extractCategoriesFromPerson(person), ["Família", "Curso de Inglês", "amigos", "Trabalho"]);
});

test("mergeSuggestions inclui predefinidas + usadas + user_categories com dedupe", () => {
  const merged = mergeSuggestions(["Família", "Amigos"], ["curso de ingles", "Trabalho"], ["Curso de Inglês", "Faculdade"]);

  assert.ok(merged.includes("Família"));
  assert.ok(merged.includes("Amigos"));
  assert.ok(merged.includes("Trabalho"));
  assert.ok(merged.includes("Curso de Inglês") || merged.includes("curso de ingles"));
  assert.equal(merged.filter((v) => normalizeCategory(v) === "curso de ingles").length, 1);
});

test("findCloseCategorySuggestion sugere categoria próxima", () => {
  const suggestion = findCloseCategorySuggestion("infles", ["Inglês", "Trabalho"]);
  assert.equal(suggestion, "Inglês");
});
