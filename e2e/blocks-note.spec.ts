import { test, expect } from "@playwright/test";
import { gotoApp, addBlock, blocksOfKind, createTask } from "./helpers";

test.describe("note blocks", () => {
  test("add, edit and persist a note body", async ({ page }) => {
    await gotoApp(page);
    // Use a fresh task so the new note is the only block (seed blocks carry
    // evening timestamps and could otherwise sort ahead of a daytime "now").
    await createTask(page, "Note test");
    await addBlock(page, "note");
    await expect(blocksOfKind(page, "note")).toHaveCount(1);

    const body = blocksOfKind(page, "note").first().getByTestId("note-body");
    await body.click();
    await body.pressSequentially("Remember to water the plants");
    await body.blur();

    await expect(body).toHaveText("Remember to water the plants");
  });

  test("delete a note block with confirmation", async ({ page }) => {
    await gotoApp(page);
    await addBlock(page, "note");
    const count = await blocksOfKind(page, "note").count();

    await blocksOfKind(page, "note").first().getByTestId("block-delete").click();
    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await page.getByTestId("confirm-ok").click();

    await expect(blocksOfKind(page, "note")).toHaveCount(count - 1);
  });
});
