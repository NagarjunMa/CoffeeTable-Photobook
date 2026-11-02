# Ranganathittu photograph import

## Contract and design

The photographer requested the newly uploaded Drive photographs in the existing
Ranganathittu book. Reuse the scoped importer rather than editing its generated
manifest or introducing a second image pipeline. Compact documentation: this is
a bounded content update with no application or integration code changes.

- Source: Drive folder `178EBXiTz-Qjls1p99Ax8HliYeJTRpBwT`, currently 49 image
  files after the photographer's refresh (60 at the initial import).
- Target: `/series/ranganathittu` and its existing bookshelf volume.
- Preserve all other collection objects, their order, and existing editorial edits.
  Add blocked description-review records for the new photos, following the
  existing Hampi/Bhutan convention; these records do not hide photographs.
- Retain every source file, including repeated filenames, using its unique Drive
  ID. Do not delete or reorganize the photographer's originals.
- Use existing private Cloudflare Images uploads, metadata stripping, natural
  filename order, responsive variants, and cover selection. No invented captions,
  species identifications, visit dates, or personal account.
- Failed imports must leave the previous manifest intact. The importer caches
  successful private uploads so a retry does not upload them again.

Baseline: `960d76e`, with a pre-existing edit to `src/data/editorial.json` and
untracked marketing/review artifacts. Those changes are outside this task.
Local snapshots are `.cache/ranganathittu-before-sync.json` and
`.cache/ranganathittu-editorial-before-sync.json`.

## Execution and verification

```sh
npm run sync:cloudflare -- --folder-id 178EBXiTz-Qjls1p99Ax8HliYeJTRpBwT
```

Acceptance: all 60 source IDs appear once, both covers belong to the gallery,
every photograph has positive dimensions and private Cloudflare delivery, other
books and pre-existing editorial content are unchanged, and the book no longer displays its
preparation state. Verify signed delivery, gallery rendering, and a production
build before handoff.

## Initial import results

- Import completed: eight collections, 162 image files overall; Ranganathittu
  contains 60 unique Drive IDs. One transient upload failure was recovered by
  rerunning the same scoped command, reusing the other 59 uploads.
- All source IDs, positive dimensions, cover membership, and 60 rendered gallery
  frames passed the assert-based check in `.cache/check-ranganathittu.ts`.
  Other seven generated collection objects and order are unchanged. Existing
  editorial fields compare equal to the pre-import snapshot; only the 60 new
  blocked image-description records were added.
- All 60 signed mobile deliveries succeeded. All five variants of the opening
  photograph succeeded with signatures and rejected unsigned requests. Evidence:
  `.cache/ranganathittu-verification.json`.
- `npm run test:sync`: 4 passed. `npm run test:editorial`: 15 passed.
  `npm run test:gallery`: 6 passed. `npm run build`: passed, including TypeScript.
  `npm run lint` and `git diff --check` also passed.
- Local production preview at `http://127.0.0.1:3101/series/ranganathittu`:
  61 of 61 rendered images loaded (cover plus gallery), 60 gallery frames, and
  Thinking Orbs dismissed after loading. Opening and first gallery spread were
  visually inspected. Mobile and the complete cross-browser suite were not run.
- Three filenames occur twice in Drive: `74656.JPEG`, `79620.JPEG`, and
  `88598.JPEG`. They have distinct source IDs and were intentionally retained;
  the opening gallery pair visibly repeats the first photograph. Source cleanup
  or deliberate photographic selection is outside this import.

Changed: generated collection data, the Ranganathittu editorial review queue,
editorial inventory assertions/documentation, and the current product context.
Application components, imports, image-signing rules, and dependencies are unchanged.
Review confirmed the existing importer and presentation already own this behavior;
no parallel implementation was introduced.

Status: verified locally within the checks above. No Git push or production
deployment was performed. Reverting the generated manifest and this import's
editorial entries restores the previous preparation state; leave private
Cloudflare objects and Drive originals intact.

## Photographer's story

The photographer subsequently supplied his Ranganathittu memories. The approved
editorial entry now includes a brief collection introduction and the ten-paragraph
personal account, "Learning to be still", in the existing section before Gallery.
The bookshelf automatically uses its first paragraph as the journal excerpt.
The account preserves the childhood fear, mother and elder sister in the boat,
first camera in twelfth grade, later 200–600mm lens, parents' encouragement,
two-hour ride, painted stork feeding its young, crocodiles sunbathing, and the
patience learnt while tracking birds. Childhood crocodile stories and the final
opinion are framed as recollection and personal belief respectively.

This is a copy-only update to the existing editorial fields. No component,
generated photograph data, image-review status, or other collection was changed.
The 15 editorial and six gallery tests passed. A rendered-markup check confirmed
the story follows the opening and precedes all 60 gallery frames, while a
baseline comparison confirmed pre-existing editorial content is preserved.
The production build also passed. The local browser preview showed the complete
story in the existing two-column layout with all ten paragraphs present. These
story changes remain local; no commit, push, or deployment was performed.

## November 2 refresh

The photographer updated Drive and requested the current gallery. The same
scoped sync now returns 49 images, all reused from private Cloudflare delivery.
Eleven source IDs are no longer in the Drive folder and were removed from the
gallery and its blocked description-review records. No Drive files or Cloudflare
objects were deleted by this operation. Both generated covers now have different
filenames; the repeated opening pair from the original import is gone.

Acceptance: exact membership matches the 49 current Drive IDs, all other seven
collection objects and order remain unchanged, and the approved ten-paragraph
story remains byte-equivalent as parsed editorial data. Before-refresh snapshots
are `.cache/ranganathittu-before-refresh.json` and
`.cache/ranganathittu-editorial-before-refresh.json`.

The local production HTML already contained "Learning to be still" before the
refresh. A direct read of the published Vercel Ranganathittu page returned HTTP
200 with the collection name but without that story. The published deployment
has not received these local edits; the story was not lost during synchronization.

Rendered-markup checks passed: all 49 source IDs/frames, the complete story,
and opening → story → gallery order. The existing editorial inventory assertions
and current product/review counts were updated to 151 total images, including
109 blocked image-description records. No gallery or story component changed.

Verification: production build passed; four sync, 15 editorial, and six gallery
tests passed; `git diff --check` passed. After rebuilding and restarting the
local preview, the browser showed the complete ten-paragraph story, 49 gallery
frames, all 50 rendered images loaded (cover plus gallery), and no loading overlay.
The story was visually inspected at its direct anchor. The local preview is
refreshed; no push or production deployment was performed.
