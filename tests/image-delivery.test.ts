import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { imageSources } from "../src/lib/image-variants";
import { deliveryConfigSchema, signImageUrl } from "../src/lib/cloudflare-signing";
import { createCloudflarePublisher, prepareWebMaster } from "../scripts/lib/cloudflare-images";
import { GET } from "../src/app/api/photographs/[id]/[variant]/route";

const config = {
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: "test-account",
  CLOUDFLARE_IMAGES_SIGNING_KEY: "test-only-secret-not-a-real-key",
  CLOUDFLARE_IMAGES_URL_TTL_SECONDS: 3600,
};

test("signed delivery uses the provider HMAC contract and bounded expiry", async () => {
  const url = new URL(signImageUrl("image-id", "gallery", config, 1000));
  assert.equal(url.searchParams.get("exp"), "4600");
  const signature = url.searchParams.get("sig")!;
  url.searchParams.delete("sig");
  const key = await webcrypto.subtle.importKey("raw", Buffer.from(config.CLOUDFLARE_IMAGES_SIGNING_KEY),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const verify = (value: string) => webcrypto.subtle.verify("HMAC", key,
    Buffer.from(signature, "hex"), Buffer.from(value));
  assert.equal(await verify(`${url.pathname}?${url.searchParams}`), true);
  assert.equal(await verify(`${url.pathname}?exp=9999999`), false);
  assert.equal(await verify(`${url.pathname.replace("gallery", "hero")}?${url.searchParams}`), false);
  assert.equal(deliveryConfigSchema.safeParse({ ...config, CLOUDFLARE_IMAGES_URL_TTL_SECONDS: 0 }).success, false);
});

test("portrait srcset uses real widths and avoids upscaling small originals", () => {
  const photo = { id: "drive-id", cloudflareImageId: "cf-id", fileName: "portrait.jpg",
    src: "/old.jpg", alt: "Portrait", width: 2000, height: 4000, orientation: "portrait" as const };
  assert.equal(imageSources(photo).srcSet,
    "/api/photographs/cf-id/mobile 480w, /api/photographs/cf-id/gallery 960w, /api/photographs/cf-id/retina 1280w");
  assert.match(imageSources(photo, true).srcSet!, /hero 2000w$/);
  assert.equal(imageSources({ ...photo, width: 400, height: 800 }).srcSet,
    "/api/photographs/cf-id/mobile 400w");
  assert.deepEqual(imageSources({ ...photo, cloudflareImageId: undefined }), { src: "/old.jpg" });
});

test("web masters preserve composition, add attribution, and strip private metadata", async () => {
  const source = await sharp({ create: { width: 120, height: 200, channels: 3, background: "#8090a0" } })
    .withExif({ IFD0: { Model: "PRIVATE_DEVICE_MARKER", Artist: "OLD_CREATOR" } }).jpeg().toBuffer();
  const { data, info } = await prepareWebMaster(source);
  assert.equal(info.width, 120);
  assert.equal(info.height, 200);
  const metadata = await sharp(data).metadata();
  assert.ok(metadata.icc);
  assert.ok(metadata.exif?.includes(Buffer.from("Nagarjun Mallesh")));
  assert.equal(metadata.exif?.includes(Buffer.from("PRIVATE_DEVICE_MARKER")), false);
  assert.equal(metadata.exif?.includes(Buffer.from("OLD_CREATOR")), false);
});

test("delivery endpoint never signs arbitrary image IDs or variants", async () => {
  for (const [id, variant] of [["unpublished-id", "gallery"], ["unpublished-id", "__proto__"]]) {
    const response = await GET(new Request("http://localhost/api/photographs/test/gallery"), {
      params: Promise.resolve({ id, variant }),
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("Location"), null);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});

test("publisher reuses unchanged images and recovers an upload after losing the local cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-publisher-test-"));
  const originalFetch = globalThis.fetch;
  const previousEnv = { ...process.env };
  Object.assign(process.env, config, { CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_IMAGES_API_TOKEN: "test-token-only" });
  let uploads = 0;
  let downloads = 0;
  const remoteImages: object[] = [];
  globalThis.fetch = async (input, init) => {
    const path = new URL(String(input)).pathname;
    let result: unknown;
    if (path.endsWith("/variants")) {
      result = { variants: Object.fromEntries(Object.entries({ mobile: 960, gallery: 1920, retina: 2560, lightbox: 3200, hero: 4096 }).map(([id, edge]) =>
        [id, { neverRequireSignedURLs: false, options: { width: edge, height: edge, fit: "scale-down", metadata: "copyright" } }])) };
    } else if (path.endsWith("/keys")) {
      result = { keys: [{ value: config.CLOUDFLARE_IMAGES_SIGNING_KEY }] };
    } else if (path.endsWith("/v2")) {
      result = { images: remoteImages };
    } else if (init?.method === "POST") {
      uploads++;
      const body = init.body as FormData;
      assert.equal(body.get("requireSignedURLs"), "true");
      assert.equal(body.has("id"), false);
      result = {
        id: "8b8c4a82-984d-49b8-d3a7-70a710b1ee01", requireSignedURLs: true,
        variants: ["https://imagedelivery.net/test-account/test/gallery"],
        meta: JSON.parse(String(body.get("metadata"))),
      };
      remoteImages.push(result as object);
      if (uploads === 1) throw new TypeError("fetch failed");
    } else {
      result = remoteImages[0];
    }
    return Response.json({ success: true, result });
  };
  try {
    const source = await sharp({ create: { width: 30, height: 40, channels: 3, background: "white" } }).jpeg().toBuffer();
    const download = async () => { downloads++; return source; };
    const file = { id: "drive-file", name: "one.jpg", modifiedTime: "2026-01-01" };
    const publisher = await createCloudflarePublisher(root, globalThis.fetch);
    const first = await publisher.upload(file, download);
    assert.deepEqual(await publisher.upload(file, download), first);
    assert.equal(uploads, 1);
    assert.equal(downloads, 1);
    await unlink(join(root, ".cache/cloudflare-images.json"));
    const recovered = await createCloudflarePublisher(root, globalThis.fetch);
    assert.deepEqual(await recovered.upload(file, download), first);
    assert.equal(uploads, 1);
    assert.deepEqual(recovered.stats(), { uploaded: 0, reused: 1 });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
    await rm(root, { recursive: true, force: true });
  }
});
