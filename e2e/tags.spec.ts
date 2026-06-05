import { test, expect } from "@playwright/test";
import { gotoApp, tagChip, tagPopItem } from "./helpers";

test.describe("tags", () => {
  test("attach an existing tag to the active task", async ({ page }) => {
    await gotoApp(page);
    // Active task already has Reading + Personal; attach Work.
    await expect(tagChip(page, "Work")).toHaveCount(0);

    await page.getByTestId("tag-add").click();
    await expect(page.getByTestId("tag-pop")).toBeVisible();
    await tagPopItem(page, "Work").click();

    await expect(tagChip(page, "Work")).toBeVisible();
    // The picker reflects the on-state.
    await expect(tagPopItem(page, "Work")).toHaveAttribute("data-on", "1");
  });

  test("create a tag inline and auto-attach it", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("tag-add").click();
    await page.getByTestId("tag-pop-search").fill("Urgent");

    const create = page.getByTestId("tag-pop-create");
    await expect(create).toContainText("Urgent");
    await create.click();

    await expect(tagChip(page, "Urgent")).toBeVisible();
  });

  test("remove a tag from the task", async ({ page }) => {
    await gotoApp(page);
    await expect(tagChip(page, "Reading")).toBeVisible();
    await tagChip(page, "Reading").getByTestId("tag-chip-remove").click();
    await expect(tagChip(page, "Reading")).toHaveCount(0);
  });

  test("filter the picker by typing", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("tag-add").click();
    await page.getByTestId("tag-pop-search").fill("Deep");

    await expect(tagPopItem(page, "Deep work")).toBeVisible();
    await expect(tagPopItem(page, "Reading")).toHaveCount(0);
  });
});
