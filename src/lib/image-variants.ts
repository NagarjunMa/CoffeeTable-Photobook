import type { PortfolioImage } from "../data/types";

export const imageVariants = {
  mobile: 960,
  gallery: 1920,
  retina: 2560,
  lightbox: 3200,
  hero: 4096,
} as const;

export type ImageVariant = keyof typeof imageVariants;

export function imagePath(id: string, variant: ImageVariant) {
  return `/api/photographs/${encodeURIComponent(id)}/${variant}`;
}

export function imageSources(photo: PortfolioImage, enlarged = false) {
  if (!photo.cloudflareImageId) return { src: photo.src };
  const variants: ImageVariant[] = enlarged
    ? ["mobile", "gallery", "retina", "lightbox", "hero"]
    : ["mobile", "gallery", "retina"];
  const widths = new Set<number>();
  const srcSet = variants.flatMap((variant) => {
    // Variant bounds refer to the long edge; srcset descriptors are actual widths.
    const width = Math.round(photo.width * Math.min(1,
      imageVariants[variant] / Math.max(photo.width, photo.height)));
    if (widths.has(width)) return [];
    widths.add(width);
    return [`${imagePath(photo.cloudflareImageId!, variant)} ${width}w`];
  }).join(", ");
  return {
    src: imagePath(photo.cloudflareImageId, enlarged ? "lightbox" : "gallery"),
    srcSet,
  };
}
