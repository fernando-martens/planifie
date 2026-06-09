import { test, expect } from "@playwright/test";
import { readFile } from "fs/promises";
import { gotoApp, blocksOfKind } from "./helpers";

test.describe("export", () => {
  test("export the whole task as markdown", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("export-button").click();

    const dialog = page.getByTestId("export-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("export-preview")).toContainText("# Thinking in Systems — notes");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-confirm").click(),
    ]);

    expect(download.suggestedFilename()).toBe("Thinking-in-Systems-notes.md");
    const path = await download.path();
    const content = await readFile(path, "utf-8");
    expect(content).toContain("# Thinking in Systems — notes");
    expect(content).toContain("Tags:");
    await expect(dialog).toBeHidden();
  });

  test("export as PDF downloads a generated .pdf file", async ({ page }) => {
    await gotoApp(page);

    await page.getByTestId("export-button").click();
    await page.getByTestId("export-format-pdf").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-confirm").click(),
    ]);

    expect(download.suggestedFilename()).toBe("Thinking-in-Systems-notes.pdf");
    const path = await download.path();
    const buf = await readFile(path);
    // A valid PDF starts with the "%PDF-" magic bytes.
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    await expect(page.getByTestId("export-dialog")).toBeHidden();
  });

  test("export a single document from the fullscreen editor", async ({ page }) => {
    await gotoApp(page);
    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();

    // Seed docs start empty; write a line so the block-scope export has content.
    const editor = page.locator('[data-testid="doc-editor"] .bn-editor');
    await editor.click();
    await page.keyboard.type("Exported body line");
    // Let the debounced save flush the derived markdown cache before exporting.
    await page.waitForTimeout(400);

    await page.getByTestId("doc-export").click();

    const dialog = page.getByTestId("export-dialog");
    await expect(dialog).toBeVisible();
    // Block-scope export: preview is the doc's title (as a heading) + body.
    const preview = page.getByTestId("export-preview");
    await expect(preview).toContainText("# Highlights — Meadows");
    await expect(preview).toContainText("Exported body line");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-confirm").click(),
    ]);
    expect(download.suggestedFilename()).toBe("Highlights-Meadows.md");
    const content = await readFile(await download.path(), "utf-8");
    expect(content).toContain("# Highlights — Meadows");
  });
});
