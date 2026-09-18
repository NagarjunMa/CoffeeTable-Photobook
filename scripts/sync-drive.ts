import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import sharp from "sharp";
import slugify from "slugify";
import { z } from "zod";
import { loadLocalEnv } from "./lib/local-env";
import { createCloudflarePublisher, writeJsonAtomic } from "./lib/cloudflare-images";
import { imagePath } from "../src/lib/image-variants";
import { mergeSyncedCollections, parseSyncOptions, selectSyncFolders } from "./lib/sync-scope";
import type { Collection, PortfolioImage } from "../src/data/types";

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string | null;
  modifiedTime?: string | null;
  imageMediaMetadata?: {
    width?: number | null;
    height?: number | null;
  } | null;
};

type SyncedImage = PortfolioImage & {
  sourceFileName: string;
  sourceModifiedTime?: string | null;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const generatedDir = join(projectRoot, "src", "data", "generated");
const publicPhotoDir = join(projectRoot, "public", "photography");
const collectionsOutputPath = join(generatedDir, "collections.json");
const syncOutputPath = join(projectRoot, ".cache", "drive-sync.json");
const tokenPath = join(projectRoot, ".google-drive-token.json");

const envSchema = z.object({
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().optional(),
  GOOGLE_DRIVE_ROOT_FOLDER_NAME: z.string().default("Photography"),
  GOOGLE_DRIVE_CLIENT_ID: z.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_DRIVE_OAUTH_PORT: z.coerce.number().default(53682),
});

const metaSchema = z
  .object({
    title: z.string().optional(),
    location: z.string().optional(),
    year: z.string().optional(),
    note: z.string().optional(),
    cover: z.array(z.string()).optional(),
    mapPoster: z.string().optional(),
    mapPosterDesktop: z.string().optional(),
    mapPosterMobile: z.string().optional(),
  })
  .passthrough();

const mapPosterNamePattern = /^(map[-_\s]?poster|poster)\.(png|jpe?g|webp|heic|heif)$/i;
const desktopMapPosterNamePattern =
  /^(?:.+[-_\s])?map[-_\s]?desktop\.(png|jpe?g|webp|heic|heif)$/i;
const mobileMapPosterNamePattern =
  /^(?:.+[-_\s])?map[-_\s]?mobile\.(png|jpe?g|webp|heic|heif)$/i;

function escapeDriveQueryValue(value: string) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function toSlug(value: string) {
  return (
    slugify(value, {
      lower: true,
      strict: true,
      trim: true,
    }) || "untitled"
  );
}

function cleanFolderName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function imageAltFromName(fileName: string) {
  return basename(fileName, extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function orientation(width: number, height: number): PortfolioImage["orientation"] {
  if (width === height) {
    return "square";
  }

  return width > height ? "landscape" : "portrait";
}

function writeJson(filePath: string, value: unknown) {
  writeJsonAtomic(filePath, value);
}

function openAuthUrl(url: string) {
  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  spawn(opener, args, {
    detached: true,
    stdio: "ignore",
  }).unref();
}

async function waitForOAuthCode(port: number, state: string) {
  return new Promise<string>((resolveCode, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (url.pathname !== "/oauth2callback" || url.searchParams.get("state") !== state) {
          res.writeHead(400, { "content-type": "text/plain" });
          res.end("Invalid authorization callback.");
          return;
        }

        if (error) {
          res.writeHead(400, { "content-type": "text/plain" });
          res.end(`Google authorization failed: ${error}`);
          reject(new Error(`Google authorization failed: ${error}`));
          server.close();
          return;
        }

        if (!code) {
          res.writeHead(404, { "content-type": "text/plain" });
          res.end("Missing OAuth code.");
          return;
        }

        res.writeHead(200, { "content-type": "text/plain" });
        res.end("Photography portfolio is connected to Google Drive. You can close this tab.");
        resolveCode(code);
        server.close();
      } catch (error) {
        reject(error);
        server.close();
      }
    });
    const timeout = setTimeout(() => {
      reject(new Error("Google authorization timed out. Run npm run sync:drive to retry."));
      server.close();
    }, 300_000);
    server.on("close", () => clearTimeout(timeout));
    server.on("error", (error) => { clearTimeout(timeout); reject(error); });
    server.listen(port, "127.0.0.1");
  });
}

async function getAuthClient(env: z.infer<typeof envSchema>) {
  if (!env.GOOGLE_DRIVE_CLIENT_ID || !env.GOOGLE_DRIVE_CLIENT_SECRET) {
    return null;
  }

  const redirectUri = `http://127.0.0.1:${env.GOOGLE_DRIVE_OAUTH_PORT}/oauth2callback`;
  const auth = new google.auth.OAuth2(
    env.GOOGLE_DRIVE_CLIENT_ID,
    env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirectUri,
  );

  if (existsSync(tokenPath)) {
    auth.setCredentials(JSON.parse(readFileSync(tokenPath, "utf8")));
    try {
      await auth.getAccessToken();
      return auth;
    } catch (error) {
      const reason = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (reason !== "invalid_grant") throw new Error("Could not refresh Google Drive login. Check connectivity and retry.");
      console.log("Google Drive login expired; reconnect in the browser.");
    }
  }

  const state = randomBytes(24).toString("hex");
  const authUrl = auth.generateAuthUrl({
    state,
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  console.log("Opening Google Drive authorization in your browser...");

  const codePromise = waitForOAuthCode(env.GOOGLE_DRIVE_OAUTH_PORT, state);
  openAuthUrl(authUrl);

  const code = await codePromise;
  const tokenResponse = await auth.getToken(code);

  auth.setCredentials(tokenResponse.tokens);
  writeJson(tokenPath, tokenResponse.tokens);

  return auth;
}

async function listAllFiles(
  drive: ReturnType<typeof google.drive>,
  q: string,
  orderBy = "name_natural",
) {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q,
      orderBy,
      pageToken,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, imageMediaMetadata(width, height))",
    });

    files.push(
      ...((response.data.files ?? []).filter((file) => file.id && file.name) as DriveFile[]),
    );
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

async function listCollectionImages(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
): Promise<DriveFile[]> {
  const directItems = await listAllFiles(
    drive,
    [
      `${escapeDriveQueryValue(folderId)} in parents`,
      "trashed = false",
    ].join(" and "),
  );
  const directImages = directItems.filter((item) =>
    item.mimeType?.startsWith("image/"),
  );
  const childFolders = directItems.filter(
    (item) => item.mimeType === "application/vnd.google-apps.folder",
  );
  const nestedImages = (
    await Promise.all(
      childFolders.map((folder) => listCollectionImages(drive, folder.id)),
    )
  ).flat();

  return [...directImages, ...nestedImages];
}

async function findRootFolder(
  drive: ReturnType<typeof google.drive>,
  env: z.infer<typeof envSchema>,
) {
  if (env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    return {
      id: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      name: env.GOOGLE_DRIVE_ROOT_FOLDER_NAME,
    };
  }

  const folders = await listAllFiles(
    drive,
    [
      "mimeType = 'application/vnd.google-apps.folder'",
      `name = ${escapeDriveQueryValue(env.GOOGLE_DRIVE_ROOT_FOLDER_NAME)}`,
      "trashed = false",
    ].join(" and "),
    "modifiedTime desc",
  );

  return folders[0] ?? null;
}

async function downloadFileBuffer(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
) {
  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "arraybuffer",
    },
  );

  return Buffer.from(response.data as ArrayBuffer);
}

async function readCollectionMeta(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
) {
  const metaFiles = await listAllFiles(
    drive,
    [
      `${escapeDriveQueryValue(folderId)} in parents`,
      "name = 'meta.json'",
      "trashed = false",
    ].join(" and "),
  );

  if (!metaFiles[0]) {
    return {};
  }

  const buffer = await downloadFileBuffer(drive, metaFiles[0].id);

  try {
    return metaSchema.parse(JSON.parse(buffer.toString("utf8")));
  } catch (error) {
    console.warn(`Skipping invalid meta.json in folder ${folderId}.`, error);
    return {};
  }
}

async function writeOptimizedImage(
  drive: ReturnType<typeof google.drive>,
  folderSlug: string,
  file: DriveFile,
  index: number,
): Promise<SyncedImage> {
  const sourceBuffer = await downloadFileBuffer(drive, file.id);
  const baseSlug = toSlug(basename(file.name, extname(file.name)));
  const fileName = `${String(index + 1).padStart(2, "0")}-${baseSlug}-${file.id.slice(0, 8)}.webp`;
  const outputDir = join(publicPhotoDir, folderSlug);
  const outputPath = join(outputDir, fileName);

  mkdirSync(outputDir, { recursive: true });

  await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: 3840,
      height: 3840,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 94,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  const width = metadata.width ?? file.imageMediaMetadata?.width ?? 1;
  const height = metadata.height ?? file.imageMediaMetadata?.height ?? 1;

  return {
    id: file.id,
    fileName,
    alt: imageAltFromName(file.name) || folderSlug,
    src: `/photography/${folderSlug}/${fileName}`,
    width,
    height,
    orientation: orientation(width, height),
    sourceFileName: file.name,
    sourceModifiedTime: file.modifiedTime,
  };
}

async function writeOptimizedMapPoster(
  drive: ReturnType<typeof google.drive>,
  folderSlug: string,
  file: DriveFile,
  variant: "poster" | "map-desktop" | "map-mobile" = "poster",
) {
  const sourceBuffer = await downloadFileBuffer(drive, file.id);
  const outputDir = join(publicPhotoDir, folderSlug);
  const fileName = `${variant}-${file.id.slice(0, 8)}.webp`;
  const outputPath = join(outputDir, fileName);

  mkdirSync(outputDir, { recursive: true });

  await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: variant === "map-mobile" ? 2160 : 3840,
      height: variant === "map-desktop" ? 2160 : 3840,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 88,
      effort: 5,
    })
    .toFile(outputPath);

  return {
    src: `/photography/${folderSlug}/${fileName}`,
    alt: `${folderSlug.replace(/-/g, " ")} map poster`,
  };
}

async function syncDrive() {
  const options = parseSyncOptions(process.argv.slice(2));
  loadLocalEnv(projectRoot);

  const previous: Collection[] = existsSync(collectionsOutputPath)
    ? JSON.parse(readFileSync(collectionsOutputPath, "utf8")) : [];
  const cloudflare = process.env.CLOUDFLARE_ACCOUNT_ID || options.cloudflare
    ? await createCloudflarePublisher(projectRoot) : null;

  const env = envSchema.parse(process.env);
  const auth = await getAuthClient(env);

  mkdirSync(generatedDir, { recursive: true });

  if (!auth) {
    if (cloudflare) throw new Error("Google Drive OAuth credentials are required for Cloudflare publishing.");
    writeJson(syncOutputPath, {
      status: "skipped",
      reason:
        "Google Drive OAuth credentials are not configured. Add GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET to .env.local.",
      updatedAt: new Date().toISOString(),
    });
    console.log("Drive sync skipped: OAuth credentials are not configured yet.");
    return;
  }

  const drive = google.drive({ version: "v3", auth });
  const rootFolder = await findRootFolder(drive, env);

  if (!rootFolder?.id) {
    throw new Error(
      `Could not find Google Drive folder "${env.GOOGLE_DRIVE_ROOT_FOLDER_NAME}". Set GOOGLE_DRIVE_ROOT_FOLDER_ID in .env.local if the folder name is not unique.`,
    );
  }

  const cityFolders = await listAllFiles(
    drive,
    [
      `${escapeDriveQueryValue(rootFolder.id)} in parents`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ].join(" and "),
  );

  mkdirSync(publicPhotoDir, { recursive: true });

  const collections: Collection[] = [];
  const failures: string[] = [];

  const selectedFolders = selectSyncFolders(cityFolders, options.folderId);
  if (options.folderId && previous.some((book) =>
    book.sourceFolderId !== options.folderId && book.slug === toSlug(cleanFolderName(selectedFolders[0].name)))) {
    throw new Error("The selected folder's URL conflicts with another collection. Rename the Drive folder before syncing.");
  }

  for (const folder of selectedFolders) {
    const folderTitle = cleanFolderName(folder.name);
    const folderSlug = toSlug(folderTitle);
    const images = await listCollectionImages(drive, folder.id);

    const meta = await readCollectionMeta(drive, folder.id);
    const mapPosterFile =
      images.find((image) => meta.mapPoster && image.name === meta.mapPoster) ??
      images.find((image) => mapPosterNamePattern.test(image.name));
    const mapPosterDesktopFile =
      images.find(
        (image) =>
          meta.mapPosterDesktop && image.name === meta.mapPosterDesktop,
      ) ?? images.find((image) => desktopMapPosterNamePattern.test(image.name));
    const mapPosterMobileFile =
      images.find(
        (image) => meta.mapPosterMobile && image.name === meta.mapPosterMobile,
      ) ?? images.find((image) => mobileMapPosterNamePattern.test(image.name));
    const posterFileIds = new Set(
      [mapPosterFile, mapPosterDesktopFile, mapPosterMobileFile]
        .filter(Boolean)
        .map((image) => image?.id),
    );
    const galleryImages = images.filter((image) => !posterFileIds.has(image.id));
    const sortedImages = galleryImages.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const optimizedImages: SyncedImage[] = [];
    let mapPoster: Collection["mapPoster"];
    let mapPosterDesktop: Collection["mapPosterDesktop"];
    let mapPosterMobile: Collection["mapPosterMobile"];

    console.log(`Syncing ${folderTitle} (${sortedImages.length} images)...`);

    if (mapPosterFile) {
      try {
        mapPoster = await writeOptimizedMapPoster(drive, folderSlug, mapPosterFile);
      } catch (error) {
        console.warn(
          `Skipping ${folderTitle}/${mapPosterFile.name} as map poster: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (mapPosterDesktopFile) {
      try {
        mapPosterDesktop = await writeOptimizedMapPoster(
          drive,
          folderSlug,
          mapPosterDesktopFile,
          "map-desktop",
        );
      } catch (error) {
        console.warn(
          `Skipping ${folderTitle}/${mapPosterDesktopFile.name} as desktop map: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (mapPosterMobileFile) {
      try {
        mapPosterMobile = await writeOptimizedMapPoster(
          drive,
          folderSlug,
          mapPosterMobileFile,
          "map-mobile",
        );
      } catch (error) {
        console.warn(
          `Skipping ${folderTitle}/${mapPosterMobileFile.name} as mobile map: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    for (const [index, imageFile] of sortedImages.entries()) {
      try {
        if (cloudflare) {
          const remote = await cloudflare.upload(imageFile, () => downloadFileBuffer(drive, imageFile.id));
          optimizedImages.push({
            id: imageFile.id, fileName: imageFile.name,
            alt: imageAltFromName(imageFile.name) || folderTitle,
            src: imagePath(remote.imageId, "gallery"), cloudflareImageId: remote.imageId,
            width: remote.width, height: remote.height,
            orientation: orientation(remote.width, remote.height),
            sourceFileName: imageFile.name, sourceModifiedTime: imageFile.modifiedTime,
          });
        } else {
          optimizedImages.push(await writeOptimizedImage(drive, folderSlug, imageFile, index));
        }
        console.log(`  ${index + 1}/${sortedImages.length}: ${imageFile.name}`);
      } catch (error) {
        if (cloudflare && error instanceof TypeError && error.message === "fetch failed") {
          const cause = error.cause as { code?: string } | undefined;
          throw new Error(`Cloudflare connection failed (${cause?.code ?? "network error"}). The gallery is unchanged; rerun sync to resume.`);
        }
        failures.push(`${folderTitle}/${imageFile.name}`);
        console.warn(
          `Skipping ${folderTitle}/${imageFile.name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const publicImages = optimizedImages.map(
      ({ sourceFileName, sourceModifiedTime, ...image }) => image,
    );
    const coverByName = (meta.cover ?? [])
      .map((coverFileName) =>
        publicImages.find((image) => {
          const sourceImage = optimizedImages.find(
            (optimizedImage) => optimizedImage.id === image.id,
          );
          return sourceImage?.sourceFileName === coverFileName;
        }),
      )
      .filter(Boolean);
    const coverImages = [
      coverByName[0] ?? publicImages[0],
      coverByName[1] ?? publicImages[1],
    ].filter(Boolean) as PortfolioImage[];

    collections.push({
      title: meta.title ?? folderTitle,
      slug: folderSlug,
      location: meta.location ?? folderTitle,
      year: meta.year ?? "Field Notes",
      note:
        meta.note ??
        `A field study from ${folderTitle}, gathered as a quiet sequence of images and memory.`,
      mapPoster,
      mapPosterDesktop,
      mapPosterMobile,
      sourceFolderId: folder.id,
      coverImages,
      images: publicImages,
    });
  }

  if (failures.length) {
    writeJson(syncOutputPath, { status: "failed", failures, updatedAt: new Date().toISOString() });
    throw new Error(`${failures.length} photographs failed. The existing collection manifest was preserved. Fix these files and rerun sync; successful Cloudflare uploads will be reused.`);
  }
  if (cloudflare) {
    for (const collection of collections) {
      const first = collection.images[0];
      if (first?.cloudflareImageId) await cloudflare.verify(first.cloudflareImageId);
    }
  }
  const publishedCollections = mergeSyncedCollections(previous, collections, options.folderId);
  if (existsSync(collectionsOutputPath)) {
    writeJson(join(projectRoot, ".cache", "collections-before-sync.json"), previous);
    const migrationBackup = join(projectRoot, ".cache", "collections-before-cloudflare.json");
    if (cloudflare && !existsSync(migrationBackup) && previous.some(c => c.images.some(p => !p.cloudflareImageId))) {
      writeJson(migrationBackup, previous);
    }
  }
  writeJson(collectionsOutputPath, publishedCollections);
  writeJson(syncOutputPath, {
    status: "synced",
    delivery: cloudflare ? "cloudflare" : "local",
    cloudflare: cloudflare?.stats(),
    scope: options.folderId ?? "all",
    rootFolderId: rootFolder.id,
    rootFolderName: rootFolder.name,
    collectionCount: publishedCollections.length,
    imageCount: publishedCollections.reduce(
      (total, collection) => total + collection.images.length,
      0,
    ),
    updatedAt: new Date().toISOString(),
  });

  console.log(
    `Drive sync complete: ${publishedCollections.length} collections, ${publishedCollections.reduce(
      (total, collection) => total + collection.images.length,
      0,
    )} images.`,
  );
}

const lockPath = join(projectRoot, ".cache", "drive-sync.lock");
mkdirSync(dirname(lockPath), { recursive: true });
try {
  closeSync(openSync(lockPath, "wx", 0o600));
} catch {
  console.error("Another sync may be running. If a previous process crashed, remove .cache/drive-sync.lock before retrying.");
  process.exit(1);
}
process.on("exit", () => rmSync(lockPath, { force: true }));
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

syncDrive().catch((error) => {
  console.error(error instanceof Error ? error.message : "Drive sync failed.");
  process.exit(1);
});
