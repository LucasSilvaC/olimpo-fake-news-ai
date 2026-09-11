import { expect, test } from "@playwright/test";

test("shows the news parser and health check", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "News Parser" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract" })).toBeVisible();
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();
  expect(await healthResponse.json()).toEqual({ status: "ok" });
});
