import { test, expect } from "@playwright/test";
import { gotoApp, selectWorkspace, taskByTitle, SEED } from "./helpers";

test.describe("workspaces", () => {
  test("create a workspace with a name and color", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("workspace-add").click();

    const dialog = page.getByTestId("ws-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("ws-name-input").fill("Research");
    await page.getByTestId("ws-color-ocean").click();
    await page.getByTestId("ws-save").click();

    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-testid="workspace-item"][data-ws-name="Research"]')).toBeVisible();
    // New workspace becomes active and has no tasks yet.
    await expect(
      page.locator('[data-testid="workspace-item"][data-ws-name="Research"][data-active="1"]'),
    ).toBeVisible();
    await expect(page.getByTestId("no-task")).toBeVisible();
  });

  test("edit a workspace name", async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-testid="workspace-item"][data-ws-name="Work"] [data-testid="workspace-edit"]').click();

    await expect(page.getByTestId("ws-dialog")).toBeVisible();
    const input = page.getByTestId("ws-name-input");
    await expect(input).toHaveValue("Work");
    await input.fill("Job");
    await page.getByTestId("ws-save").click();

    await expect(page.locator('[data-testid="workspace-item"][data-ws-name="Job"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-item"][data-ws-name="Work"]')).toHaveCount(0);
  });

  test("delete a workspace (with confirm)", async ({ page }) => {
    await gotoApp(page);
    await page.locator('[data-testid="workspace-item"][data-ws-name="Side projects"] [data-testid="workspace-edit"]').click();
    await page.getByTestId("ws-delete").click();

    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await page.getByTestId("confirm-ok").click();

    await expect(page.locator('[data-testid="workspace-item"][data-ws-name="Side projects"]')).toHaveCount(0);
    await expect(page.getByTestId("workspace-item")).toHaveCount(SEED.workspaces.length - 1);
  });

  test("switching workspace changes the task list", async ({ page }) => {
    await gotoApp(page);
    // Initially Personal: a personal task is visible, a work task is not.
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toBeVisible();
    await expect(taskByTitle(page, "Ship export module")).toHaveCount(0);

    await selectWorkspace(page, "Work");
    await expect(
      page.locator('[data-testid="workspace-item"][data-ws-name="Work"][data-active="1"]'),
    ).toBeVisible();
    await expect(taskByTitle(page, "Ship export module")).toBeVisible();
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toHaveCount(0);
  });
});
