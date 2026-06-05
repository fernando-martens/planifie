import { test, expect } from "@playwright/test";
import { gotoApp, createTask } from "./helpers";

test.describe("empty states", () => {
  test("\"No task selected\" in a workspace without tasks", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("workspace-add").click();
    await page.getByTestId("ws-name-input").fill("Blank");
    await page.getByTestId("ws-save").click();

    await expect(page.getByTestId("no-task")).toBeVisible();
    await expect(page.getByTestId("no-task")).toContainText("No task selected");
  });

  test("\"Nothing logged yet\" for a fresh task", async ({ page }) => {
    await gotoApp(page);
    await createTask(page, "Brand new task");
    await expect(page.getByTestId("empty-timeline")).toBeVisible();
    await expect(page.getByTestId("empty-timeline")).toContainText("Nothing logged yet");
  });

  test("\"No tasks match\" when search has no results", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("task-search-toggle").click();
    await page.getByTestId("task-search-input").fill("no-such-task-xyz");
    await expect(page.getByTestId("task-empty")).toContainText("No tasks match");
  });
});
