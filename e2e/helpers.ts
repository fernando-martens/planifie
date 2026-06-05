import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the planifie e2e suite.
 *
 * The app runs against the in-browser MemoryAdapter (no Tauri), which reseeds
 * deterministically on every page load. Each test therefore starts from the
 * same known state simply by navigating to "/". Never rely on state created by
 * another test.
 */

// ---- Deterministic seed (mirror of src/db/seed.ts) ----
export const SEED = {
  workspaces: ["Personal", "Work", "Side projects"],
  tags: ["Work", "Personal", "Reading", "Deep work", "Learning"],
  presets: ["Writing", "Reviewing", "Studying", "Deep work", "Meeting"],
  // Active on load: Personal workspace, most-recent task.
  activeWorkspace: "Personal",
  activeTaskTitle: "Thinking in Systems — notes",
  // task counts per workspace
  personalTasks: [
    "Thinking in Systems — notes",
    "Weekly review",
    "Trip planning — Lisbon",
    "Year goals",
  ],
  workTasks: ["Ship export module", "Q3 roadmap planning", "Onboarding doc for new hire"],
  sideTasks: ["Project kickoff", "Learn Rust — week 1"],
} as const;

/** Navigate to the app and wait until it has finished its async init. */
export async function gotoApp(page: Page): Promise<void> {
  await page.goto("/");
  // The loading shell carries data-testid="app-loading"; the ready app is "app".
  await expect(page.getByTestId("app")).toBeVisible();
}

/** Install Playwright's fake clock, then load the app. Use for timer tests. */
export async function gotoAppWithClock(page: Page, startTime = Date.now()): Promise<void> {
  await page.clock.install({ time: startTime });
  await gotoApp(page);
}

/** Stub window.print so PDF "export" is observable. Must run before gotoApp. */
export async function stubPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __printed: number }).__printed = 0;
    window.print = () => {
      (window as unknown as { __printed: number }).__printed++;
    };
  });
}

export async function printCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __printed: number }).__printed);
}

// ---- Locator helpers ----
export function workspaceByName(page: Page, name: string) {
  return page.locator(`[data-testid="workspace-item"][data-ws-name="${cssAttr(name)}"]`);
}

export function taskByTitle(page: Page, title: string) {
  return page.locator(`[data-testid="task-item"][data-task-title="${cssAttr(title)}"]`);
}

export function tagChip(page: Page, name: string) {
  return page.locator(`[data-testid="tag-chip"][data-tag-name="${cssAttr(name)}"]`);
}

export function tagPopItem(page: Page, name: string) {
  return page.locator(`[data-testid="tag-pop-item"][data-tag-name="${cssAttr(name)}"]`);
}

export function presetItem(page: Page, label: string) {
  return page.locator(`[data-testid="preset-item"][data-preset-label="${cssAttr(label)}"]`);
}

export function blocksOfKind(page: Page, kind: "note" | "timer" | "doc") {
  return page.locator(`[data-testid="block"][data-block-kind="${kind}"]`);
}

/** Escape a value for use inside a CSS attribute selector string. */
function cssAttr(value: string): string {
  return value.replace(/(["\\])/g, "\\$1");
}

// ---- Action helpers ----

/** Select a workspace by visible name. */
export async function selectWorkspace(page: Page, name: string): Promise<void> {
  await workspaceByName(page, name).click();
}

/** Select a task by visible title. */
export async function selectTask(page: Page, title: string): Promise<void> {
  await taskByTitle(page, title).click();
}

/** Create a new task via the sidebar and give it a title through the header. */
export async function createTask(page: Page, title: string): Promise<void> {
  await page.getByTestId("new-task").click();
  const heading = page.getByTestId("task-title");
  await heading.click();
  await heading.fill(""); // contentEditable: clear then type
  await page.keyboard.type(title);
  await heading.blur();
}

/** Add a block of the given kind to the active task's timeline. */
export async function addBlock(page: Page, kind: "note" | "doc"): Promise<void> {
  await page.getByTestId(kind === "note" ? "composer-note" : "composer-doc").click();
}

/** Add a timer block from a preset label (opens the timer popover first). */
export async function addTimerPreset(page: Page, label: string): Promise<void> {
  await page.getByTestId("composer-timer").click();
  await presetItem(page, label).click();
}
