# Map Assets: Phase 5 Inventory and Derivatives

## Status and Scope

The application consumes the checked-in manifest through one responsive `picture`
per destination. New York, Santa Cruz and Washington now use separately composed,
verified map-only desktop and mobile masters generated with `--map-only`. They have
no baked title, coordinates, gradient, divider or attribution; the application
renders the required OpenStreetMap attribution. Maine remains a transitional,
annotated atlas with place labels, coordinates and a small journey footer.

## Local Inventory

Inspected `public/map-posters/` and the supplied directory
`/Users/nagarjunmallesh/Desktop/testing/maptoposter/posters/`. The initial local
inventory contained no separate clean masters for New York, Santa Cruz or
Washington. The paired replacements below were subsequently generated in that
map-to-poster workspace with the repository's `contrast_zones` theme.

| Collection / source | Dimensions | Original bytes | Status |
| --- | --- | ---: | --- |
| New York desktop: `public/map-posters/new-york-desktop.png` | 6000 x 3375 | 9,958,137 | Verified map-only landscape master. |
| New York mobile: `public/map-posters/new-york-mobile.png` | 3375 x 6000 | 9,564,068 | Verified map-only portrait master. |
| Santa Cruz desktop: `public/map-posters/santa-cruz-desktop.png` | 6000 x 3375 | 3,795,549 | Verified map-only landscape master. |
| Santa Cruz mobile: `public/map-posters/santa-cruz-mobile.png` | 3375 x 6000 | 4,423,155 | Verified map-only portrait master. |
| Washington desktop: `public/map-posters/washington-dc-desktop.png` | 6000 x 3375 | 9,766,881 | Verified map-only landscape master. |
| Washington mobile: `public/map-posters/washington-dc-mobile.png` | 3375 x 6000 | 9,479,481 | Verified map-only portrait master. |
| Maine desktop: supplied `maine_visited_places_desktop_6000x3375.png` | 6000 x 3375 | 1,874,375 | Annotated state/coastal-detail atlas; no large poster title block, but baked place labels, coordinates and journey footer. Not mapped by incumbent collections. |
| Maine mobile: supplied `maine_visited_places_mobile_3375x6000.png` | 3375 x 6000 | 2,139,200 | Separate portrait atlas composition; same annotation limitations. Not mapped by incumbent collections. |

Legacy comparison files retained for rollback were verified with SHA-256:

- `new_york_city_contrast_zones_20260726_224047.png` matches incumbent New York.
- `santa_cruz_sunset_20260728_014659.png` matches incumbent Santa Cruz.
- `washington-dc-desktop.png` matches incumbent Washington desktop.
- `washington_dc_contrast_zones_20260803_003120.png` matches incumbent Washington mobile.
- `maine_visited_places_coffee_table_map.png` matches supplied Maine desktop.

Also inspected: supplied `santa_cruz_contrast_zones_20260728_013531.png`
(3630 x 4830, 3,011,171 bytes). It is a grayscale poster with the same kind of
baked title block, not a clean master, and is no longer selected. Unrelated city
exports and the Ranganathittu maps are not substitutes.
The supplied `create_maine_visited_map.py` explicitly draws place labels and the
journey footer. The generic `create_map_poster.py` now supports `--map-only` for
clean city-map exports.

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
- `status`: `ready`, `transitional`, `blocked`, or `needs-artwork-review`.
- `mapOnlyMasterStatus`: `verified` for inspected clean masters, `blocked` for
  label-bearing artwork, or `unreviewed` for unknown artwork.
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
responsibility because verified map-only masters contain no baked credit.

New York, Santa Cruz, Washington and Maine now have distinct desktop/mobile
compositions. Existing focal positions are
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
| New York desktop | 9,958,137 | 257,802 | 842,638 | 1,328,924 | 2,526,402 | 91.5% / 74.6% |
| New York mobile | 9,564,068 | 237,842 | 788,312 | 1,241,560 | 2,390,596 | 91.8% / 75.0% |
| Santa Cruz desktop | 3,795,549 | 138,274 | 398,088 | 593,044 | 1,008,028 | 89.5% / 73.4% |
| Santa Cruz mobile | 4,423,155 | 159,300 | 468,606 | 707,492 | 1,220,494 | 89.4% / 72.4% |
| Washington desktop | 9,766,881 | 289,992 | 956,528 | 1,493,030 | 2,804,412 | 90.2% / 71.3% |
| Washington mobile | 9,479,481 | 280,964 | 937,850 | 1,471,020 | 2,750,426 | 90.1% / 71.0% |

Eight distinct current masters total **51,000,846 bytes**. All 32 referenced
responsive derivatives total **26,934,710 bytes** on disk. These figures include
both orientations for every destination and are not a claim that a browser
downloads all of them.
No source PNG is deleted, so repository disk usage increases. Source SHA-256
values were rechecked against the manifest after generation: all eight matched.

Focused tests cover portrait/landscape rounding, small-source deduplication,
invalid dimensions, actual encoded dimensions, immutable source bytes, shared
art reuse, rerun stability, blocked Maine, EXIF orientation, the checked-in manifest,
and rejection of remote/missing sources.
Atomic-publication tests also cover complete replacement, successful temporary-file
cleanup and preservation of the old manifest on JSON serialization failure.
Validation passed: eight focused tests, scoped ESLint, a strict no-emit TypeScript
check, and a normal CLI rerun against the live collection resolver. All 32 current
derivatives were checked against manifest dimensions and byte counts. The six new
city masters were visually reviewed together at desktop and mobile aspect ratios;
no title or coordinate overlays remain. A focused Chrome integration test verifies
desktop/mobile source switching for New York, Santa Cruz and Washington. The
isolated production build passed. Maine's retained annotations remain the only
replacement-artwork limitation.
