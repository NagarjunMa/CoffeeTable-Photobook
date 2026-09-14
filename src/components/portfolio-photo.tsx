"use client";

import type { ImgHTMLAttributes } from "react";
import type { PortfolioImage } from "@/data/types";
import { imageSources } from "@/lib/image-variants";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height" | "alt"> & {
  photo: PortfolioImage;
  enlarged?: boolean;
};

export function PortfolioPhoto({ photo, enlarged = false, loading = "lazy", ...props }: Props) {
  // Cloudflare performs optimization. A native srcset avoids a second image proxy.
  /* eslint-disable @next/next/no-img-element */
  return <img {...props} {...imageSources(photo, enlarged)}
    alt={photo.alt} width={photo.width} height={photo.height}
    loading={loading} decoding="async" draggable={false} />;
}
