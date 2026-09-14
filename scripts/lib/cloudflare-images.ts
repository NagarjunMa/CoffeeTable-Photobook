import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { z } from "zod";
import { deliveryConfigSchema, signImageUrl } from "../../src/lib/cloudflare-signing";
import { imageVariants } from "../../src/lib/image-variants";
import { cloudflareRequest } from "./cloudflare-request";

const uploadConfigSchema = deliveryConfigSchema.extend({
  CLOUDFLARE_ACCOUNT_ID: z.string().regex(/^[a-f0-9]{32}$/i),
  CLOUDFLARE_IMAGES_API_TOKEN: z.string().min(10),
});
const cloudflareId = z.string().regex(/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
const imageSchema = z.object({
  id: cloudflareId,
  requireSignedURLs: z.boolean(),
  variants: z.array(z.string()).optional(),
});
const cacheSchema = z.object({
  accountId: z.string(),
  entries: z.record(z.string(), z.object({
    imageId: cloudflareId, width: z.number().positive(), height: z.number().positive(),
  })),
});

class CloudflareRequestError extends Error {
  constructor(public status: number, codes: number[]) {
    super(`Cloudflare Images request failed (${status}; codes: ${codes.join(", ")}).`);
  }
}

const isTransient = (error: unknown) => error instanceof TypeError ||
  (error instanceof CloudflareRequestError && (error.status === 429 || error.status >= 500)) ||
  (error instanceof DOMException && error.name === "TimeoutError");

export function writeJsonAtomic(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

export async function prepareWebMaster(source: Buffer) {
  try {
    await sharp(source).metadata();
  } catch (error) {
    if (process.platform !== "darwin" || !(error instanceof Error) || !/heif/i.test(error.message)) throw error;
    // ImageIO can decode some Apple HEIF variants that bundled libheif rejects.
    const temporary = await mkdtemp(join(tmpdir(), "portfolio-heif-"));
    try {
      const input = join(temporary, "source.heic");
      const output = join(temporary, "decoded.png");
      await writeFile(input, source, { mode: 0o600 });
      await promisify(execFile)("/usr/bin/sips", ["-s", "format", "png", input, "--out", output], { timeout: 60_000 });
      source = await readFile(output);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  const result = await sharp(source).rotate()
    .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
    .withIccProfile("srgb")
    .withExif({ IFD0: {
      Artist: "Nagarjun Mallesh",
      Copyright: "Copyright Nagarjun Mallesh. All rights reserved.",
    } })
    .jpeg({ quality: 96, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  if (result.data.length >= 10_000_000) {
    throw new Error("Web master exceeds Cloudflare's 10 MB upload limit. Export this photograph as a high-quality JPEG under 10 MB.");
  }
  return result;
}

export async function createCloudflarePublisher(root: string, request = cloudflareRequest) {
  const parsed = uploadConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid Cloudflare configuration: ${parsed.error.issues.map(i => i.path.join(".")).join(", ")}`);
  }
  const config = parsed.data;
  const apiRoot = `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/images/v1`;
  const cachePath = join(root, ".cache", "cloudflare-images.json");
  const saved = existsSync(cachePath) ? cacheSchema.parse(JSON.parse(readFileSync(cachePath, "utf8"))) : undefined;
  const cache = saved?.accountId === config.CLOUDFLARE_ACCOUNT_ID ? saved : {
    accountId: config.CLOUDFLARE_ACCOUNT_ID, entries: {},
  } as z.infer<typeof cacheSchema>;

  async function api(path: string, init: RequestInit = {}) {
    const endpoint = path.startsWith("/v2?") ? `${apiRoot.replace(/\/v1$/, "")}${path}` : `${apiRoot}${path}`;
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await request(endpoint, {
          ...init, headers: { Authorization: `Bearer ${config.CLOUDFLARE_IMAGES_API_TOKEN}`, Connection: "close" },
          signal: AbortSignal.timeout(60_000),
        });
        if (response.status === 429 || response.status >= 500) {
          await response.body?.cancel();
          throw new CloudflareRequestError(response.status, []);
        }
        const data = await response.json();
        if (!response.ok || data.success !== true) {
          // Do not print provider request objects; they can contain authorization headers.
          throw new CloudflareRequestError(response.status, (data.errors ?? []).map((e: { code: number }) => e.code));
        }
        return data.result;
      } catch (error) {
        if (init.method === "POST" || attempt >= 2 || !isTransient(error)) throw error;
        await delay(500 * (attempt + 1));
      }
    }
  }

  const variantResult = await api("/variants");
  for (const [name, edge] of Object.entries(imageVariants)) {
    const variant = variantResult.variants?.[name];
    if (!variant || variant.neverRequireSignedURLs !== false ||
        variant.options.fit !== "scale-down" || variant.options.width !== edge ||
        variant.options.height !== edge || variant.options.metadata !== "copyright") {
      throw new Error(`Configure Cloudflare variant ${name}: ${edge} x ${edge}, scale-down, copyright metadata, public access disabled.`);
    }
  }
  // A single public override would bypass signing, even for variants unused by the app.
  if (Object.values(variantResult.variants).some((v) =>
    (v as { neverRequireSignedURLs?: boolean }).neverRequireSignedURLs === true)) {
    throw new Error("Disable 'Always allow public access' on every Cloudflare Images variant.");
  }

  const keys = await api("/keys");
  if (!keys.keys?.some((key: { value: string }) => key.value === config.CLOUDFLARE_IMAGES_SIGNING_KEY)) {
    throw new Error("Cloudflare signing key does not match this account.");
  }

  // Recover uploads accepted before a previous run lost its response or cache write.
  const recovered = new Map<string, z.infer<typeof imageSchema>>();
  async function recoverUploads() {
    let cursor: string | undefined;
    do {
      const result = await api(`/v2?per_page=1000${cursor ? `&continuation_token=${encodeURIComponent(cursor)}` : ""}`);
      for (const item of result.images ?? []) {
        if (item.meta?.portfolio === "photography-portfolio" && typeof item.meta?.fingerprint === "string") {
          recovered.set(item.meta.fingerprint, imageSchema.parse(item));
        }
      }
      cursor = result.continuation_token || undefined;
    } while (cursor);
  }
  await recoverUploads();

  let uploaded = 0;
  let reused = 0;
  return {
    stats: () => ({ uploaded, reused }),
    async upload(file: { id: string; name: string; modifiedTime?: string | null }, download: () => Promise<Buffer>) {
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(["jpeg96-srgb-4096-v1", file.id, file.modifiedTime])).digest("hex");
      const previous = file.modifiedTime ? cache.entries[fingerprint] : undefined;
      if (previous) {
        const remote = imageSchema.parse(await api(`/${previous.imageId}`));
        if (!remote.requireSignedURLs) throw new Error("Cached Cloudflare image is no longer private.");
        reused += 1;
        return previous;
      }
      const { data, info } = await prepareWebMaster(await download());
      let remote = recovered.get(fingerprint);
      let wasReused = !!remote;
      const form = new FormData();
      form.set("file", new Blob([new Uint8Array(data)], { type: "image/jpeg" }), "photograph.jpg");
      form.set("requireSignedURLs", "true");
      form.set("metadata", JSON.stringify({ portfolio: "photography-portfolio", driveFileId: file.id, fingerprint }));
      // Let Cloudflare assign the UUID; custom paths do not support private delivery.
      for (let attempt = 0; !remote; attempt++) {
        try {
          remote = imageSchema.parse(await api("", { method: "POST", body: form }));
        } catch (error) {
          if (attempt >= 2 || !isTransient(error)) throw error;
          console.log("  Upload interrupted; checking Cloudflare before retrying...");
          await delay(1000 * (attempt + 1));
          await recoverUploads();
          remote = recovered.get(fingerprint);
          wasReused = !!remote;
        }
      }
      if (!remote.requireSignedURLs) throw new Error("Cloudflare did not mark the uploaded image private.");
      if (!remote.variants?.every((value) => new URL(value).pathname.split("/")[1] === config.CLOUDFLARE_IMAGES_ACCOUNT_HASH)) {
        throw new Error("Images account hash does not match the upload account.");
      }
      const entry = { imageId: remote.id, width: info.width, height: info.height };
      cache.entries[fingerprint] = entry;
      writeJsonAtomic(cachePath, cache);
      if (wasReused) reused += 1;
      else uploaded += 1;
      return entry;
    },
    async verify(imageId: string) {
      const url = signImageUrl(imageId, "mobile", config);
      const signed = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      await signed.body?.cancel();
      if (!signed.ok || !signed.headers.get("content-type")?.startsWith("image/")) {
        throw new Error(`Cloudflare signed delivery failed (${signed.status}).`);
      }
      const unsignedUrl = new URL(url);
      unsignedUrl.search = "";
      const unsigned = await fetch(unsignedUrl, { signal: AbortSignal.timeout(30_000) });
      await unsigned.body?.cancel();
      if (unsigned.status !== 401 && unsigned.status !== 403) {
        throw new Error(`Expected unsigned delivery to be denied, received ${unsigned.status}.`);
      }
    },
  };
}
