import type { CSSProperties } from "react";
import type { Collection } from "@/data/types";
import mapManifest from "@/data/map-derivatives.json";

type Candidate = { src: string; width: number; height: number };
type Variant = { fallback: Candidate | null; candidates: Candidate[]; objectPosition: string; source: { path: string; kind: string } | null };
const preparedMaps = mapManifest.collections as Record<string, { desktop: Variant; mobile: Variant }>;

function source(collection: Collection, device: "desktop" | "mobile") {
  const poster = (device === "desktop" ? collection.mapPosterDesktop : collection.mapPosterMobile) ?? collection.mapPoster;
  const prepared = preparedMaps[collection.slug]?.[device];
  // A newly supplied master must not silently use an older derivative.
  if (prepared?.fallback && (!poster || prepared.source?.path === "public" + poster.src)) return {
    ...prepared.fallback,
    srcSet: prepared.candidates.map((item) => `${item.src} ${item.width}w`).join(", "),
    position: collection.mapPresentation?.[device]?.focalPosition ?? poster?.focalPosition ?? prepared.objectPosition,
    alt: poster?.alt ?? `Map of ${collection.location}`,
  };
  return poster ? {
    src: poster.src, width: undefined, height: undefined,
    srcSet: poster.sources?.map((item) => `${item.src} ${item.width}w`).join(", "),
    position: collection.mapPresentation?.[device]?.focalPosition ?? poster.focalPosition ?? "50% 50%",
    alt: poster.alt,
  } : null;
}

export function CollectionMap({ collection }: { collection: Collection }) {
  const desktop = source(collection, "desktop");
  const mobile = source(collection, "mobile") ?? desktop;
  if (!mobile) return null;
  return <figure className="book-map" style={{ "--map-position-mobile": mobile.position, "--map-position-desktop": desktop?.position ?? mobile.position } as CSSProperties}>
    <picture>
      {desktop && <source media="(min-width: 768px)" srcSet={desktop.srcSet ?? desktop.src} sizes="(min-width: 900px) 40vw, 90vw" />}
      {/* The map variants are already optimized and must bypass another image proxy. */}
      <img src={mobile.src} srcSet={mobile.srcSet} sizes="(min-width: 900px) 40vw, 90vw" width={mobile.width} height={mobile.height} alt={mobile.alt} className="book-map-image" decoding="async" />
    </picture>
    {collection.introArtworkType !== "illustration" && <figcaption>Map data © OpenStreetMap contributors</figcaption>}
  </figure>;
}
