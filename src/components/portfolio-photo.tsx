"use client";

import type { ImgHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import type { PortfolioImage } from "@/data/types";
import { imageSources } from "@/lib/image-variants";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height" | "alt"> & {
  photo: PortfolioImage;
  enlarged?: boolean;
};

export function PortfolioPhoto(props: Props) {
  // A different photograph owns a fresh loading/retry lifecycle.
  return <PhotoRequest key={`${props.photo.id}-${Boolean(props.enlarged)}`} {...props} />;
}

function PhotoRequest({ photo, enlarged = false, loading = "lazy", ...props }: Props) {
  const [status, setStatus] = useState<"initial" | "loading" | "loaded" | "failed">("initial");
  const [attempt, setAttempt] = useState(0);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Cached responses can complete before React attaches its event handlers.
    const frame = requestAnimationFrame(() => {
      const element = image.current;
      if (element) setStatus(element.complete ? (element.naturalWidth > 0 ? "loaded" : "failed") : "loading");
    });
    return () => cancelAnimationFrame(frame);
  }, [photo.id, attempt]);
  // Cloudflare performs optimization. A native srcset avoids a second image proxy.
  /* eslint-disable @next/next/no-img-element */
  return <><img ref={image} key={`${photo.id}-${attempt}`} {...props} {...imageSources(photo, enlarged)}
    alt={photo.alt} width={photo.width} height={photo.height}
    loading={loading} decoding="async" draggable={false}
    style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...props.style }}
    data-photo-state={status}
    onError={(event) => { setStatus("failed"); props.onError?.(event); }}
    onLoad={(event) => { setStatus("loaded"); props.onLoad?.(event); }} />
    {/* The initial server render never covers a photograph when JavaScript is unavailable. */}
    <span className="photo-loading" hidden={status !== "loading"} aria-hidden="true">Loading photograph</span>
    {status === "failed" && <span className="photo-error" role="status">Image unavailable
      <button type="button" onClick={(event) => { event.stopPropagation(); setStatus("loading"); setAttempt((value) => value + 1); }}>Retry</button>
    </span>}</>;
}
