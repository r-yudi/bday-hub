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

async function expectTodayPageLoaded(page: Page) {
  await expect(page.locator('[data-page-canonical="today"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: /Aniversários/, level: 1 })).toBeVisible();
  await expect(page.getByText("Carregando...")).toHaveCount(0);
}

async function gotoTodayReady(page: Page, options?: { showOnboarding?: boolean }) {
  await page.goto("/today");
  if (!options?.showOnboarding) {
    await page.evaluate(() => localStorage.setItem("onboarding_v2_seen", "1"));
    await page.reload();
  }
  await expectTodayPageLoaded(page);
}

async function gotoSettingsReady(page: Page) {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lembretes por email" })).toBeVisible();
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
  await page.getByPlaceholder("Ex: chama de Ju, ama café, sempre mando áudio").fill(notes);
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

    await page.getByRole("link", { name: created.name }).click();
    await expect(page).toHaveURL(/\/person\?id=/);

    const updatedName = `${created.name} Editado`;
    await page.getByPlaceholder("Ex.: Ana Silva").fill(updatedName);
    await page.getByPlaceholder("Ex: chama de Ju, ama café, sempre mando áudio").fill("Nota editada via e2e");
    await page.getByPlaceholder("Ex: Ju, titia, Dr. Paulo").fill("JuE2E");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();

    await page.getByRole("link", { name: updatedName }).click();
    await expect(page).toHaveURL(/\/person\?id=/);
    await expect(page.getByPlaceholder("Ex: Ju, titia, Dr. Paulo")).toHaveValue("JuE2E");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /Excluir/ }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.locator('[data-page-canonical="today"]').getByRole("heading", { name: updatedName })).toHaveCount(0);
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
    await expect(page.getByRole("heading", { name: /Aniversários/, level: 1 })).toBeVisible();
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

    const todayRoot = page.locator('[data-page-canonical="today"]');
    await expect(todayRoot.getByRole("heading", { name: created.name })).toBeVisible();
    await expect(todayRoot.getByRole("button", { name: "Dar parabéns" })).toBeVisible();
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
    await expect(page.getByText(/Salvo na sua lista neste aparelho/)).toBeVisible();
    await page.getByRole("button", { name: "Ver minha lista" }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText("Carregando...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Share E2E/ })).toBeVisible();
    // Categoria "Compartilhado" (import via link) aparece na lista em /people — não no item compacto de /today.
    await page.goto("/people");
    await expect(page.getByText("Carregando...")).toHaveCount(0);
    await expect(
      page.locator('section[aria-label="Lista de aniversários"]').getByText("Compartilhado", { exact: true })
    ).toBeVisible();
  });

  test("Lembretes por email section on /settings (guest: CTA)", async ({ page }) => {
    await gotoSettingsReady(page);
    await expect(page.getByRole("heading", { name: "Lembretes por email" })).toBeVisible();
    await expect(page.getByText("Faça login para ativar emails")).toBeVisible();
    const emailCard = page.getByRole("heading", { name: "Lembretes por email" }).locator("..");
    await expect(emailCard.getByRole("link", { name: "Entrar com Google" })).toBeVisible();
  });

  test("Notificações no dispositivo on /settings: guest sees instruction and CTA", async ({ page }) => {
    await gotoSettingsReady(page);
    await expect(page.getByRole("heading", { name: "Notificações no dispositivo" })).toBeVisible();
    await expect(
      page.getByText(/Neste aparelho: entre na sua conta e abra o Lembra a partir da tela inicial/)
    ).toBeVisible();
    const pushCard = page.getByRole("heading", { name: "Notificações no dispositivo" }).locator("..");
    await expect(pushCard.getByRole("link", { name: "Entrar com Google" })).toBeVisible();
  });

  test("TopNav: navegar para Pessoas", async ({ page }) => {
    await page.goto("/today");
    await page.evaluate(() => localStorage.setItem("onboarding_v2_seen", "1"));
    await page.reload();
    await expectTodayPageLoaded(page);
    await page.getByRole("link", { name: "Pessoas" }).click();
    await expect(page).toHaveURL(/\/people$/);
    await expect(page.getByRole("link", { name: "Adicionar" }).first()).toBeVisible();
  });

  test("TopNav: navegar para Configurações", async ({ page }) => {
    await page.goto("/today");
    await page.evaluate(() => localStorage.setItem("onboarding_v2_seen", "1"));
    await page.reload();
    await expectTodayPageLoaded(page);
    await page.getByRole("link", { name: "Configurações" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lembretes por email" })).toBeVisible();
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

    // Sentinela canônica da página + prova de build completo
    await expect(page.locator('[data-page-canonical="login"]')).toBeVisible();
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

test.describe("Páginas críticas (sentinelas)", () => {
  test("/today exibe sentinela e heading principal", async ({ page }) => {
    await page.goto("/today");
    await page.evaluate(() => localStorage.setItem("onboarding_v2_seen", "1"));
    await page.reload();
    await expect(page).toHaveURL(/\/today/);
    await expectTodayPageLoaded(page);
  });

  test("/person exibe sentinela e heading principal", async ({ page }) => {
    await page.goto("/person");
    await expect(page).toHaveURL(/\/person/);
    await expect(page.locator('[data-page-canonical="person"]')).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Adicionar pessoa|Editar pessoa/, level: 1 })
    ).toBeVisible();
  });

  test("/people exibe sentinela e heading principal", async ({ page }) => {
    await page.goto("/people");
    await expect(page).toHaveURL(/\/people/);
    await expect(page.locator('[data-page-canonical="people"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pessoas", level: 1 })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /Aniversários/, level: 1 })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /Aniversários/, level: 1 })).toBeVisible();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toBeVisible();
    await page.getByRole("button", { name: "Continuar sem conta" }).click();
    await expect(page.getByRole("heading", { name: "Adicionar aniversários" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continuar|Pular por agora/ })).toBeVisible();
    await page.getByRole("button", { name: "Fechar onboarding" }).click();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: /Aniversários/, level: 1 })).toBeVisible();
    await expect(page.getByText("Sincronize em todos os dispositivos")).toHaveCount(0);
  });
});

test.describe("Notificações no dispositivo logado não-standalone", () => {
  const authPath = join(process.cwd(), "test-results", ".auth", "user.json");
  const hasAuth = existsSync(authPath);
  if (hasAuth) test.use({ storageState: authPath });
  test.skip(!hasAuth, "Requer storageState logado (test-results/.auth/user.json). Gerar: login em /login e salvar storageState.");

  test("mostra instrução de instalar em /settings e não mostra ativar/desativar dispositivo", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByText(/Para receber notificações.*adicione o Lembra à tela inicial/)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Como instalar" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Ativar notificações neste aparelho|Desativar notificações no dispositivo/ })
    ).toHaveCount(0);
  });
});
