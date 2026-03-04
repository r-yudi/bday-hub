import { mkdirSync } from "node:fs";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

const ROUTES_DESKTOP = ["/", "/today", "/upcoming", "/person", "/manage", "/share", "/login", "/privacy", "/terms"] as const;
const ROUTES_MOBILE = ["/", "/today", "/manage", "/share"] as const;

async function prepareThemeContext(browser: Browser, theme: "light" | "dark", mobile = false): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1365, height: 900 },
    deviceScaleFactor: mobile ? 3 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    userAgent: mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
    reducedMotion: "reduce"
  });

  await context.addInitScript(
    ({ themeMode }) => {
      window.localStorage.setItem("lembra_theme", themeMode);
      window.sessionStorage.setItem("lembra_landing_sparkles_seen", "1");
    },
    { themeMode: theme }
  );

  return context;
}

async function assertNoRuntimeError(page: Page) {
  await expect(page.getByText("Runtime Error")).toHaveCount(0);
  await expect(page.getByText("Application error")).toHaveCount(0);
}

async function captureRoute(page: Page, route: string, fileLabel: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await assertNoRuntimeError(page);
  await page.screenshot({ path: `test-results/visual-regression/${fileLabel}.png`, fullPage: false });
}

test.describe("Visual regression prep (screenshots)", () => {
  test.beforeAll(() => {
    mkdirSync("test-results/visual-regression", { recursive: true });
  });

  test("capture desktop light/dark route matrix", async ({ browser }) => {
    await test.step("desktop light", async () => {
      const context = await prepareThemeContext(browser, "light", false);
      const page = await context.newPage();

      for (const route of ROUTES_DESKTOP) {
        const label = `desktop-light-${route === "/" ? "home" : route.slice(1).replace(/[\\/]/g, "-")}`;
        await captureRoute(page, route, label);
      }

      // Landing proof: fullpage + hero fold (Side Blast).
      await page.goto("/", { waitUntil: "networkidle" });
      await page.screenshot({
        path: "test-results/visual-regression/desktop-light-landing-fullpage.png",
        fullPage: true
      });
      const hero = page.locator(".hero-radialcut-section").first();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: "test-results/visual-regression/desktop-light-landing-hero.png" });
      await context.close();
    });

    await test.step("desktop dark", async () => {
      const context = await prepareThemeContext(browser, "dark", false);
      const page = await context.newPage();

      for (const route of ROUTES_DESKTOP) {
        const label = `desktop-dark-${route === "/" ? "home" : route.slice(1).replace(/[\\/]/g, "-")}`;
        await captureRoute(page, route, label);
      }

      await page.goto("/", { waitUntil: "networkidle" });
      await page.screenshot({
        path: "test-results/visual-regression/desktop-dark-landing-fullpage.png",
        fullPage: true
      });
      const hero = page.locator(".hero-radialcut-section").first();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: "test-results/visual-regression/desktop-dark-landing-hero.png" });
      await context.close();
    });
  });

  test("capture mobile light/dark route matrix", async ({ browser }) => {
    for (const theme of ["light", "dark"] as const) {
      const context = await prepareThemeContext(browser, theme, true);
      const page = await context.newPage();

      for (const route of ROUTES_MOBILE) {
        const label = `mobile-${theme}-${route === "/" ? "home" : route.slice(1).replace(/[\\/]/g, "-")}`;
        await captureRoute(page, route, label);
      }

      await page.goto("/", { waitUntil: "networkidle" });
      await page.screenshot({
        path: `test-results/visual-regression/mobile-${theme}-landing-fullpage.png`,
        fullPage: true
      });
      const hero = page.locator(".hero-radialcut-section").first();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/visual-regression/mobile-${theme}-landing-hero.png` });
      await context.close();
    }
  });

  test("capture /campaign Hero Lab (exp-*) desktop + mobile light/dark", async ({ browser }) => {
    const themes: Array<"light" | "dark"> = ["light", "dark"];
    for (const theme of themes) {
      const context = await prepareThemeContext(browser, theme, false);
      const page = await context.newPage();
      await page.goto("/campaign", { waitUntil: "networkidle" });
      await assertNoRuntimeError(page);
      await page.waitForSelector(`.hero-exp-wrap.hero-exp-${theme}`, { timeout: 5000 });
      await page.screenshot({
        path: `test-results/visual-regression/exp-desktop-${theme}-fullpage.png`,
        fullPage: true
      });
      const hero = page.locator(".hero-exp-wrap").first();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/visual-regression/exp-desktop-${theme}-hero.png` });
      await context.close();
    }
    for (const theme of themes) {
      const context = await prepareThemeContext(browser, theme, true);
      const page = await context.newPage();
      await page.goto("/campaign", { waitUntil: "networkidle" });
      await assertNoRuntimeError(page);
      await page.waitForSelector(`.hero-exp-wrap.hero-exp-${theme}`, { timeout: 5000 });
      await page.screenshot({
        path: `test-results/visual-regression/exp-mobile-${theme}-fullpage.png`,
        fullPage: true
      });
      const hero = page.locator(".hero-exp-wrap").first();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/visual-regression/exp-mobile-${theme}-hero.png` });
      await context.close();
    }
  });
});

/*
  Visual proof paths (Radial Cut Explosion hero):
  - test-results/visual-regression/desktop-light-landing-fullpage.png
  - test-results/visual-regression/desktop-light-landing-hero.png
  - test-results/visual-regression/desktop-dark-landing-fullpage.png
  - test-results/visual-regression/desktop-dark-landing-hero.png
  - test-results/visual-regression/mobile-light-landing-fullpage.png
  - test-results/visual-regression/mobile-light-landing-hero.png
  - test-results/visual-regression/mobile-dark-landing-fullpage.png
  - test-results/visual-regression/mobile-dark-landing-hero.png

  Hero Lab /campaign (exp-*):
  - test-results/visual-regression/exp-desktop-light-fullpage.png
  - test-results/visual-regression/exp-desktop-light-hero.png
  - test-results/visual-regression/exp-desktop-dark-fullpage.png
  - test-results/visual-regression/exp-desktop-dark-hero.png
  - test-results/visual-regression/exp-mobile-light-fullpage.png
  - test-results/visual-regression/exp-mobile-light-hero.png
  - test-results/visual-regression/exp-mobile-dark-fullpage.png
  - test-results/visual-regression/exp-mobile-dark-hero.png
*/
