# Hampi Import - September 17, 2026

## Scope

Added the HAMPI Drive album as `/series/hampi` and `/#city-hampi` using the
existing private Cloudflare publisher. Scoped synchronization appended the book
without updating other albums or publishing the empty RanganaThittu folder.
No Drive writes, remote deletions, deployment or Git push were performed.

```sh
npm run sync:cloudflare -- --folder-id 1uouK7mzsxuY1Xx9F4_ZjfG_Bv5--HSbX
```

The operation uploaded 12 photographs: 10 landscape and 2 portrait. The manifest
now has 5 books and 64 photographs. The previous 4 collection objects were
deep-compared before/after and are unchanged. Natural filename order and the
existing cover-selection fallback are retained. Hampi's collection introduction
and 2019 visit year were subsequently supplied and approved by the photographer.
All 12 individual image descriptions still await review; approving the collection
story does not approve captions or change the photographic sequence.

The complete supplied Hampi story is in `note` for the collection opening. A
shorter `indexNote` keeps the fixed-height map panel readable on short phones.
Other destinations retain `note` as their fallback; the optional field follows
the same approval gate and survives Drive sync in local editorial metadata.
The full story initially overflowed the map card on short phones; the excerpt
fixed that regression. After the copy update, the production build, lint and
15 editorial tests passed, along with mobile map/copy containment checks in
Chrome, Firefox and WebKit. Live preview confirmed the excerpt on the map card
and the full story in the gallery opening. A broader screenshot-writing run
again hit the machine's disk-space limit and is not claimed as passing.

## Maps

Copied the supplied, visually inspected map-only exports without editing them:

- Desktop: `hampi,_karnataka_contrast_zones_map_only_20260916_225455.png`,
  6000 x 3375.
- Mobile: `hampi,_karnataka_contrast_zones_map_only_20260916_225624.png`,
  3375 x 6000.

The existing Sharp pipeline generated 8 WebP derivatives, quality 95, without
upscaling. Map artwork stays in public local assets, as with the other books;
photographs use private Cloudflare delivery. The application supplies OSM credit.
Maine's existing supplied atlas and all prior map entries were retained.

## Engineering And Verification

Risk tier: critical for the authorized external image upload and manifest update;
no authentication, signing, privacy or image-quality settings changed.

The optional `--folder-id` argument validates root membership, rejects conflicting
routes and preserves unrelated books. Full-library sync remains the default.
Four focused tests cover parsing, missing/ambiguous targets, merge preservation
and route conflicts. An independent read-only review found no material issue in
the scoped implementation. It noted a preexisting Drive-map failure handling gap:
full/scoped sync can warn and drop failed Drive map references. Hampi uses local
map masters, so that separate issue does not affect this import.

Live verification passed for all 64 photographs, plus the five delivery variants
and rejection of unsigned, expired and tampered URLs. The import itself checked
the new Hampi sample's signed and unsigned delivery before manifest publication.

The isolated production build, TypeScript, lint, 4 sync tests, 5 publisher tests,
14 editorial tests, 8 map tests and 3 gallery tests passed.

Nine focused browser cases passed across Chrome, Firefox and WebKit: Hampi map
navigation, all 12 gallery frames, desktop row heights and mats, lightbox focus
restoration, and responsive map selection. The expanded 129-test suite was
attempted but stopped with `ENOSPC` while writing browser artifacts. It is not
reported as passing. No unrelated files were removed to free storage.

Live Cloudflare screenshots were inspected at 390px and 1440px: responsive maps,
collection opening and the first gallery spread. Both pages had 12 frames and no
document horizontal overflow. These checks are not a full-resolution fidelity
comparison or physical-device certification. Screenshots are local, ignored
artifacts under `.cache/hampi-live-*.png`.

Local preview: <http://127.0.0.1:3004/series/hampi>.
Destination panel: <http://127.0.0.1:3004/#city-hampi>.

Rollback: the pre-import generated manifest is in
`.cache/collections-before-sync.json`. Keep newly uploaded Cloudflare objects
private; do not delete them as part of a local rollback. Restoring the prior
manifest alone leaves stale editorial warnings and unused map assets to reconcile.
