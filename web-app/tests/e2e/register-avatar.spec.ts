import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const screenshotDirectory = path.join(process.cwd(), "validation", "register-avatar");

async function openEditor(page: Page) {
  await page.getByRole("button", { name: "Editar avatar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Personalize seu avatar" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("shows the preview, all controls and actions side by side without desktop scrolling", async ({
  page,
}) => {
  await page.goto("/register");
  const dialog = await openEditor(page);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() => dialog.evaluate((node) => node.scrollHeight <= node.clientHeight + 1))
      .toBe(true);
    const preview = await dialog
      .getByRole("region", { name: "Prévia do personagem" })
      .boundingBox();
    const controls = await dialog
      .getByRole("region", { name: "Personalizar avatar" })
      .boundingBox();
    expect(preview!.x + preview!.width).toBeLessThan(controls!.x);
    const bounds = (await dialog.boundingBox())!;
    for (const name of ["Fechar editor de avatar", "Coroa real", "Salvar avatar", "Cancelar"]) {
      const button = (await dialog.getByRole("button", { name, exact: true }).boundingBox())!;
      expect(button.y).toBeGreaterThanOrEqual(bounds.y);
      expect(button.y + button.height).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
  }
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDirectory, "desktop-horizontal.png") });
});

async function expectHintPlacement(page: Page) {
  const tooltip = page.getByRole("tooltip");
  const avatar = page.getByRole("button", { name: "Editar avatar", exact: true });
  const introduction = page.getByText("Personalize seu perfil e entre no jogo.", { exact: true });
  await expect
    .poll(async () => {
      const hintBounds = await tooltip.boundingBox();
      const avatarBounds = await avatar.boundingBox();
      const introBounds = await introduction.boundingBox();
      return Boolean(
        hintBounds &&
        avatarBounds &&
        introBounds &&
        hintBounds.y >= introBounds.y + introBounds.height &&
        hintBounds.y + hintBounds.height <= avatarBounds.y &&
        hintBounds.x >= 0 &&
        hintBounds.x + hintBounds.width <= (await page.evaluate(() => innerWidth)),
      );
    })
    .toBe(true);
}

test("shows the introductory avatar tooltip and dismisses it after eight seconds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.install();
  await page.goto("/register");
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Tenha seu próprio estilo");
  await expect(tooltip).toContainText("Seu avatar é editável. Clique para personalizar.");
  await expectHintPlacement(page);
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDirectory, "desktop-tooltip.png") });
  await page.clock.fastForward(8_000);
  await expect(tooltip).not.toBeVisible();
});

test("dismisses the avatar tooltip when opening the editor on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Tenha seu próprio estilo");
  await expectHintPlacement(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDirectory, "mobile-tooltip.png"),
    fullPage: true,
  });
  await openEditor(page);
  await expect(tooltip).not.toBeVisible();
});

test("saves all avatar choices and keeps the registration preview cropped to the face", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/register");
  const editButton = page.getByRole("button", { name: "Editar avatar", exact: true });
  await expect(editButton).toBeVisible();
  const face = editButton.locator("svg[viewBox='25 0 270 270']");
  await expect(face).toBeVisible();
  await expect(face.locator('[data-layer="body"]')).toHaveCount(0);
  const previewStyle = await face.evaluate((node) => {
    const style = getComputedStyle(node.parentElement!);
    return { radius: style.borderRadius, overflow: style.overflow };
  });
  expect(previewStyle.overflow).toBe("hidden");
  expect(parseFloat(previewStyle.radius)).toBeGreaterThanOrEqual(48);

  const dialog = await openEditor(page);
  for (const skin of [
    "Pele clara",
    "Pele bege",
    "Pele dourada",
    "Pele castanha",
    "Pele marrom",
    "Pele retinta",
  ]) {
    await expect(dialog.getByRole("button", { name: skin, exact: true })).toBeVisible();
  }
  for (const option of [
    "Masculino",
    "Feminino",
    "Túnica clássica",
    "Armadura heroica",
    "Manto do Egeu",
    "Coroa de louros",
    "Elmo grego",
    "Coroa real",
  ]) {
    await expect(dialog.getByRole("button", { name: option, exact: true })).toBeVisible();
  }
  for (const option of ["Feminino", "Pele retinta", "Manto do Egeu", "Coroa real"]) {
    await dialog.getByRole("button", { name: option, exact: true }).click();
    await expect(dialog.getByRole("button", { name: option, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDirectory, "desktop-editor.png") });
  await dialog.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.screenshot({ path: path.join(screenshotDirectory, "desktop-preview.png") });
  await dialog.getByRole("button", { name: "Salvar avatar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(editButton).toBeFocused();
  await expect(face.locator('[data-layer="hair-back"]')).toHaveCount(1);
  await page.screenshot({
    path: path.join(screenshotDirectory, "desktop-register.png"),
    fullPage: true,
  });
  await openEditor(page);
  for (const option of ["Feminino", "Pele retinta", "Manto do Egeu", "Coroa real"]) {
    await expect(dialog.getByRole("button", { name: option, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
});

test("discards changes on Cancel and Escape and restores focus to the edit button", async ({
  page,
}) => {
  await page.goto("/register");
  const editButton = page.getByRole("button", { name: "Editar avatar", exact: true });
  for (const closeMethod of ["cancel", "escape"] as const) {
    const dialog = await openEditor(page);
    await dialog.getByRole("button", { name: "Feminino", exact: true }).click();
    await dialog.getByRole("button", { name: "Pele retinta", exact: true }).click();
    if (closeMethod === "cancel") {
      await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(dialog).not.toBeVisible();
    await expect(editButton).toBeFocused();
    await openEditor(page);
    await expect(dialog.getByRole("button", { name: "Masculino", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "Pele dourada", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("Escape");
  }
});

test("supports the editor on a narrow mobile viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dialog = await openEditor(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await dialog.getByRole("button", { name: "Feminino", exact: true }).click();
  await dialog.getByRole("button", { name: "Armadura heroica", exact: true }).click();
  await dialog.getByRole("button", { name: "Elmo grego", exact: true }).click();
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDirectory, "mobile-editor.png") });
  await dialog.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.screenshot({ path: path.join(screenshotDirectory, "mobile-preview.png") });
  await dialog.getByRole("button", { name: "Salvar avatar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.screenshot({
    path: path.join(screenshotDirectory, "mobile-register.png"),
    fullPage: true,
  });
  await openEditor(page);
  await expect(
    dialog.getByRole("button", { name: "Armadura heroica", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "Elmo grego", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
