import { test, expect } from "@playwright/test";
import { gotoApp, presetItem, blocksOfKind } from "./helpers";

test.describe("timer presets", () => {
  test("create a custom preset", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("composer-timer").click();
    await expect(page.getByTestId("preset-pop")).toBeVisible();

    await page.getByTestId("preset-custom").click();
    await page.getByTestId("preset-input").fill("Code review");
    await page.getByTestId("preset-commit").click();

    await expect(presetItem(page, "Code review")).toBeVisible();
  });

  test("remove a preset", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("composer-timer").click();
    await expect(presetItem(page, "Meeting")).toBeVisible();

    await page.locator('[data-testid="preset-del"][data-preset-label="Meeting"]').click();
    await expect(presetItem(page, "Meeting")).toHaveCount(0);
  });

  test("using a preset creates a labeled timer block", async ({ page }) => {
    await gotoApp(page);
    const before = await blocksOfKind(page, "timer").count();

    await page.getByTestId("composer-timer").click();
    await presetItem(page, "Writing").click();

    await expect(blocksOfKind(page, "timer")).toHaveCount(before + 1);
    // The newest timer (top of the timeline) carries the preset label.
    await expect(blocksOfKind(page, "timer").first()).toContainText("Writing");
  });
});
