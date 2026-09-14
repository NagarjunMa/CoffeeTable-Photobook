# Map Assets: Phase 5 Inventory and Derivatives

## Status and Scope

This is derivative tooling and an asset inventory, not completion of the map
redesign. No source artwork was cropped, retouched, regenerated, uploaded, or
removed. No network requests were made during map preparation. The application now
consumes this manifest through one responsive `picture` per destination.

**Label-free map-only masters remain blocked for every collection.** Maine has
real, separately composed desktop/mobile atlas maps, not a fabricated substitute.
They retain cartographic annotations and a small journey footer. The other cities
retain large baked poster title blocks. Derivatives preserve these labels as
transitional artwork; conversion does not make a poster a map-only master.

## Local Inventory

Inspected `public/map-posters/` and the supplied directory
`/Users/nagarjunmallesh/Desktop/testing/maptoposter/posters/`. A bounded directory
search of Documents, Downloads, and Desktop found that map-to-poster workspace;
its local raster/vector export inventory contained no separate label-free masters
for these four collections. No claim is made about remote or unsearched sources.

| Collection / source | Dimensions | Original bytes | Status |
| --- | --- | ---: | --- |
| New York: `public/map-posters/new-york-city.png` | 3630 x 4830 | 7,467,853 | One portrait poster shared by desktop/mobile; baked city, country, coordinates, attribution. No separate landscape master found. |
| Santa Cruz: `public/map-posters/santa-cruz.png` | 3630 x 4830 | 3,469,601 | One portrait sunset poster shared by desktop/mobile; baked title/coordinates/attribution. No separate landscape master found. |
| Washington desktop: `public/map-posters/washington-dc-desktop.png` | 6030 x 3405 | 9,151,641 | Separate landscape poster; baked title/coordinates/attribution. |
| Washington mobile: `public/map-posters/washington-dc-mobile.png` | 3405 x 6030 | 8,905,762 | Separate portrait poster; baked title/coordinates/attribution. |
| Maine desktop: supplied `maine_visited_places_desktop_6000x3375.png` | 6000 x 3375 | 1,874,375 | Annotated state/coastal-detail atlas; no large poster title block, but baked place labels, coordinates and journey footer. Not mapped by incumbent collections. |
| Maine mobile: supplied `maine_visited_places_mobile_3375x6000.png` | 3375 x 6000 | 2,139,200 | Separate portrait atlas composition; same annotation limitations. Not mapped by incumbent collections. |

Byte-identical supplied copies, verified with SHA-256:

- `new_york_city_contrast_zones_20260726_224047.png` matches incumbent New York.
- `santa_cruz_sunset_20260728_014659.png` matches incumbent Santa Cruz.
- `washington-dc-desktop.png` matches incumbent Washington desktop.
- `washington_dc_contrast_zones_20260803_003120.png` matches incumbent Washington mobile.
- `maine_visited_places_coffee_table_map.png` matches supplied Maine desktop.

Also inspected: supplied `santa_cruz_contrast_zones_20260728_013531.png`
(3630 x 4830, 3,011,171 bytes). It is a grayscale poster with the same kind of
baked title block, not a clean master. It is not selected, preserving incumbent
art direction. Unrelated city exports and the Ranganathittu maps are not substitutes.
The supplied `create_maine_visited_map.py` explicitly draws place labels and the
journey footer; it was read but never executed or modified.

## Generation

From the repository root, using already installed dependencies:

```sh
./node_modules/.bin/tsx scripts/prepare-maps.ts --supplied-dir /Users/nagarjunmallesh/Desktop/testing/maptoposter/posters
./node_modules/.bin/tsx --test tests/map-derivatives.test.ts
./node_modules/.bin/eslint scripts/prepare-maps.ts tests/map-derivatives.test.ts
```

`--supplied-dir` points directly at the local directory containing the two exact
Maine filenames above. No external path is embedded in the public manifest.
Without this option, generation uses only maps resolved from `collections.ts`
(including generated data and local overrides); absent Maine sources become
explicit `blocked` entries. **Use the full command above to retain supplied Maine
in the regenerated manifest.** The script does not search or fetch remote masters.
Mapped missing files and explicitly supplied missing Maine files fail generation;
the existing manifest is not replaced on those failures.

Encoding uses existing Sharp, WebP quality 95, effort 5, auto-orientation and
`fit: inside` at long edges 960, 1920, 2560, 3840, without enlargement. There is no
crop, compositing, sharpening, label removal or AI step. Small sources produce
deduplicated actual-width candidates, including at most one native-size result.
Original master bytes are never written. Output names include encoded-byte hashes;
reruns reuse identical files and refuse conflicting content. Old derivatives are
not deleted. Manifest publication occurs only after all selected sources succeed,
using the existing `writeJsonAtomic` helper: a same-directory temporary JSON file
is written completely, then renamed over the destination. This imports the helper
only; no Cloudflare publisher is created and no external calls are made. Temporary
disk overhead for publication is one manifest (approximately 16 KB).

## Picture Manifest Contract

`src/data/map-derivatives.json` has a versioned header and `collections[slug]`, with
separate `desktop` and `mobile` entries. Each contains:

- `source`: original dimensions, byte count, SHA-256, logical source path/kind and
  inspected artwork classification. Unknown hashes require new artwork review.
- `status`: `transitional`, `blocked`, or `needs-artwork-review`.
- `mapOnlyMasterStatus`: `blocked` for the inspected label-bearing artwork;
  `unreviewed` for new artwork. No entry claims map-only completion.
- `candidates`: `{ src, width, height, bytes, requestedLongEdge }`. `width` is the
  **encoded pixel width** for the `w` descriptor, never the requested long edge.
- `fallback`: the first candidate requested at 1920 or above, or the largest
  available candidate for small sources; null when blocked with no source.
- `objectPosition`, `focalPoint`: percentages for the consumer, not image edits.

For `<picture>`, create a desktop `<source media="(min-width: 768px)"
type="image/webp">` and mobile `<img>` fallback, with each candidate list formatted
as `src + " " + width + "w"`. Set accurate consumer `sizes`; use the selected
variant's intrinsic dimensions to reserve space. Do not mount two CSS-hidden
`<img>` elements. Null fallback means no source; keep an intentional non-image
fallback and do not request an invented URL. Attribution remains the UI owner's
responsibility, particularly if CSS cover hides the baked credit.

New York and Santa Cruz reuse the same derivative URLs in both viewport entries;
this is deliberate source reuse, not separate desktop master availability.
Washington and Maine have distinct compositions. Existing focal positions are
Santa Cruz `50% 38%`, New York/Washington `50% 50%`. Maine has no incumbent image
workflow: `50% 50%` is explicitly marked a centered default requiring integration
review. Existing Santa Cruz desktop wrapper offsets (left 16%, right -18%,
top/bottom -8%) are layout behavior, not a focal point or baked crop; they are not
applied to derivatives.

## Validation and Integration Gate

Measured local encoded bytes (not browser transfer timings):

| Source | Original | 960 edge | 1920 edge | 2560 edge | 3840 edge | Reduction at 1920 / 3840 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Maine desktop | 1,874,375 | 43,638 | 136,066 | 208,820 | 371,036 | 92.7% / 80.2% |
| Maine mobile | 2,139,200 | 50,686 | 159,100 | 242,688 | 431,052 | 92.6% / 79.8% |
| New York (shared) | 7,467,853 | 248,302 | 798,848 | 1,295,108 | 2,489,898 | 89.3% / 66.7% |
| Santa Cruz (shared) | 3,469,601 | 124,256 | 390,418 | 592,212 | 1,006,344 | 88.7% / 71.0% |
| Washington desktop | 9,151,641 | 254,980 | 829,352 | 1,326,602 | 2,415,074 | 90.9% / 73.6% |
| Washington mobile | 8,905,762 | 248,166 | 817,018 | 1,297,748 | 2,387,774 | 90.8% / 73.2% |

Six distinct masters total **33,008,432 bytes**. One 1920-edge derivative per
master totals **3,130,802 bytes** (90.5% smaller); one 3840-edge derivative per
master totals **9,101,178 bytes** (72.4% smaller). All 24 unique derivative files
together total **18,165,186 bytes** on disk. These totals include both Maine and
Washington compositions and are not a claim that a browser downloads all of them.
No source PNG is deleted, so repository disk usage increases. Source SHA-256
values were rechecked against the manifest after generation: all six unchanged.

Focused tests cover portrait/landscape rounding, small-source deduplication,
invalid dimensions, actual encoded dimensions, immutable source bytes, shared
art reuse, rerun stability, blocked Maine, EXIF orientation, the checked-in manifest,
and rejection of remote/missing sources.
Atomic-publication tests also cover complete replacement, successful temporary-file
cleanup and preservation of the old manifest on JSON serialization failure.
Validation passed: eight focused tests, scoped ESLint, a strict no-emit TypeScript
check, and a normal CLI rerun against the live collection resolver. All 24 unique
derivatives were checked against manifest dimensions and byte counts. Maine
desktop and New York 1920-edge outputs were visually spot-checked locally; their
full compositions and baked labels remain present. An initial CLI attempt was
temporarily blocked by the parent task's incomplete editorial-data import; the
later normal CLI rerun succeeded with unchanged derivative output.
Integration checks now verify desktop/mobile source switching in Chrome, Firefox
and WebKit. Desktop/tablet/mobile screenshots preserve recognizable Washington
map detail, but the inherited title block remains visible on mobile. It is an
explicit replacement-artwork blocker, not a conversion defect hidden by cropping.
Independent frontend source review and the isolated production build passed;
see `REFINEMENT_STATUS.md` for the complete acceptance status.
