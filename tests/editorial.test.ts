import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import generated from "../src/data/generated/collections.json";
import local from "../src/data/editorial.json";
import type { Collection, PortfolioImage } from "../src/data/types";
import { applyEditorialOverrides, editorialSchema } from "../src/lib/editorial";

function photo(id: string, orientation: PortfolioImage["orientation"] = "portrait"): PortfolioImage {
  return { id, orientation, alt: `Generated ${id}`, fileName: `${id}.jpg`,
    src: `/${id}.jpg`, width: 800, height: 1000 };
}

function collection(): Collection {
  const images = [photo("a"), photo("b", "square"), photo("c"), photo("d", "landscape"), photo("e")];
  return { title: "Generated", slug: "original-slug", location: "Original location",
    note: "Generated note", year: "Field Notes", sourceFolderId: "folder", images,
    coverImages: [images[0], images[1]] };
}

const document = (entry: Record<string, unknown>) => ({
  version: 1, collections: { folder: { reviewStatus: "approved", ...entry } },
});

test("approved local metadata and covers override generated values using stable IDs", () => {
  const source = collection();
  const before = structuredClone(source);
  const [result] = applyEditorialOverrides([source], document({
    title: "Local title", location: "Local location", note: "Local note", category: "City",
    year: "2024", coverIds: ["d", "c"],
    images: { d: { reviewStatus: "approved", alt: "A factual description", caption: "A caption" } },
  }));
  assert.equal(result.title, "Local title");
  assert.equal(result.location, "Local location");
  assert.equal(result.note, "Local note");
  assert.equal(result.category, "City");
  assert.equal(result.year, "2024");
  assert.equal(result.slug, "original-slug");
  assert.deepEqual(result.coverImages.map((p) => p.id), ["d", "c"]);
  assert.equal(result.coverImages[0].alt, "A factual description");
  assert.equal(result.images[3].caption, "A caption");
  assert.deepEqual(source, before);
});

test("drafts do not publish, blocked records never apply, and image approval is independent", () => {
  const input = document({ reviewStatus: "draft", title: "Unapproved title", coverIds: ["d"],
    images: {
      a: { reviewStatus: "draft", alt: "Unapproved alt" },
      b: { reviewStatus: "approved", alt: "Reviewed square" },
      c: { reviewStatus: "blocked", reason: "No local source" },
    } });
  const [published] = applyEditorialOverrides([collection()], input);
  assert.equal(published.title, "Generated");
  assert.equal(published.coverImages[0].id, "a");
  assert.equal(published.images[0].alt, "Generated a");
  assert.equal(published.coverImages[1].alt, "Reviewed square");
  const [preview] = applyEditorialOverrides([collection()], input, { includeDrafts: true });
  assert.equal(preview.title, "Unapproved title");
  assert.equal(preview.images[0].alt, "Unapproved alt");
  assert.equal(preview.images[2].alt, "Generated c");
});

test("single, pair, and portrait/square trio spreads retain all unassigned images in source order", () => {
  const [trio] = applyEditorialOverrides([collection()], document({ spreads: [["c", "a", "b"]] }));
  assert.deepEqual(trio.spreads, [["c", "a", "b"], ["d"], ["e"]]);
  assert.deepEqual(trio.images.map((p) => p.id), ["a", "b", "c", "d", "e"]);
  const [pair] = applyEditorialOverrides([collection()], document({ spreads: [["d", "a"], ["c"]] }));
  assert.deepEqual(pair.spreads, [["d", "a"], ["c"], ["b"], ["e"]]);
  const [empty] = applyEditorialOverrides([collection()], document({ spreads: [] }));
  assert.deepEqual(empty.spreads, [["a"], ["b"], ["c"], ["d"], ["e"]]);
});

test("duplicate references and invalid spread shapes are rejected, including drafts", () => {
  for (const entry of [
    { coverIds: ["a", "a"] }, { coverIds: ["stale", "stale"] },
    { spreads: [["a", "b"], ["a"]] }, { spreads: [["a", "a"]] },
    { spreads: [[]] }, { spreads: [["a", "b", "c", "d"]] },
    { spreads: [["a", "b", "d"]] },
    { reviewStatus: "draft", spreads: [["a", "b", "d"]] },
  ]) assert.throws(() => applyEditorialOverrides([collection()], document(entry)));
});

test("stale folder and image IDs warn once per ID and are excluded", () => {
  const warnings: string[] = [];
  const input = document({ coverIds: ["gone", "d"], spreads: [["gone"], ["a", "gone2", "b"]],
    images: { gone: { reviewStatus: "approved", alt: "Obsolete" } } });
  Object.assign(input.collections, { "old-folder": { reviewStatus: "approved", title: "Obsolete" } });
  const [result] = applyEditorialOverrides([collection()], input, { warn: (message) => warnings.push(message) });
  assert.equal(warnings.length, 3);
  assert.ok(warnings.some((warning) => warning.includes("old-folder")));
  assert.deepEqual(result.coverImages.map((p) => p.id), ["d"]);
  assert.deepEqual(result.spreads, [["a", "b"], ["c"], ["d"], ["e"]]);
  const [fallback] = applyEditorialOverrides([collection()], document({ coverIds: ["gone"] }), { warn: () => {} });
  assert.deepEqual(fallback.coverImages.map((p) => p.id), ["a", "b"]);
});

test("null clears optional metadata; omitted fields and collections without folder IDs are preserved", () => {
  const original = collection();
  original.category = "Old category";
  original.images[0].caption = "Old caption";
  const [result] = applyEditorialOverrides([original], document({ year: null, category: null,
    images: { a: { reviewStatus: "approved", caption: null } } }));
  assert.equal(result.year, undefined);
  assert.equal(result.category, undefined);
  assert.equal(result.images[0].caption, undefined);
  assert.equal(result.note, original.note);
  const sample = { ...collection(), sourceFolderId: undefined };
  assert.deepEqual(applyEditorialOverrides([sample], { version: 1, collections: {} }), [sample]);
});

test("schema rejects invalid types, blank text, unknown fields, and blocked content", () => {
  for (const entry of [
    { title: " " }, { year: 2024 }, { reviewStatus: "published" }, { slug: "changed" },
    { coverIds: [] }, { spreads: "a" },
    { images: { a: { reviewStatus: "approved", alt: " " } } },
    { images: { a: { reviewStatus: "blocked", reason: "Unavailable", alt: "Invented" } } },
  ]) assert.equal(editorialSchema.safeParse(document(entry)).success, false);
  assert.equal(editorialSchema.safeParse({ version: 2, collections: {} }).success, false);
});

test("ambiguous generated folder and image identities are rejected", () => {
  assert.throws(() => applyEditorialOverrides([collection(), collection()], document({})), /Duplicate source folder/);
  const duplicate = collection();
  duplicate.images.push(duplicate.images[0]);
  assert.throws(() => applyEditorialOverrides([duplicate], document({})), /Duplicate image/);
});

test("stable IDs are exact and whitespace cannot collapse distinct override keys", () => {
  for (const entry of [
    { coverIds: [" a"] },
    { spreads: [["a "]] },
    { images: { a: { reviewStatus: "draft" }, " a": { reviewStatus: "draft" } } },
  ]) assert.equal(editorialSchema.safeParse(document(entry)).success, false);
  assert.equal(editorialSchema.safeParse({ version: 1,
    collections: { folder: { reviewStatus: "draft" }, " folder": { reviewStatus: "draft" } },
  }).success, false);
});

test("checked-in editorial accounts for all 88 images without fabricating approvals", () => {
  const parsed = editorialSchema.parse(local);
  let drafts = 0;
  let blocked = 0;
  for (const source of generated) {
    const entry = parsed.collections[source.sourceFolderId];
    assert.ok(entry);
    assert.equal(entry.reviewStatus, "approved");
    assert.deepEqual(Object.keys(entry.images ?? {}).sort(), source.images.map((p) => p.id).sort());
    for (const image of Object.values(entry.images ?? {})) {
      if (image.reviewStatus === "draft") { drafts++; assert.ok(image.alt); }
      else { blocked++; assert.equal(image.reviewStatus, "blocked"); }
    }
  }
  assert.equal(drafts, 41);
  assert.equal(blocked, 47);
  const warnings: string[] = [];
  const resolved = applyEditorialOverrides(generated as Collection[], local,
    { warn: (message) => warnings.push(message) });
  for (const source of generated) {
    const result = resolved.find((item) => item.sourceFolderId === source.sourceFolderId)!;
    const entry = parsed.collections[source.sourceFolderId];
    assert.equal(result.note,
      entry.reviewStatus === "approved" && entry.note !== undefined ? entry.note : source.note);
    // Publishing the photographer's city stories must not approve image drafts.
    assert.deepEqual(result.images, source.images);
    assert.deepEqual(result.coverImages, source.coverImages);
  }
  assert.deepEqual(warnings, []);
});

test("Hampi publishes its approved full story and concise index introduction without approving photographs", () => {
  const source = generated.find((item) => item.slug === "hampi")!;
  const [result] = applyEditorialOverrides([source as Collection], local, { warn: () => {} });
  assert.equal(result.title, "Hampi");
  assert.equal(result.year, "2019");
  assert.match(result.note, /forgotten grandeur of the Vijayanagara Empire/);
  assert.match(result.note, /timeless, silent, and unforgettable/);
  assert.ok(result.indexNote && result.indexNote.length < result.note.length);
  assert.deepEqual(result.images, source.images);
  const draft = structuredClone(local);
  draft.collections[source.sourceFolderId as keyof typeof draft.collections].reviewStatus = "draft";
  const [unapproved] = applyEditorialOverrides([source as Collection], draft, { warn: () => {} });
  assert.equal(unapproved.indexNote, undefined);
  assert.equal(unapproved.note, source.note);
});

test("map presentation merges per device without replacing sources or leaking between variants", () => {
  const source = collection();
  source.mapPoster = { src: "/base.png", alt: "Base map", focalPosition: "50% 50%", scrim: 0.2 };
  source.mapPosterDesktop = { src: "/desktop.png", alt: "Desktop map",
    sources: [{ src: "/desktop-small.webp", width: 640 }], scrim: 0.3 };
  source.mapPresentation = { desktop: { scrim: 0.4 }, mobile: { focalPosition: "30% 60%" } };
  const before = structuredClone(source);
  const [result] = applyEditorialOverrides([source], document({ mapPresentation: {
    desktop: { focalPosition: "62.5% 40%" }, mobile: { scrim: 0 },
  } }));
  assert.deepEqual(result.mapPosterDesktop, { ...source.mapPosterDesktop, focalPosition: "62.5% 40%", scrim: 0.4 });
  assert.deepEqual(result.mapPosterMobile, { ...source.mapPoster, focalPosition: "30% 60%", scrim: 0 });
  assert.deepEqual(result.mapPoster, source.mapPoster);
  assert.deepEqual(result.mapPresentation, {
    desktop: { focalPosition: "62.5% 40%", scrim: 0.4 }, mobile: { focalPosition: "30% 60%", scrim: 0 },
  });
  assert.deepEqual(source, before);
});

test("map presentation survives without map assets and honors draft gating", () => {
  const input = document({ reviewStatus: "draft", mapPresentation: { desktop: { focalPosition: "0% 100%", scrim: 1 } } });
  const [published] = applyEditorialOverrides([collection()], input);
  assert.equal(published.mapPresentation, undefined);
  const [preview] = applyEditorialOverrides([collection()], input, { includeDrafts: true });
  assert.deepEqual(preview.mapPresentation, { desktop: { focalPosition: "0% 100%", scrim: 1 } });
  assert.equal(preview.mapPoster, undefined);
  assert.equal(preview.mapPosterDesktop, undefined);
  assert.equal(preview.mapPosterMobile, undefined);
});

test("map presentation rejects unknown fields, unsupported positions, and out-of-range scrims", () => {
  for (const mapPresentation of [
    { tablet: { scrim: 0.5 } }, { desktop: { src: "/invented.png" } },
    { desktop: { focalPosition: "center" } }, { desktop: { focalPosition: "101% 50%" } },
    { desktop: { focalPosition: "-1% 50%" } }, { desktop: { focalPosition: "50% 50%; color:red" } },
    { mobile: { scrim: -0.1 } }, { mobile: { scrim: 1.1 } },
    { mobile: { scrim: "0.5" } }, { mobile: { scrim: Infinity } },
  ]) assert.equal(editorialSchema.safeParse(document({ mapPresentation })).success, false);
});

test("collections preview flag opts into drafts only for the exact value true", () => {
  for (const flag of [undefined, "false", "TRUE", "true"]) {
    const env = { ...process.env };
    if (flag === undefined) delete env.NEXT_PUBLIC_EDITORIAL_PREVIEW;
    else env.NEXT_PUBLIC_EDITORIAL_PREVIEW = flag;
    const output = execFileSync(process.execPath, ["--import", "tsx", "-e",
      "const {collections}=require('./src/data/collections.ts'); console.log(JSON.stringify(collections.find(c=>c.slug==='santa-cruz').images[0].alt))"],
    { cwd: process.cwd(), env, encoding: "utf8" });
    const original = generated.find((entry) => entry.slug === "santa-cruz")!;
    const draft = editorialSchema.parse(local).collections[original.sourceFolderId].images![original.images[0].id];
    assert.notEqual(draft.reviewStatus, "blocked");
    assert.equal(JSON.parse(output), flag === "true" && draft.reviewStatus !== "blocked" ? draft.alt : original.images[0].alt);
  }
});
