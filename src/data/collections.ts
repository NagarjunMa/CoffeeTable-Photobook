import generatedCollections from "./generated/collections.json";
import editorial from "./editorial.json";
import { applyEditorialOverrides } from "../lib/editorial";
import { sampleCollections } from "./sample-collections";
import type { Collection } from "./types";

export type { Collection, PortfolioImage } from "./types";

const hasGeneratedCollections = generatedCollections.length > 0;

const tigersIntroduction = {
  title: "Tigers",
  slug: "tigers",
  location: "Indian Tiger Reserves",
  category: "Wildlife",
  note: "A growing study of wild tigers across India's reserve forests, shaped by patience, presence, and the quiet between sightings.",
  indexNote: "Wild tigers, observed across India's reserve forests.",
  introArtworkType: "illustration",
  mapPoster: {
    src: "/intro-art/tigers-line-poster.webp",
    alt: "Detailed monochrome line illustration of a tiger among forest foliage",
  },
  mapPresentation: {
    desktop: { focalPosition: "50% 50%", scrim: 0.82 },
    mobile: { focalPosition: "51% 50%", scrim: 0.78 },
  },
} satisfies Pick<Collection,
  "title" | "slug" | "location" | "category" | "note" | "indexNote" |
  "introArtworkType" | "mapPoster" | "mapPresentation">;

const applyTigersIntroduction = (items: Collection[]): Collection[] => {
  const hasSyncedTigers = items.some((collection) => collection.slug === "tigers");
  if (!hasSyncedTigers) {
    return [...items, { ...tigersIntroduction, coverImages: [], images: [] }];
  }
  return items.map((collection) => collection.slug === "tigers"
    ? { ...collection, ...tigersIntroduction }
    : collection);
};

const localDesktopMapPosterOverrides: Record<
  string,
  Collection["mapPosterDesktop"]
> = {
  hampi: {
    src: "/map-posters/hampi-desktop.png",
    alt: "Hampi street and river map for desktop",
  },
  "new-york": {
    src: "/map-posters/new-york-desktop.png",
    alt: "Clean New York City street map for desktop",
  },
  "santa-cruz": {
    src: "/map-posters/santa-cruz-desktop.png",
    alt: "Clean Santa Cruz street map for desktop",
  },
  washington: {
    src: "/map-posters/washington-dc-desktop.png",
    alt: "Clean Washington DC street map for desktop",
  },
};

const localMobileMapPosterOverrides: Record<
  string,
  Collection["mapPosterMobile"]
> = {
  hampi: {
    src: "/map-posters/hampi-mobile.png",
    alt: "Hampi street and river map for mobile",
  },
  "new-york": {
    src: "/map-posters/new-york-mobile.png",
    alt: "Clean New York City street map for mobile",
  },
  "santa-cruz": {
    src: "/map-posters/santa-cruz-mobile.png",
    alt: "Clean Santa Cruz street map for mobile",
  },
  washington: {
    src: "/map-posters/washington-dc-mobile.png",
    alt: "Clean Washington DC street map for mobile",
  },
};

const applyLocalOverrides = (items: Collection[]): Collection[] =>
  items.map((collection) => ({
    ...collection,
    mapPosterDesktop:
      collection.mapPosterDesktop ??
      localDesktopMapPosterOverrides[collection.slug],
    mapPosterMobile:
      collection.mapPosterMobile ?? localMobileMapPosterOverrides[collection.slug],
  }));

export const collections: Collection[] = applyEditorialOverrides(
  applyLocalOverrides(
    applyTigersIntroduction(
      hasGeneratedCollections
        ? (generatedCollections as unknown as Collection[])
        : sampleCollections,
    ),
  ),
  editorial,
  { includeDrafts: process.env.NEXT_PUBLIC_EDITORIAL_PREVIEW === "true" },
);

export const getCollection = (slug: string) =>
  collections.find((collection) => collection.slug === slug);
