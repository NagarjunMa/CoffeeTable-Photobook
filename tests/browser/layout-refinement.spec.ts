import { test, expect } from "./fixtures";
import type { Route } from "@playwright/test";

const cities = ["maine", "new-york", "santa-cruz", "washington"];

test("wrapped mobile contents reserve space for every map and attribution", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 844 }, { width: 390, height: 844 }, { width: 609, height: 844 },
    { width: 320, height: 640 }, { width: 390, height: 640 }, { width: 609, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    for (const city of cities) {
      await page.goto(`/#city-${city}`);
      await expect(page.locator(".destination-scroller")).toHaveAttribute("data-enhanced", "true");
      const panel = page.locator(`#city-${city}`);
      const credit = panel.locator(":scope > p");
      const contents = (await page.locator(".destination-contents").boundingBox())!;
      const panelBounds = (await panel.boundingBox())!;
      const creditBounds = (await credit.boundingBox())!;
      expect(panelBounds.y).toBeGreaterThanOrEqual(contents.y + contents.height - 1);
      expect(creditBounds.y + creditBounds.height).toBeLessThanOrEqual(viewport.height);
      const copy = (await panel.locator("[data-city-copy]").boundingBox())!;
      expect(copy.y).toBeGreaterThanOrEqual(panelBounds.y);
      expect(copy.y + copy.height).toBeLessThan(creditBounds.y);
    }
  }
});

test("mobile previews keep their dimensions while photographs are delayed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const city of cities) {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const delay = async (route: Route) => {
      await pending;
      await route.fallback();
    };
    await page.route("**/api/photographs/**", delay);
    try {
      await page.goto(`/series/${city}`, { waitUntil: "domcontentloaded" });
      // WebKit can defer fonts.ready until held image requests finish. Load the
      // declared faces explicitly so this test can measure the pending layout.
      await page.evaluate(() => Promise.all([...document.fonts].map((font) => font.load())));
      const preview = page.locator(".collection-opening figure img");
      await expect(preview).toHaveAttribute("data-photo-state", "loading");
      await expect(page.locator(".collection-opening .photo-loading")).toBeVisible();
      const before = (await preview.boundingBox())!;
      expect(before.width).toBeGreaterThan(150);
      expect(before.height).toBeGreaterThan(150);
      const title = (await page.locator("h1").boundingBox())!;
      expect(Math.abs(before.x - title.x)).toBeLessThan(2);
      release();
      await expect.poll(() => preview.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(page.locator(".collection-opening .photo-loading")).toBeHidden();
      const after = (await preview.boundingBox())!;
      for (const dimension of ["x", "y", "width", "height"] as const) {
        expect(Math.abs(after[dimension] - before[dimension])).toBeLessThan(2);
      }
    } finally {
      release();
      if (!page.isClosed()) await page.unroute("**/api/photographs/**", delay);
    }
  }
});

test("delayed gallery images preserve frame geometry and replace their placeholder", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/photographs/**", async (route) => { await pending; await route.fallback(); });
  try {
    await page.goto("/series/new-york", { waitUntil: "domcontentloaded" });
    const frame = page.locator(".exhibition-frame").first();
    await frame.scrollIntoViewIfNeeded();
    await expect(frame.locator(".photo-loading")).toBeVisible();
    const before = (await frame.boundingBox())!;
    const imageBefore = (await frame.locator("img").boundingBox())!;
    expect(imageBefore.height).toBeGreaterThan(150);
    release();
    await expect(frame.locator(".photo-loading")).toBeHidden();
    const after = (await frame.boundingBox())!;
    expect(Math.abs(before.width - after.width)).toBeLessThan(2);
    expect(Math.abs(before.height - after.height)).toBeLessThan(2);
  } finally { release(); }
});

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`collection compositions remain uncropped at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const city of cities) {
      await page.goto(`/series/${city}`);
      await page.evaluate(() => document.fonts.ready);
      const preview = page.locator(".collection-opening figure img");
      await expect(preview).toHaveAttribute("data-photo-state", "loaded");
      const bounds = (await preview.boundingBox())!;
      const ratio = await preview.evaluate((element) => Number(element.getAttribute("width")) / Number(element.getAttribute("height")));
      expect(Math.abs(bounds.width / bounds.height - ratio)).toBeLessThan(0.01);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      const title = page.locator("h1");
      expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: info.outputPath(`${city}-${width}.png`) });
    }
  });
}

test("tablet openings have a compact header and desktop landscapes use their column", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/series/santa-cruz");
    await page.evaluate(() => document.fonts.ready);
    const title = (await page.locator("h1").boundingBox())!;
    const preview = (await page.locator(".collection-opening figure img").boundingBox())!;
    if (width < 1280) expect(title.y).toBeLessThan(300);
    else expect(preview.width).toBeGreaterThan(500);
    expect(preview.x + preview.width).toBeLessThanOrEqual(width);
  }
});
