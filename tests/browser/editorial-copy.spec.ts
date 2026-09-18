import { test, expect } from "./fixtures";
import editorial from "../../src/data/editorial.json";
import generated from "../../src/data/generated/collections.json";

const notes = generated.filter((city) => ["new-york", "washington", "maine", "santa-cruz", "hampi"].includes(city.slug))
  .map((city) => {
    const entry = editorial.collections[city.sourceFolderId as keyof typeof editorial.collections];
    const note = "note" in entry ? entry.note : city.note;
    return { ...city, note, indexNote: "indexNote" in entry ? entry.indexNote : note };
  });
const tagline = "Only photography can freeze time and let us return to a moment.";

for (const width of [320, 390, 1440]) {
  test(`personal stories are server-rendered and fit at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const home = await page.goto("/");
    const html = await home!.text();
    expect(html).toContain(tagline);
    for (const city of notes) expect(html).toContain(city.indexNote);
    const line = page.getByText(tagline, { exact: true });
    await expect(line).toBeVisible();
    const titleBounds = (await page.locator("h1").boundingBox())!;
    const lineBounds = (await line.boundingBox())!;
    expect(lineBounds.y).toBeGreaterThanOrEqual(titleBounds.y + titleBounds.height);
    expect(lineBounds.x + lineBounds.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: info.outputPath(`hero-copy-${width}.png`) });
    for (const city of notes) {
      await page.goto(`/#city-${city.slug}`);
      await expect(page.locator(".destination-scroller")).toHaveAttribute("data-enhanced", "true");
      const copy = page.locator(`#city-${city.slug}`).getByText(city.indexNote, { exact: true });
      await expect(copy).toBeInViewport({ ratio: 1 });
      await page.screenshot({ path: info.outputPath(`${city.slug}-copy-${width}.png`) });
      const response = await page.goto(`/series/${city.slug}`);
      expect(await response!.text()).toContain(city.note);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", city.note);
      await expect(page.locator("article").getByText(city.note, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
