import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Collection } from "../src/data/types";
import { deliveryConfigSchema, signImageUrl } from "../src/lib/cloudflare-signing";
import { imageVariants, type ImageVariant } from "../src/lib/image-variants";
import { loadLocalEnv } from "./lib/local-env";

async function verify() {
  loadLocalEnv(process.cwd());
  const parsed = deliveryConfigSchema.safeParse(process.env);
  if (!parsed.success) throw new Error("Configure Cloudflare delivery in .env.local first.");
  const config = parsed.data;
  const collections: Collection[] = JSON.parse(readFileSync(join(process.cwd(), "src/data/generated/collections.json"), "utf8"));
  const photos = collections.flatMap(c => c.images);
  if (!photos.length || photos.some(photo => !photo.cloudflareImageId)) {
    throw new Error("Run npm run sync:cloudflare before verification; some photographs still use local delivery.");
  }
  async function check(url: string, allowed: boolean) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    await response.body?.cancel();
    if (allowed ? !response.ok || !response.headers.get("content-type")?.startsWith("image/")
      : response.status !== 401 && response.status !== 403) {
      throw new Error(`Image delivery check failed (${response.status}, expected ${allowed ? "image" : "denial"}).`);
    }
  }
  for (const photo of photos) await check(signImageUrl(photo.cloudflareImageId!, "mobile", config), true);
  const first = photos[0].cloudflareImageId!;
  for (const variant of Object.keys(imageVariants) as ImageVariant[]) {
    const signed = new URL(signImageUrl(first, variant, config));
    await check(signed.toString(), true);
    signed.search = "";
    await check(signed.toString(), false);
  }
  const expired = signImageUrl(first, "gallery", config, Math.floor(Date.now() / 1000) - config.CLOUDFLARE_IMAGES_URL_TTL_SECONDS - 60);
  await check(expired, false);
  const tampered = new URL(signImageUrl(first, "gallery", config));
  tampered.searchParams.set("exp", "9999999999");
  await check(tampered.toString(), false);
  console.log(`Verified ${photos.length} private photographs and all 5 variants. Unsigned, expired, and tampered URLs were denied.`);
}

verify().catch(error => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
