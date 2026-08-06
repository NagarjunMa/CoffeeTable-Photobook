import { createServer } from "node:http";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import sharp from "sharp";
import slugify from "slugify";
import { z } from "zod";
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

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    const value = rawValue
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\n/g, "\n");

    process.env[key] = value;
  }
}

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
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

async function waitForOAuthCode(port: number) {
  return new Promise<string>((resolveCode, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

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
    return auth;
  }

  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  console.log("Opening Google Drive authorization in your browser...");
  console.log(authUrl);

  const codePromise = waitForOAuthCode(env.GOOGLE_DRIVE_OAUTH_PORT);
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
  loadEnvFile(join(projectRoot, ".env"));
  loadEnvFile(join(projectRoot, ".env.local"));

  const env = envSchema.parse(process.env);
  const auth = await getAuthClient(env);

  mkdirSync(generatedDir, { recursive: true });

  if (!auth) {
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

  rmSync(publicPhotoDir, { recursive: true, force: true });
  mkdirSync(publicPhotoDir, { recursive: true });

  const collections: Collection[] = [];

  for (const folder of cityFolders) {
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
        optimizedImages.push(
          await writeOptimizedImage(drive, folderSlug, imageFile, index),
        );
      } catch (error) {
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

  writeJson(collectionsOutputPath, collections);
  writeJson(syncOutputPath, {
    status: "synced",
    rootFolderId: rootFolder.id,
    rootFolderName: rootFolder.name,
    collectionCount: collections.length,
    imageCount: collections.reduce(
      (total, collection) => total + collection.images.length,
      0,
    ),
    updatedAt: new Date().toISOString(),
  });

  console.log(
    `Drive sync complete: ${collections.length} collections, ${collections.reduce(
      (total, collection) => total + collection.images.length,
      0,
    )} images.`,
  );
}

syncDrive().catch((error) => {
  console.error(error);
  process.exit(1);
});
