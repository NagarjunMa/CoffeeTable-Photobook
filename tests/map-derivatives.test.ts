import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { derivativeSizes, prepareMaps } from "../scripts/prepare-maps";
import type { MapDerivativeManifest } from "../scripts/prepare-maps";
import { writeJsonAtomic } from "../scripts/lib/cloudflare-images";

test("long-edge sizing uses actual portrait widths, not long-edge descriptors", () => {
  assert.deepEqual(derivativeSizes(3375, 6000), [
    { requestedLongEdge: 960, width: 540, height: 960 },
    { requestedLongEdge: 1920, width: 1080, height: 1920 },
    { requestedLongEdge: 2560, width: 1440, height: 2560 },
    { requestedLongEdge: 3840, width: 2160, height: 3840 },
  ]);
  assert.deepEqual(derivativeSizes(6000, 3375)[3],
    { requestedLongEdge: 3840, width: 3840, height: 2160 });
  assert.deepEqual(derivativeSizes(3630, 4830)[0],
    { requestedLongEdge: 960, width: 721, height: 960 });
});

test("small images never upscale and repeated width descriptors are removed", () => {
  assert.deepEqual(derivativeSizes(400, 800), [
    { requestedLongEdge: 960, width: 400, height: 800 },
  ]);
  assert.deepEqual(derivativeSizes(1000, 1000, [1920, 960, 960, 3840]), [
    { requestedLongEdge: 960, width: 960, height: 960 },
    { requestedLongEdge: 1920, width: 1000, height: 1000 },
  ]);
  assert.equal(derivativeSizes(1, 6000).length, 1);
});

test("invalid dimensions and requested edges fail explicitly", () => {
  for (const value of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => derivativeSizes(value, 100));
    assert.throws(() => derivativeSizes(100, value));
    assert.throws(() => derivativeSizes(100, 100, [value]));
  }
});

test("atomic JSON publication replaces complete manifests and preserves the old file on serialization failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-map-publication-test-"));
  try {
    const path = join(root, "map-derivatives.json");
    writeJsonAtomic(path, { version: 1, collections: {} });
    const updated = { version: 1, collections: { maine: { status: "blocked" } } };
    writeJsonAtomic(path, updated);
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), updated);
    assert.deepEqual(await readdir(root), ["map-derivatives.json"]);
    const circular: { self?: unknown } = {};
    circular.self = circular;
    assert.throws(() => writeJsonAtomic(path, circular), TypeError);
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), updated);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local derivatives preserve masters, report encoded dimensions and reuse shared art", async () => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-map-test-"));
  try {
    const publicDir = join(root, "public");
    await mkdir(publicDir);
    const sourcePath = join(publicDir, "map.png");
    await sharp({ create: { width: 1200, height: 1800, channels: 3, background: "white" } })
      .png().toFile(sourcePath);
    const before = await readFile(sourcePath);
    const items = [{ slug: "santa-cruz", mapPoster: { src: "/map.png", alt: "Map" } },
      { slug: "maine" }];
    const manifest = await prepareMaps({ root, items });
    const { desktop, mobile } = manifest.collections["santa-cruz"];
    assert.deepEqual(desktop.candidates, mobile.candidates);
    assert.deepEqual(desktop.focalPoint, { x: 50, y: 38 });
    assert.equal(desktop.status, "needs-artwork-review");
    assert.equal(desktop.candidates.length, 2);
    for (const candidate of desktop.candidates) {
      const data = await readFile(join(publicDir, candidate.src));
      const metadata = await sharp(data).metadata();
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.width, candidate.width);
      assert.equal(metadata.height, candidate.height);
      assert.equal(data.length, candidate.bytes);
      assert.ok(candidate.width <= 1200 && candidate.height <= 1800);
    }
    assert.deepEqual(await readFile(sourcePath), before);
    assert.equal(manifest.collections.maine.desktop.status, "blocked");
    assert.equal(manifest.collections.maine.mobile.fallback, null);
    assert.deepEqual(manifest.collections.maine.desktop.candidates, []);
    assert.deepEqual(await prepareMaps({ root, items }), manifest);
    assert.equal((await readdir(join(publicDir, "map-posters/optimized"))).length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("source resolution never requests remote maps or silently skips broken mappings", async () => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-map-input-test-"));
  try {
    await mkdir(join(root, "public"));
    for (const src of ["https://example.invalid/map.png", "//example.invalid/map.png",
      "/map.png?query=not-allowed", "/missing.png"]) {
      await assert.rejects(prepareMaps({ root,
        items: [{ slug: "test", mapPoster: { src, alt: "Map" } }] }));
    }
    await assert.rejects(prepareMaps({ root, suppliedDir: join(root, "missing"),
      items: [{ slug: "maine" }] }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("EXIF orientation is reflected in encoded dimensions without modifying the source", async () => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-map-orientation-test-"));
  try {
    await mkdir(join(root, "public"));
    const sourcePath = join(root, "public/rotated.jpg");
    await sharp({ create: { width: 120, height: 80, channels: 3, background: "white" } })
      .withMetadata({ orientation: 6 }).jpeg().toFile(sourcePath);
    const manifest = await prepareMaps({ root,
      items: [{ slug: "test", mapPoster: { src: "/rotated.jpg", alt: "Map" } }] });
    const variant = manifest.collections.test.desktop;
    assert.equal(variant.source?.width, 80);
    assert.equal(variant.source?.height, 120);
    assert.equal(variant.candidates[0].width, 80);
    assert.equal(variant.candidates[0].height, 120);
    assert.equal((await sharp(sourcePath).metadata()).orientation, 6);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checked-in picture manifest matches every generated WebP", async () => {
  const manifest: MapDerivativeManifest = JSON.parse(await readFile(
    new URL("../src/data/map-derivatives.json", import.meta.url), "utf8"));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.quality, 95);
  const seen = new Set<string>();
  for (const variants of Object.values(manifest.collections)) {
    for (const variant of Object.values(variants)) {
      if (!variant.source) {
        assert.equal(variant.status, "blocked");
        assert.equal(variant.fallback, null);
        assert.deepEqual(variant.candidates, []);
        continue;
      }
      assert.ok(variant.fallback);
      assert.ok(variant.candidates.some((candidate) => candidate.src === variant.fallback?.src));
      assert.equal(new Set(variant.candidates.map((candidate) => candidate.width)).size,
        variant.candidates.length);
      for (const candidate of variant.candidates) {
        assert.ok(candidate.width <= variant.source.width && candidate.height <= variant.source.height);
        assert.ok(Math.max(candidate.width, candidate.height) <= candidate.requestedLongEdge);
        assert.match(candidate.src, /^\/map-posters\/optimized\/[a-z0-9-]+\.webp$/);
        if (seen.has(candidate.src)) continue;
        seen.add(candidate.src);
        const data = await readFile(new URL(`../public${candidate.src}`, import.meta.url));
        const metadata = await sharp(data).metadata();
        assert.equal(metadata.format, "webp");
        assert.equal(metadata.width, candidate.width);
        assert.equal(metadata.height, candidate.height);
        assert.equal(data.length, candidate.bytes);
      }
    }
  }
  assert.ok(seen.size > 0);
});
