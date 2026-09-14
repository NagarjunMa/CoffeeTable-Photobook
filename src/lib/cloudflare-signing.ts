import { createHmac } from "node:crypto";
import { z } from "zod";
import type { ImageVariant } from "./image-variants";

export const deliveryConfigSchema = z.object({
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: z.string().regex(/^[A-Za-z0-9_-]+$/),
  CLOUDFLARE_IMAGES_SIGNING_KEY: z.string().min(16),
  CLOUDFLARE_IMAGES_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
});

export function signImageUrl(
  imageId: string,
  variant: ImageVariant,
  config: z.infer<typeof deliveryConfigSchema>,
  now = Math.floor(Date.now() / 1000),
) {
  const url = new URL(`https://imagedelivery.net/${config.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${encodeURIComponent(imageId)}/${variant}`);
  url.searchParams.set("exp", String(now + config.CLOUDFLARE_IMAGES_URL_TTL_SECONDS));
  const signature = createHmac("sha256", config.CLOUDFLARE_IMAGES_SIGNING_KEY)
    .update(`${url.pathname}?${url.searchParams.toString()}`).digest("hex");
  url.searchParams.set("sig", signature);
  return url.toString();
}
