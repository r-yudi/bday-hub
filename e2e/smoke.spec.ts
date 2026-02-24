import { expect, test, type Page } from "@playwright/test";

function todayDayMonth() {
  const now = new Date();
  return {
    day: String(now.getDate()),
    month: String(now.getMonth() + 1)
  };
}

async function gotoTodayReady(page: Page) {
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(page.getByText("Carregando...")).toHaveCount(0);
}

async function addBirthday(page: Page, options?: { name?: string; notes?: string; tag?: string }) {
  const { day, month } = todayDayMonth();
  const name = options?.name ?? `E2E ${Date.now()}`;
  const notes = options?.notes ?? "Criado via Playwright";
  const tag = options?.tag ?? "e2e";

  await gotoTodayReady(page);
  await page.getByRole("link", { name: "Adicionar" }).click();

  await page.getByPlaceholder("Ex.: Ana Silva").fill(name);
  await page.locator("form select").nth(0).selectOption(day);
  await page.locator("form select").nth(1).selectOption(month);
  await page.getByPlaceholder("Digite e pressione Enter").fill(tag);
  await page.getByPlaceholder("Digite e pressione Enter").press("Enter");
  await page.getByPlaceholder("Observações").fill(notes);
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("Carregando...")).toHaveCount(0);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  return { name, notes, tag };
}

function encodeShareToken(payload: { name: string; day: number; month: number; issuedAt: number }) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test.describe("MVP smoke flows", () => {
  test("CRUD de aniversario (add, edit, delete)", async ({ page }) => {
    const created = await addBirthday(page, { name: `CRUD ${Date.now()}`, notes: "Nota inicial", tag: "crud" });

    await page.getByRole("link", { name: "Editar" }).first().click();
    await expect(page).toHaveURL(/\/person\?id=/);

    const updatedName = `${created.name} Editado`;
    await page.getByPlaceholder("Ex.: Ana Silva").fill(updatedName);
    await page.getByPlaceholder("Observações").fill("Nota editada via e2e");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
    await expect(page.getByText("Nota editada via e2e")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Excluir" }).first().click();

    await expect(page.getByRole("heading", { name: updatedName })).toHaveCount(0);
  });

  test("Import CSV com preview e importacao", async ({ page }) => {
    const { day, month } = todayDayMonth();
    const csv = [
      "name,day,month,tags,whatsapp,instagram,notes",
      `CSV Válido ${Date.now()},${day},${month},e2e;csv,,,Importado pelo Playwright`,
      ",31,2,,,,"
    ].join("\n");

    await gotoTodayReady(page);
    await page.getByRole("button", { name: "Importar CSV" }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: "playwright-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8")
    });

    await expect(page.getByText(/^Válidas: 1$/)).toBeVisible();
    await expect(page.getByText(/^Inválidas: 1$/)).toBeVisible();

    await page.getByRole("button", { name: /^Importar$/ }).click();
    await expect(page.getByText("Carregando...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /CSV Válido/ })).toBeVisible();
  });

  test("Persistencia apos reload", async ({ page }) => {
    const created = await addBirthday(page, { name: `Persist ${Date.now()}`, notes: "Persistir apos reload", tag: "persist" });

    await page.reload();
    await expect(page.getByText("Carregando...")).toHaveCount(0);

    await expect(page.getByRole("heading", { name: created.name })).toBeVisible();
    await expect(page.getByText("Persistir apos reload")).toBeVisible();
  });

  test("/share/[token] -> Adicionar a lista", async ({ page }) => {
    const now = new Date();
    const token = encodeShareToken({
      name: `Share E2E ${Date.now()}`,
      day: now.getDate(),
      month: now.getMonth() + 1,
      issuedAt: Date.now()
    });

    await page.goto(`/share/${token}`);
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Share E2E/ })).toBeVisible();

    await page.getByRole("button", { name: "Adicionar à minha lista" }).click();
    await expect(page.getByRole("button", { name: "Adicionado à minha lista" })).toBeVisible();
    await page.getByRole("button", { name: "Ver minha lista" }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText("Carregando...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Share E2E/ })).toBeVisible();
    await expect(page.getByText("compartilhado")).toBeVisible();
  });
});
