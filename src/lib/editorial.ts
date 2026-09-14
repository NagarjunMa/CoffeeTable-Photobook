import { z } from "zod";
import type { Collection, PortfolioImage } from "../data/types";

const text = z.string().trim().min(1);
const stableId = z.string().min(1).regex(/^\S+$/, "IDs must not contain whitespace");
const reviewStatus = z.enum(["draft", "approved"]);
const mapPresentationSchema = z.object({
  focalPosition: z.string()
    .regex(/^\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/, "Use two percentages, for example 60% 40%")
    .refine((value) => value.split(" ").every((part) => Number.parseFloat(part) <= 100),
      "Focal percentages must be between 0 and 100")
    .optional(),
  scrim: z.number().min(0).max(1).optional(),
}).strict();
const imageEditorialSchema = z.union([
  z.object({
    reviewStatus,
    alt: text.optional(),
    caption: text.nullable().optional(),
  }).strict(),
  z.object({ reviewStatus: z.literal("blocked"), reason: text }).strict(),
]);

const collectionEditorialSchema = z.object({
  reviewStatus,
  title: text.optional(),
  location: text.optional(),
  note: text.optional(),
  category: text.nullable().optional(),
  year: text.nullable().optional(),
  mapPresentation: z.object({
    desktop: mapPresentationSchema.optional(),
    mobile: mapPresentationSchema.optional(),
  }).strict().optional(),
  coverIds: z.array(stableId).min(1).optional(),
  spreads: z.array(z.array(stableId).min(1).max(3)).optional(),
  images: z.record(stableId, imageEditorialSchema).optional(),
}).strict().superRefine((entry, ctx) => {
  for (const [field, ids] of [
    ["coverIds", entry.coverIds ?? []],
    ["spreads", entry.spreads?.flat() ?? []],
  ] as const) {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: [field], message: "Duplicate image IDs are not allowed" });
    }
  }
});

export const editorialSchema = z.object({
  version: z.literal(1),
  collections: z.record(stableId, collectionEditorialSchema),
}).strict();

export type Editorial = z.infer<typeof editorialSchema>;
type MergeOptions = {
  /** For a deliberate local review only; published collections use approved records. */
  includeDrafts?: boolean;
  warn?: (message: string) => void;
};

/** Validate and merge without mutating the sync-owned manifest or changing image order. */
export function applyEditorialOverrides(
  collections: Collection[],
  input: unknown,
  { includeDrafts = false, warn = console.warn }: MergeOptions = {},
): Collection[] {
  const editorial = editorialSchema.parse(input);
  const folderIds = collections.flatMap((collection) =>
    collection.sourceFolderId ? [collection.sourceFolderId] : []);
  if (new Set(folderIds).size !== folderIds.length) {
    throw new Error("Duplicate source folder IDs in collections");
  }
  const knownFolders = new Set(folderIds);
  for (const id of Object.keys(editorial.collections)) {
    if (!knownFolders.has(id)) warn(`[editorial] Stale folder ID excluded: ${id}`);
  }

  return collections.map((collection) => {
    const entry = collection.sourceFolderId
      ? editorial.collections[collection.sourceFolderId]
      : undefined;
    if (!entry) return collection;

    const photos = new Map(collection.images.map((photo) => [photo.id, photo]));
    if (photos.size !== collection.images.length) {
      throw new Error(`Duplicate image IDs in collection ${collection.sourceFolderId}`);
    }
    const referenced = new Set([
      ...Object.keys(entry.images ?? {}),
      ...(entry.coverIds ?? []),
      ...(entry.spreads?.flat() ?? []),
    ]);
    for (const id of referenced) {
      if (!photos.has(id)) warn(`[editorial] Stale image ID excluded from ${collection.sourceFolderId}: ${id}`);
    }
    const spreads = entry.spreads?.map((spread) => spread.filter((id) => photos.has(id)))
      .filter((spread) => spread.length > 0);
    for (const spread of spreads ?? []) {
      if (spread.length === 3 && spread.some((id) => photos.get(id)!.orientation === "landscape")) {
        throw new Error(`Three-image spreads require portrait or square images: ${collection.sourceFolderId}`);
      }
    }

    const images: PortfolioImage[] = collection.images.map((photo) => {
      const override = entry.images?.[photo.id];
      if (!override || override.reviewStatus === "blocked"
        || (override.reviewStatus !== "approved" && !includeDrafts)) return photo;
      return {
        ...photo,
        ...(override.alt !== undefined ? { alt: override.alt } : {}),
        ...(override.caption !== undefined ? { caption: override.caption ?? undefined } : {}),
      };
    });
    const updatedPhotos = new Map(images.map((photo) => [photo.id, photo]));
    const result: Collection = {
      ...collection,
      images,
      coverImages: collection.coverImages.map((photo) => updatedPhotos.get(photo.id) ?? photo),
    };
    // Image review is independent of collection-level copy and sequencing approval.
    if (entry.reviewStatus !== "approved" && !includeDrafts) return result;

    for (const field of ["title", "location", "note"] as const) {
      if (entry[field] !== undefined) result[field] = entry[field];
    }
    for (const field of ["category", "year"] as const) {
      if (entry[field] !== undefined) result[field] = entry[field] ?? undefined;
    }
    if (entry.mapPresentation) {
      result.mapPresentation = { ...collection.mapPresentation };
      for (const device of ["desktop", "mobile"] as const) {
        const override = entry.mapPresentation[device];
        if (!override) continue;
        const presentation = { ...collection.mapPresentation?.[device], ...override };
        result.mapPresentation[device] = presentation;
        const field = device === "desktop" ? "mapPosterDesktop" : "mapPosterMobile";
        const poster = collection[field] ?? collection.mapPoster;
        // Never invent a map source; manifest-only maps consume mapPresentation directly.
        if (poster) result[field] = { ...poster, ...presentation };
      }
    }
    if (entry.coverIds) {
      const covers = entry.coverIds.flatMap((id) => {
        const photo = updatedPhotos.get(id);
        return photo ? [photo] : [];
      });
      // All-stale selections must not erase usable generated covers.
      if (covers.length) result.coverImages = covers;
    }
    if (spreads) {
      const assigned = new Set(spreads.flat());
      result.spreads = [
        ...spreads,
        ...images.filter((photo) => !assigned.has(photo.id)).map((photo) => [photo.id]),
      ];
    }
    return result;
  });
}
