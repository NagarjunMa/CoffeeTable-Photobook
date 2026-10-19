import type { Collection } from "@/data/types";
import { imagePath } from "@/lib/image-variants";

const bindings: Record<string, string> = {
  hampi: "#9b542c",
  maine: "#314d43",
  "new-york": "#283c53",
  "santa-cruz": "#a34336",
  washington: "#55435d",
  tigers: "#666039",
  bhutan: "#7d3036",
  ranganathittu: "#31656b",
};

export function bookPresentation(collection: Collection) {
  const cover = collection.coverImages[0] ?? collection.images[0];
  return {
    color: bindings[collection.slug] ?? "#405649",
    cover,
    coverSrc: cover
      ? cover.cloudflareImageId ? imagePath(cover.cloudflareImageId, "mobile") : cover.src
      : collection.mapPosterMobile?.src ?? collection.mapPoster?.src,
    introduction: collection.indexNote ?? collection.note,
    count: collection.images.length ? `${collection.images.length} photographs` : "In preparation",
    year: collection.year && /\b\d{4}\b/.test(collection.year) ? collection.year : undefined,
  };
}
