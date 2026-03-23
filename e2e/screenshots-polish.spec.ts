import { expect, test } from "@playwright/test";

/** Matches `THEME_STORAGE_KEY` in `lib/theme.ts` (avoid importing app code into e2e). */
const THEME_STORAGE_KEY = "lembra_theme";

const outDir = "test-results/screenshots-polish";

/** Same encoding as `e2e/smoke.spec.ts` / `lib/share.ts` (preview only). */
function encodeShareTokenForScreenshot(payload: {
  name: string;
  day: number;
  month: number;
  issuedAt: number;
}) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function routeToBasename(path: string) {
  if (path === "/people?tab=categories") return "people-categories";
  if (path === "/") return "landing";
  return path.slice(1).replace(/\//g, "-") || "home";
}

const lightRoutes = [
  "/",
  "/today",
  "/manage",
  "/share",
  "/upcoming",
  "/person",
  "/people",
  "/people?tab=categories",
  "/settings"
] as const;

test.describe("Screenshots for polish PR", () => {
  for (const path of lightRoutes) {
    test(`${path} (light)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const name = routeToBasename(path);
      await page.screenshot({
        path: `${outDir}/${name}.png`,
        fullPage: false
      });
    });
  }

  test("/share/[token] valid (light)", async ({ page }) => {
    const token = encodeShareTokenForScreenshot({
      name: "Convite ilustrativo",
      day: 12,
      month: 6,
      issuedAt: Date.now()
    });
    await page.goto(`/share/${token}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-share-token-state="valid"]')).toBeVisible();
    await page.screenshot({
      path: `${outDir}/share-token-valid.png`,
      fullPage: false
    });
  });

  test("/share/[token] invalid (light)", async ({ page }) => {
    await page.goto("/share/not-a-valid-share-payload");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-share-token-state="invalid"]')).toBeVisible();
    await page.screenshot({
      path: `${outDir}/share-token-invalid.png`,
      fullPage: false
    });
  });

  test("/people with CSV import open (light)", async ({ page }) => {
    await page.goto("/people");
    await page.waitForLoadState("networkidle");
    // Com lista vazia há dois botões "Importar CSV" (barra e vazio); o da barra vem primeiro.
    await page.getByRole("button", { name: /Importar CSV/i }).first().click();
    await expect(page.getByText("Escolher arquivo .csv")).toBeVisible();
    await page.screenshot({
      path: `${outDir}/people-import-csv.png`,
      fullPage: false
    });
  });

  const darkSubset = [
    "/",
    "/today",
    "/manage",
    "/upcoming",
    "/person",
    "/people",
    "/people?tab=categories",
    "/share",
    "/settings"
  ] as const;

  for (const path of darkSubset) {
    test(`${path} (dark)`, async ({ page }) => {
      await page.addInitScript((key: string) => {
        localStorage.setItem(key, "dark");
      }, THEME_STORAGE_KEY);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const name = routeToBasename(path);
      await page.screenshot({
        path: `${outDir}/${name}-dark.png`,
        fullPage: false
      });
    });
  }

  test("/share/[token] valid (dark)", async ({ page }) => {
    await page.addInitScript((key: string) => {
      localStorage.setItem(key, "dark");
    }, THEME_STORAGE_KEY);
    const token = encodeShareTokenForScreenshot({
      name: "Convite ilustrativo",
      day: 12,
      month: 6,
      issuedAt: Date.now()
    });
    await page.goto(`/share/${token}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-share-token-state="valid"]')).toBeVisible();
    await page.screenshot({
      path: `${outDir}/share-token-valid-dark.png`,
      fullPage: false
    });
  });

  test("/share/[token] invalid (dark)", async ({ page }) => {
    await page.addInitScript((key: string) => {
      localStorage.setItem(key, "dark");
    }, THEME_STORAGE_KEY);
    await page.goto("/share/not-a-valid-share-payload");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-share-token-state="invalid"]')).toBeVisible();
    await page.screenshot({
      path: `${outDir}/share-token-invalid-dark.png`,
      fullPage: false
    });
  });
});
