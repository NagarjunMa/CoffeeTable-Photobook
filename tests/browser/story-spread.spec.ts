import { test, expect } from "./fixtures";

for (const width of [390, 1440, 1920]) {
  test(`personal story reads as a complete spread at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/series/tigers");
    await expect(page.locator(".collection-loading-screen")).toBeHidden();
    const story = page.locator(".personal-story");
    await story.scrollIntoViewIfNeeded();
    await expect(story.getByRole("heading", { name: "My first forest" })).toBeVisible();
    await expect(story.locator(".personal-story-heading > p")).toContainText("Kanha, 2004");
    await expect(story.locator(".personal-story-columns p")).toHaveCount(7);
    await expect(story.locator(".personal-story-columns")).toHaveCSS("column-count", width >= 900 ? "2" : "auto");
    const bounds = await story.boundingBox();
    expect(bounds).not.toBeNull();
    if (width >= 1440) expect(bounds!.height).toBeLessThanOrEqual(936);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await story.screenshot({ path: test.info().outputPath(`story-${width}.png`) });
  });
}
