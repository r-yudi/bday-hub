import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

function todayDayMonth() {
  const now = new Date();
  return {
    day: String(now.getDate()),
    month: String(now.getMonth() + 1)
  };
}

async function gotoTodayReady(page: Page, options?: { showOnboarding?: boolean }) {
  await page.goto("/today");
  if (!options?.showOnboarding) {
    await page.evaluate(() => localStorage.setItem("onboarding_v2_seen", "1"));
    await page.reload();
  }
  await expect(page.getByRole("heading", { name: "Hoje", level: 1 })).toBeVisible();
  await expect(page.getByText("Carregando...")).toHaveCount(0);
}

async function gotoSettingsReady(page: Page) {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email diário" })).toBeVisible();
}

async function addBirthday(page: Page, options?: { name?: string; notes?: string; tag?: string }) {
  const { day, month } = todayDayMonth();
  const name = options?.name ?? `E2E ${Date.now()}`;
  const notes = options?.notes ?? "Criado via Playwright";
  const tag = options?.tag ?? "e2e";

  await gotoTodayReady(page);
  await page.getByRole("button", { name: /Adicionar.*aniversário/ }).first().click();
  await page.getByRole("dialog").getByRole("link", { name: "Adicionar pessoa" }).click();

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
    await page.getByRole("button", { name: /Adicionar aniversário/ }).first().click();
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

  test("Entrada rápida em /today: abrir fluxo Adicionar aniversário, colar linhas e importar", async ({ page }) => {
    await gotoTodayReady(page);
    await expect(page.getByRole("heading", { name: "Hoje", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: /Adicionar aniversário/ }).first().click();
    await expect(page.getByRole("heading", { name: "Adicionar aniversários" })).toBeVisible();
    await page.getByRole("button", { name: "Colar vários de uma vez" }).click();
    const quickEntry = page.locator("#quick-birthday-textarea");
    await expect(quickEntry).toBeVisible({ timeout: 5000 });

    await quickEntry.fill("Maria 12/03\nJoão 18/06\nAna 7/9");
    await page.getByRole("button", { name: "Importar aniversários" }).click();
    await expect(page.getByText("Carregando...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Adicionar aniversários" })).toHaveCount(0);
    await expect(page.getByText("Maria").first()).toBeVisible();
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

  test("Email diário section on /settings (guest: CTA)", async ({ page }) => {
    await gotoSettingsReady(page);
    await expect(page.getByRole("heading", { name: "Email diário" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar para ativar email" })).toBeVisible();
  });

  test("Push (complementar) section on /settings: guest sees instruction and CTA", async ({ page }) => {
    await gotoSettingsReady(page);
    await expect(page.getByRole("heading", { name: "Push (complementar)" })).toBeVisible();
    await expect(page.getByText("Notificações push estão disponíveis para contas conectadas")).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar para ativar push" })).toBeVisible();
  });

  test("TopNav: navegar para Pessoas", async ({ page }) => {
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await page.getByRole("link", { name: "Pessoas" }).click();
    await expect(page).toHaveURL(/\/people$/);
    await expect(page.getByRole("link", { name: "Adicionar" }).first()).toBeVisible();
  });

  test("TopNav: navegar para Configurações", async ({ page }) => {
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await page.getByRole("link", { name: "Configurações" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Email diário" })).toBeVisible();
  });

  test("/manage redireciona para /people", async ({ page }) => {
    await page.goto("/manage");
    await expect(page).toHaveURL(/\/people$/);
    await expect(page.getByRole("link", { name: "Adicionar" }).first()).toBeVisible();
  });

  test("aba Categorias em /people?tab=categories mostra título Categorias", async ({ page }) => {
    await page.goto("/people?tab=categories");
    await expect(page).toHaveURL(/\/people\?tab=categories/);
    await expect(page.getByRole("heading", { name: "Categorias" })).toBeVisible();
  });
});

test.describe("Rota /login (versão canônica)", () => {
  test("/login exibe versão canônica: sentinela, heading, CTA, blocos de confiança, sem link Diagnóstico", async ({
    page
  }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);

    // Sentinela: prova de que o build é o canônico
    const loginSection = page.locator('[data-login-canonical="full"]');
    await expect(loginSection).toBeVisible();

    // Heading principal
    await expect(page.getByRole("heading", { name: "Sincronize seus aniversários", level: 1 })).toBeVisible();
    await expect(page.locator('[data-login-heading="main"]')).toBeVisible();

    // Links legais sempre presentes (escopo: dentro do painel de login, não do footer)
    await expect(loginSection.getByRole("link", { name: "Privacidade" })).toBeVisible();
    await expect(loginSection.getByRole("link", { name: "Termos" })).toBeVisible();

    // Em build de produção o link Diagnóstico não deve aparecer
    await expect(page.getByRole("link", { name: "Diagnóstico" })).toHaveCount(0);

    // Quando Supabase está configurado: CTA Google e blocos de confiança
    const cta = page.getByRole("button", { name: "Continuar com Google" });
    if ((await cta.count()) > 0) {
      await expect(cta).toBeVisible();
      await expect(page.locator('[data-login-cta="google"]')).toBeVisible();
      await expect(page.locator('[data-login-disclosure="shared"]')).toBeVisible();
      await expect(page.locator('[data-login-privacy="reassurance"]')).toBeVisible();
      await expect(page.getByText("O que será compartilhado")).toBeVisible();
      await expect(page.getByText("O que NÃO acessamos")).toBeVisible();
    }
  });
});

test.describe("Onboarding gate (logado)", () => {
  const authPath = join(process.cwd(), "test-results", ".auth", "user.json");
  const hasAuth = existsSync(authPath);
  if (hasAuth) test.use({ storageState: authPath });
  test.skip(!hasAuth, "Requer storageState logado (test-results/.auth/user.json).");

  test("logado: wizard step People depois Alertas, Continuar avança", async ({ page }) => {
    await page.goto("/today");
    await page.evaluate(() => localStorage.removeItem("onboarding_v2_seen"));
    await page.goto("/today?onboarding=1");
    await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Adicionar aniversários" })).toBeVisible();
    await page.getByRole("button", { name: /Continuar|Pular por agora/ }).first().click();
    await expect(page.getByRole("heading", { name: "Alertas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { name: "Dicas rápidas" })).toBeVisible();
  });
});

test.describe("Onboarding wizard (guest)", () => {
  test("guest: /today?onboarding=1 mostra wizard, Continuar sem conta, step Adicionar aniversários, fechar (X) e não reaparece após reload", async ({ page }) => {
    await page.goto("/today");
    await page.evaluate(() => localStorage.removeItem("onboarding_v2_seen"));
    await page.goto("/today?onboarding=1");
    await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toBeVisible();
    await page.getByRole("button", { name: "Continuar sem conta" }).click();
    await expect(page.getByRole("heading", { name: "Adicionar aniversários" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continuar|Pular por agora/ })).toBeVisible();
    await page.getByRole("button", { name: "Fechar onboarding" }).click();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toHaveCount(0);
  });
});

test.describe("Push (complementar) logado não-standalone", () => {
  const authPath = join(process.cwd(), "test-results", ".auth", "user.json");
  const hasAuth = existsSync(authPath);
  if (hasAuth) test.use({ storageState: authPath });
  test.skip(!hasAuth, "Requer storageState logado (test-results/.auth/user.json). Gerar: login em /login e salvar storageState.");

  test("mostra instrução de instalar PWA em /settings e não mostra toggle", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Para ativar notificações push, instale o Lembra (PWA) na tela inicial.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Ativar push|Desativar push/ })).toHaveCount(0);
  });
});
