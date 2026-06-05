import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("theme", () => {
  test("toggle flips the document theme and the button state", async ({ page }) => {
    await gotoApp(page);
    const html = page.locator("html");
    const toggle = page.getByTestId("theme-toggle");

    const initial = await html.getAttribute("data-theme");
    const flipped = initial === "dark" ? "light" : "dark";

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", flipped);
    await expect(toggle).toHaveAttribute("data-theme-state", flipped);

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", initial!);
  });
});
