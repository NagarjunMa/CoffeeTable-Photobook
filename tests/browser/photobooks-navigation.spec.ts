import { test, expect } from "./fixtures";

for (const width of [320, 1440]) {
  test(`Photobooks returns to the first destination at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/about", "/series/hampi", "/#city-hampi"]) {
      await page.goto(route);
      const link = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Photobooks", exact: true });
      await expect(link).toHaveAttribute("href", "/#work");
      await link.click();
      const first = page.locator("[data-city-panel]").first();
      await expect.poll(async () => first.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const contents = document.querySelector(".destination-contents")!.getBoundingClientRect();
        return Math.abs(bounds.left) < 2 && Math.abs(bounds.top - contents.bottom) < 2 && bounds.bottom > 200;
      })).toBe(true);
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeInViewport();
    }
  });
}
