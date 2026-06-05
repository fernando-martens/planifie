import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("sidebar", () => {
  test("drag the resizer to change the sidebar width", async ({ page }) => {
    await gotoApp(page);
    const resizer = page.getByTestId("sidebar-resizer");
    const box = await resizer.boundingBox();
    expect(box).not.toBeNull();
    const y = box!.y + box!.height / 2;

    await page.mouse.move(box!.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(320, y, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("app")).toHaveAttribute("style", /--sidebar-w:\s*320px/);
  });

  test("double-click resets the sidebar width to the default", async ({ page }) => {
    await gotoApp(page);
    const resizer = page.getByTestId("sidebar-resizer");
    const box = await resizer.boundingBox();
    const y = box!.y + box!.height / 2;

    // Move it first, then reset.
    await page.mouse.move(box!.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(360, y, { steps: 3 });
    await page.mouse.up();
    await expect(page.getByTestId("app")).toHaveAttribute("style", /--sidebar-w:\s*360px/);

    await resizer.dblclick();
    await expect(page.getByTestId("app")).toHaveAttribute("style", /--sidebar-w:\s*268px/);
  });

  test("width is clamped to the max", async ({ page }) => {
    await gotoApp(page);
    const resizer = page.getByTestId("sidebar-resizer");
    const box = await resizer.boundingBox();
    const y = box!.y + box!.height / 2;

    await page.mouse.move(box!.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(900, y, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("app")).toHaveAttribute("style", /--sidebar-w:\s*460px/);
  });

  test("search toggle opens a focused input and Escape closes it", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("task-search-toggle").click();
    const input = page.getByTestId("task-search-input");
    await expect(input).toBeFocused();
    await input.press("Escape");
    await expect(page.getByTestId("task-search-input")).toHaveCount(0);
  });
});
