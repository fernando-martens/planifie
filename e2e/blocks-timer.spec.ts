import { test, expect } from "@playwright/test";
import { gotoAppWithClock, addTimerPreset, blocksOfKind } from "./helpers";

test.describe("timer blocks", () => {
  test("start → pause → resume → finish with a fake clock", async ({ page }) => {
    await gotoAppWithClock(page);
    await addTimerPreset(page, "Writing");

    const timer = blocksOfKind(page, "timer").first();
    const main = timer.getByTestId("timer-main");
    await expect(main).toHaveAttribute("data-timer-status", "idle");
    await timer.getByTestId("timer-start").click();

    // The global action bar appears for the running timer.
    const bar = page.getByTestId("action-bar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-status", "running");
    await expect(page.getByTestId("action-bar-label")).toContainText("Writing");
    await expect(page.getByTestId("action-bar-label")).toContainText("In progress");

    // Advance 30s — the live clock follows.
    await page.clock.fastForward(30_000);
    await expect(page.getByTestId("action-bar-time")).toHaveText("00:30");

    // Pause freezes the clock.
    await page.getByTestId("action-bar-pause").click();
    await expect(bar).toHaveAttribute("data-status", "paused");
    await page.clock.fastForward(10_000);
    await expect(page.getByTestId("action-bar-time")).toHaveText("00:30");

    // Resume and advance another 30s → 60s total.
    await page.getByTestId("action-bar-resume").click();
    await expect(bar).toHaveAttribute("data-status", "running");
    await page.clock.fastForward(30_000);
    await expect(page.getByTestId("action-bar-time")).toHaveText("01:00");

    // Finish closes the bar and stamps the block's duration.
    await page.getByTestId("action-bar-finish").click();
    await expect(bar).toBeHidden();
    await expect(main).toHaveAttribute("data-timer-status", "finished");
    await expect(timer.getByTestId("timer-duration")).toContainText("1m 00s");
  });

  test("edit an idle timer's start/end to log a finished duration", async ({ page }) => {
    await gotoAppWithClock(page);
    await addTimerPreset(page, "Studying");

    const timer = blocksOfKind(page, "timer").first();
    await timer.getByTestId("timer-edit-open").click();

    await expect(page.getByTestId("timer-edit")).toBeVisible();
    await page.getByTestId("timer-edit-start").fill("2025-03-01T10:00");
    await page.getByTestId("timer-edit-end").fill("2025-03-01T11:30");
    await page.getByTestId("timer-edit-save").click();

    await expect(timer.getByTestId("timer-main")).toHaveAttribute("data-timer-status", "finished");
    await expect(timer.getByTestId("timer-duration")).toContainText("1h 30m 00s");
  });

  test("delete a timer block", async ({ page }) => {
    await gotoAppWithClock(page);
    await addTimerPreset(page, "Meeting");
    const count = await blocksOfKind(page, "timer").count();

    await blocksOfKind(page, "timer").first().getByTestId("block-delete").click();
    await page.getByTestId("confirm-ok").click();

    await expect(blocksOfKind(page, "timer")).toHaveCount(count - 1);
  });
});
