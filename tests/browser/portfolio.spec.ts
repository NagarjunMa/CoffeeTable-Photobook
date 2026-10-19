import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import collections from "../../src/data/generated/collections.json";

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
  await expect(page.locator(".exhibition-row").first()).toHaveCSS("opacity", "1");
  await expect.poll(() => page.locator(".exhibition-row").first().locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.locator(".exhibition-row").first().locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: info.outputPath("gallery.png") });
});

test("intro cannot obscure server content when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { name: "Nagarjun Mallesh" })).toBeVisible();
  await expect(page.locator('[aria-hidden="true"].fixed')).not.toBeVisible();
  await context.close();
});

test("keyboard-only browsing reaches a visible gallery frame", async ({ page }) => {
  await page.goto("/series/new-york");
  const frame = page.locator(".exhibition-frame [data-open-photo]").first();
  for (let step = 0; step < 16; step++) {
    if (await frame.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(frame).toBeFocused();
  await expect(frame).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("first keyboard interaction dismisses the optional intro", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem("nm-portfolio-intro-played"));
  await page.goto("/");
  await expect(page.locator('[aria-hidden="true"].fixed')).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator('[aria-hidden="true"].fixed')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("homepage, About and modal pass automated accessibility checks", async ({ page }) => {
  for (const path of ["/", "/about", "/series/new-york"]) {
    await page.goto(path);
    if (path.startsWith("/series")) await page.locator("article [data-open-photo]").click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
});

test("denied storage never traps visitors behind the intro", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Denied", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Denied", "SecurityError"); };
  });
  await page.goto("/");
  await expect(page.locator('[aria-hidden="true"].fixed')).not.toBeVisible({ timeout: 7000 });
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("failed photographs expose retry without nesting buttons", async ({ page }) => {
  let failing = true;
  await page.route("**/api/photographs/**", async (route) => failing ? route.fulfill({ status: 503 }) : route.fallback());
  await page.goto("/series/new-york");
  const retry = page.getByRole("button", { name: "Retry", exact: true }).first();
  await expect(retry).toBeVisible();
  expect(await page.locator("button button").count()).toBe(0);
  failing = false;
  await retry.click();
  await expect(page.locator("article .photo-error")).toHaveCount(0);
});

test("failed next lightbox image retains the decoded photograph", async ({ page }) => {
  const photos = collections.find((collection) => collection.slug === "santa-cruz")!.images;
  await page.goto("/series/santa-cruz");
  await page.locator(".exhibition-frame [data-open-photo]").first().click();
  const displayed = page.locator(".lightbox-photo");
  await expect.poll(() => displayed.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const initial = await displayed.getAttribute("src");
  await page.route("**/api/photographs/" + photos[1].cloudflareImageId + "/**", (route) => route.fulfill({ status: 503 }));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(displayed).toHaveAttribute("src", initial!);
  await page.keyboard.press("Escape");
});

test("late image decoding cannot overwrite a more recent lightbox selection", async ({ page }) => {
  const photos = collections.find((collection) => collection.slug === "santa-cruz")!.images;
  await page.goto("/series/santa-cruz");
  await page.locator(".exhibition-frame [data-open-photo]").first().click();
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/photographs/" + photos[1].cloudflareImageId + "/**", async (route) => {
    await delayed;
    await route.fallback();
  });
  try {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.locator(".lightbox-photo")).toHaveAttribute("src", new RegExp(photos[2].cloudflareImageId!));
    const completed = page.waitForResponse((response) => response.url().includes(photos[1].cloudflareImageId!));
    release();
    await completed;
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator(".lightbox-photo")).toHaveAttribute("src", new RegExp(photos[2].cloudflareImageId!));
  } finally {
    release();
  }
});

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`responsive visual check at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto("/#city-washington");
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Washington", exact: true })).toBeVisible();
    await expect.poll(() => page.getByRole("dialog").locator(".book-map-image").evaluate((image) => (image as HTMLImageElement).complete)).toBe(true);
    await page.screenshot({ path: info.outputPath(`map-${width}.png`) });
    await page.goto("/series/washington");
    const title = page.locator("h1");
    expect(await title.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    const preview = await page.locator("article figure img").boundingBox();
    expect(preview!.x + preview!.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: info.outputPath(`opening-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
