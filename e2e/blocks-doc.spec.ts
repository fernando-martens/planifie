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
    const editor = page.locator('[data-testid="doc-editor"] .bn-editor');
    await editor.click();
    await page.keyboard.type("Discussed the Q3 roadmap");
    await editor.blur();

    await page.getByTestId("doc-done").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeHidden();

    const doc = blocksOfKind(page, "doc").first();
    await expect(doc).toContainText("Meeting notes");
    await expect(doc).toContainText("Discussed the Q3 roadmap");
  });

  test("bold formatting round-trips through the saved document", async ({ page }) => {
    await gotoApp(page);
    // Open an existing (empty) seed doc — a freshly-created doc's editor races
    // its first debounced save under machine-speed input, dropping the mark.
    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();
    await expect(page.getByTestId("doc-fullscreen")).toBeVisible();

    const editor = page.locator('[data-testid="doc-editor"] .bn-editor');
    await editor.click();
    // Enable bold first (stored mark), then type — the text is written bold.
    await page.keyboard.press("Control+b");
    await page.keyboard.type("important line");
    // Wait for the mark to render before closing.
    await expect(page.locator('[data-testid="doc-editor"] strong')).toHaveCount(1);
    await editor.blur();

    // Close and reopen — the bold must survive the save/restore round-trip.
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
