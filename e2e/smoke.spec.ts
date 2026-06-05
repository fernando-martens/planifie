import { test, expect } from "@playwright/test";
import { gotoApp, SEED } from "./helpers";

test.describe("smoke", () => {
  test("boots without console errors and renders the seed", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await gotoApp(page);

    // 3 workspaces from the seed.
    await expect(page.getByTestId("workspace-item")).toHaveCount(SEED.workspaces.length);
    for (const name of SEED.workspaces) {
      await expect(page.locator(`[data-testid="workspace-item"][data-ws-name="${name}"]`)).toBeVisible();
    }

    // Personal is the active workspace; its most-recent task is active.
    await expect(
      page.locator('[data-testid="workspace-item"][data-ws-name="Personal"][data-active="1"]'),
    ).toBeVisible();
    await expect(page.getByTestId("task-header")).toBeVisible();
    await expect(page.getByTestId("task-title")).toHaveText(SEED.activeTaskTitle);

    // Timeline of the active task renders blocks.
    await expect(page.getByTestId("timeline")).toBeVisible();
    await expect(page.getByTestId("block").first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("tasks are grouped by relative date", async ({ page }) => {
    await gotoApp(page);
    // Personal workspace groups: Today + Yesterday + Previous 7 days + a month label.
    await expect(page.getByTestId("task-group").filter({ hasText: "Today" })).toBeVisible();
    await expect(page.getByTestId("task-group").filter({ hasText: "Yesterday" })).toBeVisible();
  });
});
