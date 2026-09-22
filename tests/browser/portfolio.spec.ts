import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import collections from "../../src/data/generated/collections.json";

test("city map surface opens the destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const panel = page.locator("[data-city-panel]").filter({ has: page.getByRole("heading", { name: "Washington", exact: true }) });
  await panel.scrollIntoViewIfNeeded();
  await panel.click({ position: { x: 285, y: 240 } });
  await expect(page).toHaveURL(/\/series\/washington$/);
});

test("map-only artwork selects the matching desktop and mobile composition", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900, mode: "desktop" },
    { width: 390, height: 844, mode: "mobile" },
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const slug of ["new-york", "santa-cruz", "washington", "hampi"]) {
      const image = page.locator(`#city-${slug} .city-map-image`);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) =>
        (element as HTMLImageElement).currentSrc)).toMatch(
          new RegExp(`/map-posters/optimized/${slug}-${viewport.mode}-`),
        );
    }
  }
});

test("tiger illustration introduces its wildlife collection on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900, focalPosition: "50% 50%" },
    { width: 390, height: 844, focalPosition: "51% 50%" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/#city-tigers");
    const panel = page.locator("#city-tigers");
    await expect(panel.getByRole("heading", { name: "Tigers", exact: true })).toBeVisible();
    const artwork = panel.locator(".city-map-image");
    await expect.poll(() => artwork.evaluate((image) => (image as HTMLImageElement).currentSrc)).toContain("/intro-art/tigers-line-poster.webp");
    await expect(artwork).toHaveCSS("object-position", viewport.focalPosition);
    await expect(panel.getByText("Map data", { exact: false })).toHaveCount(0);
  }

  await page.getByRole("link", { name: "Open Tigers collection" }).click();
  await expect(page).toHaveURL(/\/series\/tigers$/);
  await expect(page.getByRole("heading", { name: "Tigers", exact: true })).toBeVisible();
  await expect(page.getByText("17 photographs")).toBeVisible();
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
  await expect(page.locator(".exhibition-row").first()).toHaveCSS("opacity", "1");
  await expect.poll(() => page.locator(".exhibition-row").first().locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.locator(".exhibition-row").first().locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: info.outputPath("gallery.png") });
});

test("contents, history and reduced motion keep destinations reachable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#work");
  const contents = page.getByRole("navigation", { name: "Destination contents" });
  await contents.getByRole("link", { name: "Washington", exact: true }).click();
  await expect(page).toHaveURL(/#city-washington$/);
  await expect(contents.getByRole("link", { name: "Washington", exact: true })).toHaveAttribute("aria-current", "location");
  await page.getByRole("link", { name: "Open Washington collection" }).click();
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

test("mobile contents, arrows and history move the actual rail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#work");
  const scroller = page.locator(".destination-scroller");
  await expect(scroller).toHaveAttribute("data-enhanced", "true");
  const contents = page.getByRole("navigation", { name: "Destination contents" });
  await contents.getByRole("link", { name: "Washington", exact: true }).click();
  await expect(page).toHaveURL(/#city-washington$/);
  await expect.poll(() => page.locator("#city-washington").evaluate((element) => Math.abs(element.getBoundingClientRect().left))).toBeLessThan(2);
  await page.getByRole("button", { name: "Previous destination", exact: true }).click();
  await expect(page).not.toHaveURL(/#city-washington$/);
  await page.goBack();
  await expect(page).toHaveURL(/#city-washington$/);
  await expect.poll(() => page.locator("#city-washington").evaluate((element) => Math.abs(element.getBoundingClientRect().left))).toBeLessThan(2);
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

test("short landscape uses accessible normal flow", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/#city-washington");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".destination-track")).toHaveCSS("display", "block");
  await page.getByRole("link", { name: "Open Washington collection" }).click();
  await expect(page).toHaveURL(/\/series\/washington$/);
});

test("homepage, About and modal pass automated accessibility checks", async ({ page }) => {
  for (const path of ["/", "/about", "/series/new-york"]) {
    await page.goto(path);
    if (path.startsWith("/series")) await page.locator("article [data-open-photo]").click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
});

test("dragging a map does not activate its link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#city-washington");
  const link = page.getByRole("link", { name: "Open Washington collection" });
  const box = (await link.boundingBox())!;
  await page.mouse.move(box.x + 250, box.y + 300);
  await page.mouse.down();
  await page.mouse.move(box.x + 190, box.y + 300, { steps: 6 });
  await page.mouse.up();
  await expect(page).toHaveURL(/#city-washington$/);
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

test("map picture selects desktop and mobile derivatives", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#city-washington");
  const image = page.locator("#city-washington img");
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain("washington-desktop-");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain("washington-mobile-");
  await expect(page.locator("#city-washington img")).toHaveCount(1);
});

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`responsive visual check at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto("/#city-washington");
    await expect(page.locator("#city-washington .destination-title")).toBeVisible();
    await expect.poll(() => page.locator("#city-washington img").evaluate((image) => (image as HTMLImageElement).complete)).toBe(true);
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
