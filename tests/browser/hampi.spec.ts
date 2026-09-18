import { test, expect } from "./fixtures";

for (const width of [390, 1440]) {
  test(`Hampi map opens its complete, uncropped book at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#city-hampi");
    await expect(page.locator(".destination-scroller")).toHaveAttribute("data-enhanced", "true");
    const panel = page.locator("#city-hampi");
    const map = panel.locator(".city-map-image");
    await expect.poll(() => map.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect.poll(() => map.evaluate((image) => (image as HTMLImageElement).currentSrc))
      .toContain(`hampi-${width < 768 ? "mobile" : "desktop"}-`);
    await page.screenshot({ path: info.outputPath(`hampi-map-${width}.png`) });
    await panel.getByRole("link").click();
    await expect(page).toHaveURL(/\/series\/hampi$/);
    await expect(page.locator(".exhibition-frame")).toHaveCount(12);
    const rows = await page.locator(".exhibition-row").evaluateAll((items) => items.map((row) =>
      [...row.querySelectorAll(".exhibition-frame")].map((frame) => ({
        height: frame.getBoundingClientRect().height, mat: getComputedStyle(frame).paddingTop,
      }))));
    if (width >= 768) for (const row of rows) {
      expect(new Set(row.map((frame) => frame.mat)).size).toBe(1);
      expect(Math.max(...row.map((frame) => frame.height)) - Math.min(...row.map((frame) => frame.height))).toBeLessThan(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".collection-opening figure img")).toHaveAttribute("data-photo-state", "loaded");
    await page.screenshot({ path: info.outputPath(`hampi-opening-${width}.png`) });
    const opener = page.locator(".exhibition-frame [data-open-photo]").first();
    await opener.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
}
