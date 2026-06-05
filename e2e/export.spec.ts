import { test, expect } from "@playwright/test";
import { readFile } from "fs/promises";
import { gotoApp, stubPrint, printCount, blocksOfKind } from "./helpers";

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

  test("export as PDF calls window.print", async ({ page }) => {
    await stubPrint(page);
    await gotoApp(page);

    await page.getByTestId("export-button").click();
    await page.getByTestId("export-format-pdf").click();
    await page.getByTestId("export-confirm").click();

    await expect(page.getByTestId("export-dialog")).toBeHidden();
    expect(await printCount(page)).toBe(1);
  });

  test("export a single document from the fullscreen editor", async ({ page }) => {
    await gotoApp(page);
    await blocksOfKind(page, "doc").first().getByTestId("doc-collapsed").click();
    await page.getByTestId("doc-export").click();

    const dialog = page.getByTestId("export-dialog");
    await expect(dialog).toBeVisible();
    // Block-scope export: preview is the doc's raw markdown.
    await expect(page.getByTestId("export-preview")).toContainText("Thinking in Systems");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-confirm").click(),
    ]);
    expect(download.suggestedFilename()).toBe("Highlights-Meadows.md");
  });
});
