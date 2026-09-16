import generatedCollections from "./generated/collections.json";
import editorial from "./editorial.json";
import { applyEditorialOverrides } from "../lib/editorial";
import { sampleCollections } from "./sample-collections";
import type { Collection } from "./types";

export type { Collection, PortfolioImage } from "./types";

const hasGeneratedCollections = generatedCollections.length > 0;

const localDesktopMapPosterOverrides: Record<
  string,
  Collection["mapPosterDesktop"]
> = {
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
    hasGeneratedCollections
      ? (generatedCollections as unknown as Collection[])
      : sampleCollections,
  ),
  editorial,
  { includeDrafts: process.env.NEXT_PUBLIC_EDITORIAL_PREVIEW === "true" },
);

export const getCollection = (slug: string) =>
  collections.find((collection) => collection.slug === slug);
