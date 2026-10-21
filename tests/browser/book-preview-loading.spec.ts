import { test, expect } from "./fixtures";

test.use({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`book opening waits behind Thinking Orbs for image load and decode (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      const decode = HTMLImageElement.prototype.decode;
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      Object.assign(window, { releaseBookDecode: release });
      HTMLImageElement.prototype.decode = function() {
        const decoded = decode.call(this);
        return this.closest(".book-detail-photo") ? decoded.then(() => gate) : decoded;
      };
    });
    await page.goto("/#work");
    await page.getByRole("navigation", { name: "Destination contents" }).getByRole("link", { name: "Tigers", exact: true }).focus();
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/photographs/**", async route => { await pending; await route.fallback(); });
    try {
      await page.getByRole("button", { name: "Preview Tigers photobook" }).click();
      const card = page.getByRole("dialog");
      const loading = card.locator(".book-preparing-screen");
      await expect(loading).toBeVisible();
      await expect(loading.locator("canvas")).toBeVisible();
      await expect(card.locator(".book-detail-shell")).toHaveAttribute("inert", "");
      await expect(card.locator(".book-detail-shell")).toBeHidden();
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest(".book-preparing-screen")))).toBe(true);
      release();
      const photo = card.locator(".book-detail-photo img");
      await expect.poll(() => photo.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
      // A completed network response alone must not dismiss the orb.
      await expect(loading).toBeVisible();
      if (reducedMotion === "no-preference") expect(await card.locator(".book-opening-cover").evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11)).toBeCloseTo(1);
      await page.evaluate(() => (window as unknown as { releaseBookDecode: () => void }).releaseBookDecode());
      await expect(loading).toHaveCount(0);
      await expect(card.locator(".book-detail-shell")).toBeVisible();
      await expect(card.locator(".book-detail-shell")).not.toHaveAttribute("inert");
      await expect(card.locator(".photo-loading")).toBeHidden();
      await expect(card.getByRole("link", { name: "Open Tigers collection" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(card).toHaveCount(0);
    } finally { release(); }
  });
}

test("loading can be cancelled and late photographs never reopen the old book", async ({ page }) => {
  await page.goto("/#work");
  await page.getByRole("navigation", { name: "Destination contents" }).getByRole("link", { name: "Tigers", exact: true }).focus();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const delay = async (route: import("@playwright/test").Route) => { await pending; await route.fallback(); };
  await page.route("**/api/photographs/**", delay);
  try {
    const opener = page.getByRole("button", { name: "Preview Tigers photobook" });
    await opener.click();
    await expect(page.locator(".book-preparing-screen")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    release();
    await page.unroute("**/api/photographs/**", delay);
    await page.getByRole("navigation", { name: "Destination contents" }).getByRole("link", { name: "Hampi", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Hampi", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/#city-hampi$/);
  } finally { release(); }
});

test("failed preview photographs offer retry before revealing the book", async ({ page }) => {
  await page.goto("/#work");
  await page.getByRole("navigation", { name: "Destination contents" }).getByRole("link", { name: "Tigers", exact: true }).focus();
  let failed = true;
  await page.route("**/api/photographs/**", route => failed ? route.fulfill({ status: 503 }) : route.fallback());
  await page.getByRole("button", { name: "Preview Tigers photobook" }).click();
  const card = page.getByRole("dialog");
  await expect(card.getByText("A photograph couldn’t be loaded.", { exact: true })).toBeVisible();
  await expect(card.locator(".book-detail-shell")).toBeHidden();
  failed = false;
  await card.getByRole("button", { name: "Retry photographs", exact: true }).click();
  await expect(card.locator(".book-preparing-screen")).toHaveCount(0);
  await expect(card.locator(".book-detail-photo img")).toHaveAttribute("data-photo-state", "loaded");
  await expect(card.locator(".photo-error")).toHaveCount(0);
});

test("a slow preview offers a deliberate continue and keeps cancellation available", async ({ page }) => {
  await page.goto("/#work");
  await page.getByRole("navigation", { name: "Destination contents" }).getByRole("link", { name: "Tigers", exact: true }).focus();
  await page.clock.install();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/photographs/**", async route => { await pending; await route.fallback(); });
  try {
    await page.getByRole("button", { name: "Preview Tigers photobook" }).click();
    await expect(page.locator(".book-preparing-screen")).toBeVisible();
    await page.clock.fastForward(12_100);
    const card = page.getByRole("dialog");
    await expect(card.getByRole("button", { name: "Continue to book", exact: true })).toBeVisible();
    await expect(card.getByRole("button", { name: "Return to shelf", exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Continue to book", exact: true }).click();
    await page.clock.resume();
    await expect(card.locator(".book-preparing-screen")).toHaveCount(0);
    await expect(card.getByRole("link", { name: "Open Tigers collection" })).toBeVisible();
    release();
    await expect(card.locator(".book-detail-photo img")).toHaveAttribute("data-photo-state", "loaded");
    await expect(card.locator(".book-preparing-screen")).toHaveCount(0);
  } finally { release(); }
});
