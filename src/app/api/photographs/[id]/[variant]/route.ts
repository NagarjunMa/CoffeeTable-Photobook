import { collections } from "@/data/collections";
import { deliveryConfigSchema, signImageUrl } from "@/lib/cloudflare-signing";
import { imageVariants, type ImageVariant } from "@/lib/image-variants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publishedIds = new Set(collections.flatMap((collection) =>
  collection.images.flatMap((photo) => photo.cloudflareImageId ? [photo.cloudflareImageId] : [])));
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export async function GET(request: Request, context: {
  params: Promise<{ id: string; variant: string }>;
}) {
  const { id, variant } = await context.params;
  if (!publishedIds.has(id) || !Object.hasOwn(imageVariants, variant)) {
    return new Response("Image not found", { status: 404, headers });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response("Cross-site image embedding is disabled", { status: 403, headers });
  }
  const config = deliveryConfigSchema.safeParse(process.env);
  if (!config.success) {
    return new Response("Image delivery is not configured", { status: 503, headers });
  }
  // Sign on demand so lazy-loaded images and static pages never embed expired URLs.
  return new Response(null, {
    status: 302,
    headers: { ...headers, Location: signImageUrl(id, variant as ImageVariant, config.data) },
  });
}
