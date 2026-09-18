import assert from "node:assert/strict";
import test from "node:test";
import { mergeSyncedCollections, parseSyncOptions, selectSyncFolders } from "../scripts/lib/sync-scope";
import type { Collection } from "../src/data/types";

const book = (id: string, slug = id): Collection => ({
  sourceFolderId: id, slug, title: slug, location: slug, note: "Notes",
  images: [], coverImages: [],
});

test("sync options reject missing, repeated and unknown arguments", () => {
  assert.deepEqual(parseSyncOptions([]), { cloudflare: false, folderId: undefined });
  assert.deepEqual(parseSyncOptions(["--cloudflare", "--folder-id", "drive-id"]),
    { cloudflare: true, folderId: "drive-id" });
  for (const args of [["--folder-id"], ["--folder-id", "--cloudflare"],
    ["--folder-id", "a", "--folder-id", "b"], ["--all"], ["--cloudflare", "--cloudflare"]]) {
    assert.throws(() => parseSyncOptions(args));
  }
});

test("folder selection fails closed and leaves unrelated folders out", () => {
  const folders = [{ id: "hampi" }, { id: "empty" }, { id: "maine" }];
  assert.deepEqual(selectSyncFolders(folders, "hampi"), [folders[0]]);
  assert.equal(selectSyncFolders(folders), folders);
  assert.throws(() => selectSyncFolders(folders, "outside-root"));
  assert.throws(() => selectSyncFolders([folders[0], folders[0]], "hampi"));
});

test("adding and resyncing one book preserves unrelated content and sequence", () => {
  const previous = [book("maine"), book("ny")];
  const hampi = book("hampi");
  const added = mergeSyncedCollections(previous, [hampi], "hampi");
  assert.deepEqual(added, [...previous, hampi]);
  assert.equal(added[0], previous[0]);
  assert.equal(previous.length, 2);
  const updated = { ...hampi, title: "Hampi updated" };
  assert.deepEqual(mergeSyncedCollections(added, [updated], "hampi"), [...previous, updated]);
  assert.deepEqual(mergeSyncedCollections(previous, [hampi]), [hampi]);
});

test("scoped manifests reject wrong folders, duplicate IDs and conflicting routes", () => {
  assert.throws(() => mergeSyncedCollections([], [], "hampi"));
  assert.throws(() => mergeSyncedCollections([], [book("ny")], "hampi"));
  assert.throws(() => mergeSyncedCollections([book("ny", "hampi")], [book("hampi")], "hampi"));
  assert.throws(() => mergeSyncedCollections([book("hampi"), book("hampi")], [book("hampi")], "hampi"));
});
