import { test, expect } from "@playwright/test";
import { gotoApp, createTask, taskByTitle, selectTask } from "./helpers";

test.describe("tasks", () => {
  test("create a task from the sidebar and title it in the header", async ({ page }) => {
    await gotoApp(page);
    await createTask(page, "Plan the offsite");

    await expect(page.getByTestId("task-title")).toHaveText("Plan the offsite");
    await expect(taskByTitle(page, "Plan the offsite")).toBeVisible();
    // A fresh task has an empty timeline.
    await expect(page.getByTestId("empty-timeline")).toBeVisible();
  });

  test("create from the empty state when a workspace has no tasks", async ({ page }) => {
    await gotoApp(page);
    // Make a fresh, empty workspace.
    await page.getByTestId("workspace-add").click();
    await page.getByTestId("ws-name-input").fill("Empty WS");
    await page.getByTestId("ws-save").click();

    await expect(page.getByTestId("no-task")).toBeVisible();
    await page.getByTestId("no-task-new").click();
    await expect(page.getByTestId("task-header")).toBeVisible();
    await expect(page.getByTestId("empty-timeline")).toBeVisible();
  });

  test("rename a task inline in the sidebar", async ({ page }) => {
    await gotoApp(page);
    const item = taskByTitle(page, "Weekly review");
    await item.getByTestId("task-rename").click();

    const input = page.getByTestId("task-rename-input");
    await expect(input).toBeVisible();
    await input.fill("Weekly retro");
    await input.press("Enter");

    await expect(taskByTitle(page, "Weekly retro")).toBeVisible();
    await expect(taskByTitle(page, "Weekly review")).toHaveCount(0);
  });

  test("set a task date via the date input", async ({ page }) => {
    await gotoApp(page);
    // Active task is "Thinking in Systems — notes".
    const input = page.getByTestId("task-date-input");
    await input.fill("2025-01-15");

    await expect(page.getByTestId("task-date")).toContainText("January 15, 2025");
  });

  test("select and switch the active task", async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByTestId("task-title")).toHaveText("Thinking in Systems — notes");

    await selectTask(page, "Trip planning — Lisbon");
    await expect(page.getByTestId("task-title")).toHaveText("Trip planning — Lisbon");
    await expect(taskByTitle(page, "Trip planning — Lisbon")).toHaveAttribute("data-active", "1");
  });

  test("delete a task with confirmation", async ({ page }) => {
    await gotoApp(page);
    const item = taskByTitle(page, "Year goals");
    await item.getByTestId("task-delete").click();

    await expect(page.getByTestId("confirm-dialog")).toBeVisible();
    await page.getByTestId("confirm-ok").click();

    await expect(taskByTitle(page, "Year goals")).toHaveCount(0);
  });

  test("search filters tasks by title and shows an empty message", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("task-search-toggle").click();
    const search = page.getByTestId("task-search-input");
    await expect(search).toBeFocused();

    await search.fill("Lisbon");
    await expect(taskByTitle(page, "Trip planning — Lisbon")).toBeVisible();
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toHaveCount(0);

    await search.fill("zzzzz-nothing");
    await expect(page.getByTestId("task-empty")).toContainText("No tasks match");

    // Escape clears and closes search.
    await search.press("Escape");
    await expect(page.getByTestId("task-search-input")).toHaveCount(0);
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toBeVisible();
  });

  test("search matches by tag and by block content", async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId("task-search-toggle").click();
    const search = page.getByTestId("task-search-input");

    // "reading" is a tag on the active task.
    await search.fill("reading");
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toBeVisible();

    // Body text from a note block ("stocks and flows").
    await search.fill("stocks and flows");
    await expect(taskByTitle(page, "Thinking in Systems — notes")).toBeVisible();
  });
});
