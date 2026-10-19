import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { collections } from "../../src/data/collections";

for (const width of [390, 1440]) {
  test(`every volume opens its own detail card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#work");
    const contents = page.getByRole("navigation", { name: "Destination contents" });
    await expect(contents.getByRole("link")).toHaveCount(collections.length);
    for (const collection of collections) {
      const opener = contents.getByRole("link", { name: collection.title, exact: true });
      await opener.click();
      const card = page.getByRole("dialog");
      await expect(card.getByRole("heading", { name: collection.title, exact: true })).toBeVisible();
      await expect(card.getByText(collection.images.length ? `${collection.images.length} photographs` : "In preparation", { exact: true })).toBeVisible();
      await expect(card.locator(".book-facts")).not.toContainText("Field Notes");
      await expect(card.getByRole("link", { name: `Open ${collection.title} collection` })).toHaveAttribute("href", `/series/${collection.slug}`);
      await page.keyboard.press("Escape");
      await expect(card).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("contents keyboard, history and gallery return preserve the selected volume", async ({ page }) => {
  await page.goto("/#work");
  const contents = page.getByRole("navigation", { name: "Destination contents" });
  const first = contents.getByRole("link").first();
  await first.focus();
  await page.keyboard.press("End");
  await expect(contents.getByRole("link", { name: "Bhutan", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  const washington = contents.getByRole("link", { name: "Washington", exact: true });
  await expect(washington).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#city-washington$/);
  const card = page.getByRole("dialog");
  await expect(card).toBeVisible();
  for (let i=0; i<6; i++) {
    await page.keyboard.press(i < 3 ? "Tab" : "Shift+Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))).toBe(true);
  }
  await page.goBack();
  await expect(card).toHaveCount(0);
  await page.goForward();
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Open Washington collection" }).click();
  await expect(page).toHaveURL(/\/series\/washington$/);
  await page.getByRole("link", { name: "Index", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Washington", exact: true })).toBeVisible();
});

test("detail maps switch composition and keep appropriate attribution", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000, mode: "desktop" }, { width: 390, height: 844, mode: "mobile" }]) {
    await page.setViewportSize(viewport);
    for (const slug of ["new-york", "santa-cruz", "washington", "hampi", "bhutan"]) {
      await page.goto(`/#city-${slug}`);
      const card = page.getByRole("dialog");
      const image = card.locator(".book-map-image");
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).currentSrc)).toContain(`${slug}-${viewport.mode}-`);
      await expect(card.locator(".book-map figcaption")).toContainText("OpenStreetMap");
    }
    await page.goto("/#city-tigers");
    const card = page.getByRole("dialog");
    await expect(card.locator(".book-map-image")).toHaveAttribute("src", "/intro-art/tigers-line-poster.webp");
    await expect(card.locator(".book-map figcaption")).toHaveCount(0);
    await expect(card.getByRole("heading", { name: "My first forest" })).toBeVisible();
  }
});

test("actual 3D books can be dragged and picked without opening during a drag", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Physical WebGL interaction is checked in Chrome; other engines exercise the DOM and fallback paths.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#work");
  const shelf = page.locator(".photobook-shelf");
  await expect(shelf).toHaveAttribute("data-enhanced", "true");
  const canvas = page.locator(".photobook-shelf-canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width/2, box.y + box.height*0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width/2 - 245, box.y + box.height*0.55, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".shelf-selection h3")).toHaveText("Maine");
  await page.getByRole("button", { name: "Next photobook", exact: true }).click();
  await expect(page.locator(".shelf-selection h3")).toHaveText("New York");
  await page.waitForTimeout(700);
  await canvas.click({ position: { x: box.width/2, y: box.height*0.55 } });
  await expect(page.getByRole("dialog").getByRole("heading", { name: "New York", exact: true })).toBeVisible();
});

test("a missing WebGL context retains working books and arrow browsing", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function(type: string, ...args: unknown[]) {
      return type.startsWith("webgl") ? null : Reflect.apply(original, this, [type, ...args]);
    } });
  });
  await page.goto("/#work");
  await expect(page.locator(".photobook-shelf")).toHaveAttribute("data-fallback", "true");
  await expect(page.locator(".shelf-fallback")).toBeVisible();
  await page.getByRole("button", { name: "Next photobook", exact: true }).click();
  await expect(page.locator(".shelf-selection h3")).toHaveText("Maine");
  await page.getByRole("button", { name: "Preview Maine photobook" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Maine", exact: true })).toBeVisible();
});

test("without JavaScript every cover remains a real gallery link", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/#work");
  const covers = page.locator(".shelf-fallback-book");
  await expect(covers).toHaveCount(collections.length);
  for (let i=0; i<collections.length; i++) await expect(covers.nth(i)).toHaveAttribute("href", `/series/${collections[i].slug}`);
  await covers.first().click();
  await expect(page).toHaveURL(/\/series\/hampi$/);
  await context.close();
});

test("reduced motion and short landscape keep details readable and accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 320, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/#city-washington");
    const card = page.getByRole("dialog");
    await expect(card.locator(".book-detail-shell")).toHaveCSS("animation-name", "none");
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const open = card.getByRole("link", { name: "Open Washington collection" });
    await open.scrollIntoViewIfNeeded();
    await expect(open).toBeInViewport();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("rapid arrows preserve the requested book while the shelf is moving", async ({ page }) => {
  await page.goto("/#work");
  await expect(page.locator(".photobook-shelf")).toHaveAttribute("data-enhanced", "true");
  const next = page.getByRole("button", { name: "Next photobook", exact: true });
  const label = await page.evaluate(async () => {
    const next = document.querySelector<HTMLButtonElement>('[aria-label="Next photobook"]')!;
    next.click();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return document.querySelector(".shelf-selection h3")?.textContent;
  });
  expect(label).toBe("Maine");
  await next.click();
  await expect(page.locator(".shelf-selection h3")).toHaveText("New York");
  await page.getByRole("button", { name: "Preview New York photobook" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "New York", exact: true })).toBeVisible();
});

test("a fresh direct city visit releases scrolling after its detail closes", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem("nm-portfolio-intro-played"));
  await page.goto("/#city-washington");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('[aria-hidden="true"].fixed')).not.toBeVisible({ timeout: 7000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("failed fallback covers never nest interactive retry inside navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function(type: string, ...args: unknown[]) {
      return type.startsWith("webgl") ? null : Reflect.apply(original, this, [type, ...args]);
    } });
  });
  await page.route("**/api/photographs/**", route => route.fulfill({ status: 503 }));
  await page.goto("/#work");
  await expect(page.locator(".photobook-shelf")).toHaveAttribute("data-fallback", "true");
  await expect(page.locator(".shelf-fallback-book button")).toHaveCount(0);
});
