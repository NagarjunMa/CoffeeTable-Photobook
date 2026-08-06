import generatedCollections from "./generated/collections.json";
import { sampleCollections } from "./sample-collections";
import type { Collection } from "./types";

export type { Collection, PortfolioImage } from "./types";

const hasGeneratedCollections = generatedCollections.length > 0;

const localMapPosterOverrides: Record<string, Collection["mapPoster"]> = {
  "new-york": {
    src: "/map-posters/new-york-city.png",
    alt: "Minimal New York City map poster",
  },
  "santa-cruz": {
    src: "/map-posters/santa-cruz.png",
    alt: "Sunset-toned Santa Cruz map poster",
  },
};

const localDesktopMapPosterOverrides: Record<
  string,
  Collection["mapPosterDesktop"]
> = {
  washington: {
    src: "/map-posters/washington-dc-desktop.png",
    alt: "Minimal Washington DC map poster for desktop",
  },
};

const localMobileMapPosterOverrides: Record<
  string,
  Collection["mapPosterMobile"]
> = {
  washington: {
    src: "/map-posters/washington-dc-mobile.png",
    alt: "Minimal Washington DC map poster for mobile",
  },
};

const applyLocalOverrides = (items: Collection[]): Collection[] =>
  items.map((collection) => ({
    ...collection,
    mapPoster: collection.mapPoster ?? localMapPosterOverrides[collection.slug],
    mapPosterDesktop:
      collection.mapPosterDesktop ??
      localDesktopMapPosterOverrides[collection.slug],
    mapPosterMobile:
      collection.mapPosterMobile ?? localMobileMapPosterOverrides[collection.slug],
  }));

export const collections: Collection[] = applyLocalOverrides(
  hasGeneratedCollections
    ? (generatedCollections as unknown as Collection[])
    : sampleCollections,
);

export const getCollection = (slug: string) =>
  collections.find((collection) => collection.slug === slug);
