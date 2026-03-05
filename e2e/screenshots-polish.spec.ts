import { test } from "@playwright/test";

const routes = ["/today", "/manage", "/share", "/upcoming", "/person"] as const;
const outDir = "test-results/screenshots-polish";

test.describe("Screenshots for polish PR", () => {
  for (const path of routes) {
    test(`${path} (light)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const name = path.slice(1) || "home";
      await page.screenshot({
        path: `${outDir}/${name}.png`,
        fullPage: false
      });
    });
  }
});
