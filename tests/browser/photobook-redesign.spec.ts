import { test, expect } from "./fixtures";
import { collections } from "../../src/data/collections";

for (const width of [390, 768, 820, 1024, 1440]) {
  test(`every redesigned book preserves its photographs and account at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const collection of collections) {
      await page.goto(`/series/${collection.slug}`);
      await expect(page.locator(".collection-loading-screen")).toBeHidden();
      await expect(page.locator("h1")).toContainText(collection.title);
      await expect(page.locator(".exhibition-photo")).toHaveCount(collection.images.length);
      const actual = await page.locator(".exhibition-photo").evaluateAll(images => images.map(image => image.getAttribute("src")?.split("/")[3]));
      expect(actual).toEqual(collection.images.map(image => image.cloudflareImageId));
      const paragraphs = await page.locator(".personal-story-columns p").allTextContents();
      expect(paragraphs).toEqual(collection.experience?.paragraphs ?? [collection.note]);
      const image = page.locator(".collection-preview img");
      const bounds = (await image.boundingBox())!;
      const ratio = await image.evaluate(el => Number(el.getAttribute("width")) / Number(el.getAttribute("height")));
      expect(Math.abs(bounds.width / bounds.height - ratio)).toBeLessThan(.01);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole("link", { name: "Read the story", exact: true }).click();
      const heading = page.locator(".personal-story h2");
      await expect(heading).toBeInViewport();
      expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(56);
    }
  });
}

test("the landing opens directly into photography and the collection preview remains reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Travel & wildlife photographs.");
  await expect(page.locator(".portfolio-hero img")).toHaveAttribute("data-photo-state", "loaded");
  await expect(page.locator('[aria-hidden="true"].fixed')).toHaveCount(0);
  await page.locator(".portfolio-hero").getByRole("link", { name: "See photobooks" }).click();
  await expect(page.getByRole("heading", { name: "Photobooks", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Preview Hampi photobook", exact: true }).click();
  const preview = page.getByRole("dialog");
  await expect(preview).toBeVisible();
  await preview.getByRole("link", { name: "Open Hampi collection" }).click();
  await expect(page).toHaveURL(/\/series\/hampi$/);
  await expect(page.locator("h1")).toContainText("Hampi");
});

for (const height of [568, 640]) {
  test(`a short phone keeps its photograph and complete call to action at 320x${height}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height });
    await page.goto("/");
    await expect(page.locator(".portfolio-hero img")).toHaveAttribute("data-photo-state", "loaded");
    await page.evaluate(() => document.fonts.ready);
    expect((await page.locator(".portfolio-hero-photo").boundingBox())!.height).toBeGreaterThanOrEqual(160);
    const action = page.locator(".portfolio-hero").getByRole("link", { name: "See photobooks" });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
    const bounds = (await action.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
