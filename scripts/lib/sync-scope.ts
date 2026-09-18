import type { Collection } from "../../src/data/types";

export function parseSyncOptions(args: string[]) {
  let cloudflare = false;
  let folderId: string | undefined;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--cloudflare" && !cloudflare) cloudflare = true;
    else if (arg === "--folder-id" && folderId === undefined) {
      const value = args[++index];
      if (!value || value.startsWith("--") || !/^[\w-]+$/.test(value)) {
        throw new Error("--folder-id requires a Google Drive folder ID.");
      }
      folderId = value;
    } else {
      throw new Error("Usage: sync-drive.ts [--cloudflare] [--folder-id DRIVE_FOLDER_ID]");
    }
  }
  return { cloudflare, folderId };
}

export function selectSyncFolders<T extends { id: string }>(folders: T[], folderId?: string): T[] {
  if (!folderId) return folders;
  const selected = folders.filter((folder) => folder.id === folderId);
  if (selected.length !== 1) {
    throw new Error("Selected folder was not found uniquely inside the configured Photography root. Nothing was synced.");
  }
  return selected;
}

/** A scoped sync replaces only its matching folder, preserving all other books and their order. */
export function mergeSyncedCollections(previous: Collection[], synced: Collection[], folderId?: string) {
  if (!folderId) return synced;
  if (synced.length !== 1 || synced[0].sourceFolderId !== folderId) {
    throw new Error("Scoped sync must contain exactly the selected folder.");
  }
  const updated = synced[0];
  if (previous.some((book) => book.sourceFolderId !== folderId && book.slug === updated.slug)) {
    throw new Error("The selected folder's URL conflicts with another collection. Rename the Drive folder before syncing.");
  }
  if (previous.filter((book) => book.sourceFolderId === folderId).length > 1) {
    throw new Error("Duplicate source folder IDs in the existing manifest.");
  }
  return previous.some((book) => book.sourceFolderId === folderId)
    ? previous.map((book) => book.sourceFolderId === folderId ? updated : book)
    : [...previous, updated];
}
