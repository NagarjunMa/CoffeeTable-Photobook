import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { Collection } from "../src/data/types";
import { writeJsonAtomic } from "./lib/cloudflare-images";

export const MAP_LONG_EDGES = [960, 1920, 2560, 3840] as const;
const QUALITY = 95;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const suppliedMaine = {
  desktop: "maine_visited_places_desktop_6000x3375.png",
  mobile: "maine_visited_places_mobile_3375x6000.png",
};

// Only these locally inspected exports have a known artwork classification.
const reviewedArtwork: Partial<Record<string, "labeled-poster" | "annotated-atlas">> = {
  "9b8fcede0585e532fc4e0aa886af89e783233eb55151ed954dfb76cdda0817b2": "labeled-poster",
  "3e88d95416498e6871f16931eb9bb2d0bd67d101a40fe58b697754935a8d90a4": "labeled-poster",
  "526d56b7ac8ea3e970b980959ad6f44a477e893ab5e030951e0260fa17a2ab02": "labeled-poster",
  "a9f58245336ff66c500890833ef027e53d2d9a928638777806839cb57ca882a3": "labeled-poster",
  "ea7e1eaa014ee80e2908cb94a42b4fb41b5d1331cac4e968f1dd6273b74990d7": "annotated-atlas",
  "b003585ab2770b09f86118f8c350629d44a6aae8258ae148e2150822b2c6e6e1": "annotated-atlas",
};

export function derivativeSizes(
  width: number,
  height: number,
  longEdges: readonly number[] = MAP_LONG_EDGES,
) {
  for (const value of [width, height, ...longEdges]) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error("Image dimensions and long edges must be positive integers.");
    }
  }
  const seenWidths = new Set<number>();
  return [...new Set(longEdges)].sort((a, b) => a - b).flatMap((requestedLongEdge) => {
    const scale = Math.min(1, requestedLongEdge / Math.max(width, height));
    const dimensions = {
      requestedLongEdge,
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
    if (seenWidths.has(dimensions.width)) return [];
    seenWidths.add(dimensions.width);
    return [dimensions];
  });
}

type Candidate = {
  src: string;
  width: number;
  height: number;
  bytes: number;
  requestedLongEdge: number;
};

type MapSource = {
  kind: "incumbent-public" | "supplied-local";
  path: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  artwork: "labeled-poster" | "annotated-atlas" | "unreviewed";
};

type MapVariant = {
  status: "transitional" | "blocked" | "needs-artwork-review";
  mapOnlyMasterStatus: "blocked" | "unreviewed";
  note: string;
  objectPosition: string;
  focalPoint: { x: number; y: number };
  focalPointBasis: "existing-workflow" | "center-default-needs-integration-review";
  source: MapSource | null;
  fallback: Candidate | null;
  candidates: Candidate[];
};

export type MapDerivativeManifest = {
  version: 1;
  format: "webp";
  quality: number;
  requestedLongEdges: readonly number[];
  collections: Record<string, Record<"desktop" | "mobile", MapVariant>>;
};

async function localPublicFile(publicRoot: string, src: string) {
  if (!src.startsWith("/") || src.startsWith("//") || /[?#\\]/.test(src)) {
    throw new Error("Map sources must be local public paths without queries or fragments.");
  }
  const root = await realpath(publicRoot);
  const path = await realpath(resolve(root, `.${src}`));
  const fromRoot = relative(root, path);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error("Map source is outside the public directory.");
  }
  return path;
}

export async function prepareMaps({
  root = projectRoot,
  suppliedDir,
  items,
}: {
  root?: string;
  suppliedDir?: string;
  items?: Pick<Collection, "slug" | "mapPoster" | "mapPosterDesktop" | "mapPosterMobile">[];
} = {}): Promise<MapDerivativeManifest> {
  const publicRoot = join(root, "public");
  const outputDir = join(publicRoot, "map-posters/optimized");
  const manifest: MapDerivativeManifest = {
    version: 1,
    format: "webp",
    quality: QUALITY,
    requestedLongEdges: MAP_LONG_EDGES,
    collections: {},
  };
  const cache = new Map<string, Candidate[]>();
  const inputCollections = items ?? (await import("../src/data/collections")).collections;

  for (const collection of inputCollections) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection.slug)) {
      throw new Error("Collection slugs must contain lowercase letters, numbers and hyphens.");
    }
    const variants = {} as Record<"desktop" | "mobile", MapVariant>;
    for (const viewport of ["desktop", "mobile"] as const) {
      const y = collection.slug === "santa-cruz" ? 38 : 50;
      const variant: MapVariant = {
        status: "blocked",
        mapOnlyMasterStatus: "blocked",
        note: "No local map source mapped. No artwork fabricated or fetched.",
        objectPosition: `50% ${y}%`,
        focalPoint: { x: 50, y },
        focalPointBasis: collection.slug === "maine"
          ? "center-default-needs-integration-review" : "existing-workflow",
        source: null,
        fallback: null,
        candidates: [],
      };
      variants[viewport] = variant;
      const poster = (viewport === "desktop"
        ? collection.mapPosterDesktop : collection.mapPosterMobile) ?? collection.mapPoster;
      let inputPath: string;
      let sourcePath: string;
      let kind: MapSource["kind"];
      if (poster) {
        inputPath = await localPublicFile(publicRoot, poster.src);
        sourcePath = `public${poster.src}`;
        kind = "incumbent-public";
      } else if (collection.slug === "maine" && suppliedDir) {
        inputPath = join(suppliedDir, suppliedMaine[viewport]);
        sourcePath = suppliedMaine[viewport];
        kind = "supplied-local";
      } else {
        continue;
      }

      // Read-only masters; missing explicitly selected sources fail before manifest publication.
      const source = await readFile(inputPath);
      const metadata = await sharp(source).metadata();
      const dimensions = metadata.autoOrient ?? metadata;
      if (!dimensions.width || !dimensions.height || (metadata.pages ?? 1) > 1) {
        throw new Error("Map source must be a single image with valid dimensions.");
      }
      const sha256 = createHash("sha256").update(source).digest("hex");
      const artwork = reviewedArtwork[sha256] ?? "unreviewed";
      variant.source = {
        kind, path: sourcePath, width: dimensions.width, height: dimensions.height,
        bytes: source.length, sha256, artwork,
      };
      variant.status = artwork === "unreviewed" ? "needs-artwork-review" : "transitional";
      variant.mapOnlyMasterStatus = artwork === "unreviewed" ? "unreviewed" : "blocked";
      variant.note = artwork === "annotated-atlas"
        ? "Supplied atlas map; place labels, coordinates and journey footer retained. Label-free master not found."
        : artwork === "labeled-poster"
          ? "Incumbent poster; baked title, coordinates and attribution retained. Map-only master not found."
          : "Unreviewed source. Do not claim this is a map-only master until artwork is inspected.";

      let candidates = cache.get(sha256);
      if (!candidates) {
        candidates = [];
        await mkdir(outputDir, { recursive: true });
        for (const size of derivativeSizes(dimensions.width, dimensions.height)) {
          const { data, info } = await sharp(source).rotate()
            .resize({ width: size.requestedLongEdge, height: size.requestedLongEdge,
              fit: "inside", withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 5 }).toBuffer({ resolveWithObject: true });
          if (info.width > dimensions.width || info.height > dimensions.height) {
            throw new Error("Map derivative unexpectedly upscaled its source.");
          }
          if (candidates.some((candidate) => candidate.width === info.width)) continue;
          const outputHash = createHash("sha256").update(data).digest("hex").slice(0, 16);
          const name = `${collection.slug}-${viewport}-${info.width}x${info.height}-${outputHash}.webp`;
          const outputPath = join(outputDir, name);
          try {
            await writeFile(outputPath, data, { flag: "wx" });
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
            if (!(await readFile(outputPath)).equals(data)) {
              throw new Error("Existing derivative does not match generated bytes; refusing to overwrite.");
            }
          }
          candidates.push({ src: `/map-posters/optimized/${name}`, width: info.width,
            height: info.height, bytes: info.size, requestedLongEdge: size.requestedLongEdge });
        }
        cache.set(sha256, candidates);
      }
      variant.candidates = candidates;
      variant.fallback = candidates.find((candidate) => candidate.requestedLongEdge >= 1920)
        ?? candidates[candidates.length - 1];
    }
    manifest.collections[collection.slug] = variants;
  }
  return manifest;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 0 && (args.length !== 2 || args[0] !== "--supplied-dir")) {
    throw new Error("Usage: tsx scripts/prepare-maps.ts [--supplied-dir /local/posters]");
  }
  const manifest = await prepareMaps({ suppliedDir: args[1] });
  writeJsonAtomic(join(projectRoot, "src/data/map-derivatives.json"), manifest);
  for (const [slug, variants] of Object.entries(manifest.collections)) {
    for (const [viewport, variant] of Object.entries(variants)) {
      console.log(`${slug}/${viewport}: ${variant.status}; source=${variant.source?.bytes ?? 0} bytes; `
        + `derivatives=${variant.candidates.map((c) => `${c.width}x${c.height}:${c.bytes}`).join(", ") || "none"}`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error("Map preparation failed; check local source paths, permissions and CLI arguments. No sources were modified.");
    process.exitCode = 1;
  });
}
