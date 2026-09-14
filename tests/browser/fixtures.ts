import { test as base, expect } from "@playwright/test";
import sharp from "sharp";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import collections from "../../src/data/generated/collections.json";

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try { sessionStorage.setItem("nm-portfolio-intro-played", "true"); } catch {}
    });
    const photos = collections.flatMap((collection) => collection.images);
    const cache = new Map<string, Buffer>();
    await page.route("**/api/photographs/**", async (route) => {
      const photo = photos.find((item) => route.request().url().includes(item.cloudflareImageId ?? "__none__"));
      if (!photo) return route.fulfill({ status: 404 });
      let body = cache.get(photo.id);
      if (!body) {
        // Private local copies are optional visual fixtures, never copied into public/.
        const backup = path.resolve(".cache/collections-before-cloudflare.json");
        let source: string | undefined;
        if (existsSync(backup)) {
          const previous = JSON.parse(await readFile(backup, "utf8")) as Array<{ images: Array<{ id: string; src: string }> }>;
          const old = previous.flatMap((item) => item.images).find((item) => item.id === photo.id);
          if (old) {
            const candidate = path.resolve(".cache/retired-public-photographs", old.src.replace(/^\/photography\//, ""));
            if (existsSync(candidate)) source = candidate;
          }
        }
        body = source
          ? await sharp(source).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
          : await sharp({ create: { width: 480, height: Math.round(480 * photo.height / photo.width), channels: 3, background: "#8a9391" } }).png().toBuffer();
        cache.set(photo.id, body);
      }
      await route.fulfill({ status: 200, contentType: sourceType(body), body });
    });
    await provide(page);
  },
});

function sourceType(buffer: Buffer) { return buffer[0] === 0x89 ? "image/png" : "image/jpeg"; }
export { expect };
