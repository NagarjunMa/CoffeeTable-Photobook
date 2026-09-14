import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { Collection } from "../src/data/types";

const root = process.cwd();
const collections: Collection[] = JSON.parse(readFileSync(join(root, "src/data/generated/collections.json"), "utf8"));
const photos = collections.flatMap(collection => collection.images);
if (!photos.length || photos.some(photo => !photo.cloudflareImageId)) {
  throw new Error("Local photographs can only be retired after every gallery image uses Cloudflare.");
}
const publicRoot = join(root, "public");
const photoRoot = join(publicRoot, "photography");
const maps = new Set(collections.flatMap(collection =>
  [collection.mapPoster, collection.mapPosterDesktop, collection.mapPosterMobile].flatMap(map => map ? [map.src] : [])));
const backup = join(root, ".cache", "retired-public-photographs", new Date().toISOString().replace(/:/g, "-"));
let moved = 0;
function walk(directory: string) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) { walk(path); continue; }
    if (!item.isFile() || maps.has(`/${relative(publicRoot, path)}`)) continue;
    const target = join(backup, relative(photoRoot, path));
    mkdirSync(dirname(target), { recursive: true });
    renameSync(path, target);
    moved++;
  }
}
if (existsSync(photoRoot)) walk(photoRoot);
console.log(`Moved ${moved} public files to a private local backup under .cache/retired-public-photographs. Active map posters were preserved.`);
