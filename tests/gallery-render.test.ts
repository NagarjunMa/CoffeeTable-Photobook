import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CollectionGallery } from "../src/components/collection-gallery";
import { collections } from "../src/data/collections";
import type { Collection, PortfolioImage } from "../src/data/types";

const photo: PortfolioImage = {
  id: "one", fileName: "one.jpg", alt: "A test photograph", src: "/fixture-one.jpg",
  width: 800, height: 1200, orientation: "portrait",
};
const base: Collection = {
  title: "Test book", slug: "test-book", location: "Test place", note: "",
  coverImages: [], images: [],
};
const render = (collection: Collection) => renderToStaticMarkup(createElement(CollectionGallery, { collection }));

test("the synced Tigers album keeps its authored introduction without creating a duplicate", () => {
  const tigers = collections.filter((collection) => collection.slug === "tigers");
  assert.equal(tigers.length, 1);
  assert.equal(tigers[0].images.length, 17);
  assert.equal(tigers[0].location, "Indian Tiger Reserves");
  assert.equal(tigers[0].introArtworkType, "illustration");
  assert.equal(tigers[0].mapPoster?.src, "/intro-art/tigers-line-poster.webp");
});

test("an empty book renders navigation and a clear empty state without image controls", () => {
  const html = render(base);
  assert.match(html, /This volume is being prepared/);
  assert.match(html, /href="\/#city-test-book"/);
  assert.doesNotMatch(html, /data-open-photo|<dialog|<img/);
});

test("a single photograph renders one gallery frame with intrinsic uncropped dimensions", () => {
  const html = render({ ...base, images: [photo], coverImages: [photo] });
  assert.equal((html.match(/class="exhibition-frame flex/g) ?? []).length, 1);
  assert.match(html, /width="800" height="1200"/);
  assert.match(html, /aspect-ratio:800 \/ 1200/);
  assert.match(html, /class="photo-loading" hidden=""/);
  assert.doesNotMatch(html, /<dialog/);
});

test("the selected cover wins over orientation fallback and explicit spread order is rendered", () => {
  const landscape = { ...photo, id: "two", src: "/fixture-two.jpg", alt: "A selected landscape", width: 1200, height: 800, orientation: "landscape" as const };
  const html = render({ ...base, images: [photo, landscape], coverImages: [landscape], spreads: [["two"], ["one"]] });
  const opening = html.slice(0, html.indexOf("</article>"));
  assert.match(opening, /alt="A selected landscape"/);
  const gallery = html.slice(html.indexOf("</article>"));
  assert.ok(gallery.indexOf("A selected landscape") < gallery.indexOf("A test photograph"));
  assert.equal((gallery.match(/class="exhibition-frame flex/g) ?? []).length, 2);
});
