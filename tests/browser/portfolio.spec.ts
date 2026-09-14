import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

test("city map surface opens the destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const panel = page.locator("[data-city-panel]").filter({ has: page.getByRole("heading", { name: "Washington", exact: true }) });
  await panel.scrollIntoViewIfNeeded();
  await panel.click({ position: { x: 285, y: 240 } });
  await expect(page).toHaveURL(/\/series\/washington$/);
});

test("lightbox retains keyboard focus and restores its opener", async ({ page }) => {
  await page.goto("/series/santa-cruz");
  const opener = page.locator(".exhibition-frame [data-open-photo]").first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press(step < 4 ? "Tab" : "Shift+Tab");
    await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"], dialog')))).toBe(true);
  }
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("tablet preview is fully inside its viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/series/washington");
  const preview = page.locator("article figure img").first();
  await expect(preview).toBeVisible();
  const bounds = await preview.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(768);
});

test("long city names fit narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const title = page.getByRole("heading", { name: "Washington", exact: true });
  await title.scrollIntoViewIfNeeded();
  expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test("gallery frame mats and row heights remain uniform", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/series/new-york");
  const rows = await page.locator(".exhibition-row").evaluateAll((elements) => elements.map((row) => [...row.querySelectorAll(".exhibition-frame")].map((frame) => ({ height: frame.getBoundingClientRect().height, mat: getComputedStyle(frame).paddingTop }))));
  for (const row of rows) {
    expect(new Set(row.map((frame) => frame.mat)).size).toBe(1);
    expect(Math.max(...row.map((frame) => frame.height)) - Math.min(...row.map((frame) => frame.height))).toBeLessThan(2);
  }
});

test("gallery meets automated accessibility checks", async ({ page }) => {
  await page.goto("/series/washington");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("capture review surfaces", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: info.outputPath("hero.png") });
  await page.goto("/series/new-york");
  await page.locator(".exhibition-row").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("gallery.png") });
});

test("contents, history and reduced motion keep destinations reachable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#work");
  const contents = page.getByRole("navigation", { name: "Destination contents" });
  await contents.getByRole("link", { name: "Washington", exact: true }).click();
  await expect(page).toHaveURL(/#city-washington$/);
  await expect(contents.getByRole("link", { name: "Washington", exact: true })).toHaveAttribute("aria-current", "location");
  await page.getByRole("link", { name: "Open Washington city book" }).click();
  await expect(page).toHaveURL(/\/series\/washington$/);
  await page.getByRole("link", { name: "Index", exact: true }).click();
  await expect(page).toHaveURL(/#city-washington$/);
  await expect(contents.getByRole("link", { name: "Washington", exact: true })).toHaveAttribute("aria-current", "location");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.locator(".destination-track").evaluate((element) => getComputedStyle(element).display)).toBe("block");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("intro cannot obscure server content when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { name: "Nagarjun Mallesh" })).toBeVisible();
  await expect(page.locator('[aria-hidden="true"].fixed')).not.toBeVisible();
  await context.close();
});

test("mobile snap belongs to the scroll container", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#work");
  await expect.poll(() => page.locator(".destination-scroller").evaluate((element) => getComputedStyle(element).scrollSnapType)).toBe("x mandatory");
});
