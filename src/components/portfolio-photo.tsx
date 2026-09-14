"use client";

import type { ImgHTMLAttributes } from "react";
import { useState } from "react";
import type { PortfolioImage } from "@/data/types";
import { imageSources } from "@/lib/image-variants";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height" | "alt"> & {
  photo: PortfolioImage;
  enlarged?: boolean;
};

export function PortfolioPhoto({ photo, enlarged = false, loading = "lazy", ...props }: Props) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Cloudflare performs optimization. A native srcset avoids a second image proxy.
  /* eslint-disable @next/next/no-img-element */
  return <><img key={`${photo.id}-${attempt}`} {...props} {...imageSources(photo, enlarged)}
    alt={photo.alt} width={photo.width} height={photo.height}
    loading={loading} decoding="async" draggable={false}
    style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...props.style }}
    onError={(event) => { setFailed(true); props.onError?.(event); }}
    onLoad={(event) => { setFailed(false); props.onLoad?.(event); }} />
    {failed && <span className="photo-error" role="status">Image unavailable
      <button type="button" onClick={(event) => { event.stopPropagation(); setFailed(false); setAttempt((value) => value + 1); }}>Retry</button>
    </span>}</>;
}
