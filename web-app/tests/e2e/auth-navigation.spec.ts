import { expect, test } from "@playwright/test";

test("slides the shared panels between registration and login in both directions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  const intro = page.locator("main > div").first();
  const form = page.locator("main > div").last();
  const initialIntro = (await intro.boundingBox())!;
  const initialForm = (await form.boundingBox())!;
  expect(initialIntro.x).toBeLessThan(initialForm.x);

  // Keep the actual DOM nodes to ensure navigation does not remount the panels.
  await page.evaluate(() => {
    Object.assign(window, { authPanels: [...document.querySelectorAll("main > div")] });
  });
  await page.getByRole("link", { name: "Entrar agora" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const saved = (window as Window & { authPanels?: Element[] }).authPanels;
      return saved?.every((node, index) => node === document.querySelectorAll("main > div")[index]);
    }),
  ).toBe(true);
  await expect.poll(() => intro.evaluate((node) => node.getAnimations().length)).toBeGreaterThan(0);
  await expect.poll(async () => (await form.boundingBox())!.x).toBeCloseTo(initialIntro.x, 0);
  expect((await intro.boundingBox())!.x).toBeCloseTo(initialForm.x, 0);

  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect.poll(async () => (await form.boundingBox())!.x).toBeCloseTo(initialForm.x, 0);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(async () => (await form.boundingBox())!.x).toBeCloseTo(initialIntro.x, 0);
});

test("supports direct login, mobile layout and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  expect(
    await page
      .locator("main > div")
      .first()
      .evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
