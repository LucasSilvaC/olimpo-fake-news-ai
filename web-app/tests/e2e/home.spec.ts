import { expect, test } from "@playwright/test";

test("removes the standalone parser page and endpoint", async ({ page }) => {
  const response = await page.goto("/extrair");
  expect(response?.status()).toBe(404);
  const extractResponse = await page.request.post("/api/news/extract", {
    data: { url: "https://example.com/news" },
  });
  expect(extractResponse.status()).toBe(404);
});

test("protects the room and keeps the health check public", async ({ page }) => {
  await page.goto("/sala/123456");
  await expect(page).toHaveURL(/\/login$/);
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();
  expect(await healthResponse.json()).toEqual({ status: "ok" });
});
