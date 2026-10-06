import { expect, test } from "@playwright/test";

test("unknown URLs render the native animated 404 before redirecting home", async ({ page }) => {
  await page.clock.install();
  const response = await page.goto("/pagina-inexistente");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Até um olhar crítico pode se perder." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(
    await page.locator("main").evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBeGreaterThan(0);
  // The home route requires authentication, so visitors continue to login.
  await page.clock.fastForward(8000);
  await expect(page).toHaveURL(/\/login$/);
});

test("nested unknown URLs support mobile and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/olimpo/pagina-inexistente");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Vamos voltar ao jogo?" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.locator("main").evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.getByRole("link", { name: "Voltar para o início" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
