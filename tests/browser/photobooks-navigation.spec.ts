import { test, expect } from "./fixtures";

for (const width of [320, 1440]) {
  test(`Photobooks returns to the shelf at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/about", "/series/hampi", "/#city-hampi"]) {
      await page.goto(route);
      if (route.includes("#city")) {
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
      }
      const link = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Photobooks", exact: true });
      await expect(link).toHaveAttribute("href", "/#work");
      await link.click();
      await expect(page.locator(".library-heading")).toBeInViewport();
      await expect(page.locator(".shelf-selection h3")).toHaveText("Hampi");
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeInViewport();
    }
  });
}
