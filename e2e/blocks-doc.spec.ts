import { test, expect } from "@playwright/test";
import { gotoApp, addBlock, blocksOfKind, createTask } from "./helpers";

test.describe("document blocks", () => {
  test("adding a doc opens the fullscreen editor", async ({ page }) => {
    await gotoApp(page);
    await addBlock(page, "doc");
    await expect(page.getByTestId("doc-fullscreen")).toBeVisible();
  });

  test("edit title and body, then collapse shows a preview", async ({ page }) => {
    await gotoApp(page);
    await createTask(page, "Doc test");
    await addBlock(page, "doc");

    await page.getByTestId("doc-title-input").fill("Meeting notes");
    const editor = page.getByTestId("doc-editor");
    await editor.click();
    await editor.pressSequentially("Discussed the Q3 roadmap");
    await editor.blur();

    await page.getByTestId("doc-done").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeHidden();

    const doc = blocksOfKind(page, "doc").first();
    await expect(doc).toContainText("Meeting notes");
    await expect(doc).toContainText("Discussed the Q3 roadmap");
  });

  test("bold formatting round-trips through markdown", async ({ page }) => {
    await gotoApp(page);
    await createTask(page, "Bold test");
    await addBlock(page, "doc");

    const editor = page.getByTestId("doc-editor");
    await editor.click();
    await editor.pressSequentially("important line");
    await page.keyboard.press("Control+A");
    await page.getByTestId("doc-tb-bold").click();
    await editor.blur();

    // Close and reopen — the bold must survive the markdown round-trip.
    await page.getByTestId("doc-done").click();
    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeVisible();
    await expect(page.locator('[data-testid="doc-editor"] strong, [data-testid="doc-editor"] b')).toHaveCount(1);
  });

  test("close the editor with Escape and with Back", async ({ page }) => {
    await gotoApp(page);
    // Open an existing doc block from the active task.
    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("doc-fullscreen")).toBeHidden();

    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();
    await page.getByTestId("doc-back").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeHidden();
  });
});
