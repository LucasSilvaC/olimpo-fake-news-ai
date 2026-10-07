import { expect, test } from "@playwright/test";

test("protects the news parser and keeps the health check public", async ({ page }) => {
  await page.goto("/extrair");
  await expect(page).toHaveURL(/\/login$/);
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();
  expect(await healthResponse.json()).toEqual({ status: "ok" });
});
