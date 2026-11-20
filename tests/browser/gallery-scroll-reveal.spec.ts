import { test, expect } from "./fixtures";
import { collections } from "../../src/data/collections";

const book = collections.find((collection) => collection.slug === "new-york")!;
const last = book.images.at(-1)!;

for (const width of [390, 1440]) {
 test(`a pending later photograph cannot block the opening and reveals after decoding at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**/api/photographs/${last.cloudflareImageId}/**`, async (route) => {
    await held;
    await route.fallback();
  });
  try {
    await page.goto("/series/new-york", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".collection-loading-screen")).toBeHidden();
    await expect(page.locator(".site-header")).not.toHaveAttribute("inert", "");
    await expect(page.locator(".personal-story")).toBeVisible();
    const frame = page.locator(".exhibition-item").last();
    await frame.scrollIntoViewIfNeeded();
    await expect(frame.locator(".gallery-frame-wait")).toBeVisible();
    expect(await frame.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(0);
    release();
    await expect(frame.locator("img")).toHaveAttribute("data-photo-state", "loaded");
    await expect(frame.locator(".gallery-frame-wait")).toHaveCount(0);
    await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("transform", "none");
    await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("opacity", "1");
    const image = frame.locator("img");
    const bounds = (await image.boundingBox())!;
    const ratio = await image.evaluate((element) => Number(element.getAttribute("width")) / Number(element.getAttribute("height")));
    expect(Math.abs(bounds.width / bounds.height - ratio)).toBeLessThan(0.01);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await frame.locator("[data-open-photo]").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(frame.locator("[data-open-photo]")).toBeFocused();
    await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("transform", "none");
  } finally { release(); }
 });
}

test("keyboard focus exposes a pending frame and reduced motion removes its entrance", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**/api/photographs/${last.cloudflareImageId}/**`, async (route) => { await held; await route.fallback(); });
  try {
    await page.goto("/series/new-york", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".collection-loading-screen")).toBeHidden();
    const frame = page.locator(".exhibition-item").last();
    await frame.locator("[data-open-photo]").focus();
    await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("opacity", "1");
    await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("transform", "none");
    await expect(frame.locator(".gallery-frame-wait")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".exhibition-frame-group").first()).toHaveCSS("transform", "none");
    await expect(page.locator(".exhibition-frame-group").first()).toHaveCSS("opacity", "1");
  } finally { release(); }
});

test("a failed lazy photograph reveals its retry control and recovers", async ({ page }) => {
  let fail = true;
  await page.route(`**/api/photographs/${last.cloudflareImageId}/**`, (route) => fail ? route.abort() : route.fallback());
  await page.goto("/series/new-york", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".collection-loading-screen")).toBeHidden();
  const frame = page.locator(".exhibition-item").last();
  await frame.scrollIntoViewIfNeeded();
  await expect(frame.locator(".photo-error")).toBeVisible();
  await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("opacity", "1");
  await expect(frame.locator(".gallery-frame-wait")).toHaveCount(0);
  fail = false;
  await frame.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(frame.locator("img")).toHaveAttribute("data-photo-state", "loaded");
  await expect(frame.locator(".photo-error")).toHaveCount(0);
});

test("reduced motion exposes all frames without transforms or reveal orbs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/series/new-york");
  await expect(page.locator(".collection-loading-screen")).toBeHidden();
  expect(await page.locator(".exhibition-frame-group").evaluateAll((frames) => frames.every((frame) => {
    const style = getComputedStyle(frame);
    return style.opacity === "1" && style.transform === "none";
  }))).toBe(true);
  await expect(page.locator(".gallery-frame-wait")).toHaveCount(0);
});


test("focus immediately settles an entrance that is already playing", async ({ page }) => {
  await page.clock.install();
  await page.goto("/series/new-york");
  await expect(page.locator(".collection-loading-screen")).toBeHidden();
  const frame = page.locator(".exhibition-item").first();
  await page.clock.runFor(200);
  await frame.scrollIntoViewIfNeeded();
  // WebKit starts this lazy request only once the frame approaches the viewport.
  await expect(frame.locator("img")).toHaveAttribute("data-photo-state", "loaded");
  await page.clock.runFor(120);
  const group = frame.locator(".exhibition-frame-group");
  const opacity = Number(await group.evaluate((element) => getComputedStyle(element).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  // Read synchronously after focus; waiting would conceal a still-running tween.
  const focused = await frame.evaluate((element) => {
    element.querySelector<HTMLButtonElement>("[data-open-photo]")!.focus();
    const style = getComputedStyle(element.querySelector(".exhibition-frame-group")!);
    return { opacity: style.opacity, transform: style.transform };
  });
  expect(focused).toEqual({ opacity: "1", transform: "none" });
});


test("a loaded photograph keeps its local orb until decoding finishes", async ({ page }) => {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    Object.assign(window, { releaseGalleryDecode: release });
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (this.closest(".exhibition-item")) await held;
    };
  });
  await page.goto("/series/new-york");
  await expect(page.locator(".collection-loading-screen")).toBeHidden();
  const frame = page.locator(".exhibition-item").first();
  await frame.scrollIntoViewIfNeeded();
  await expect(frame.locator("img")).toHaveAttribute("data-photo-state", "loaded");
  await expect(frame.locator(".gallery-frame-wait")).toBeVisible();
  await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("opacity", "0");
  await page.evaluate(() => (window as Window & { releaseGalleryDecode: () => void }).releaseGalleryDecode());
  await expect(frame.locator(".gallery-frame-wait")).toHaveCount(0);
  await expect(frame.locator(".exhibition-frame-group")).toHaveCSS("transform", "none");
});
