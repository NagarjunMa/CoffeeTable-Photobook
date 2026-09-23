# Editorial Workflow

## Ownership And Approval

Edit `src/data/editorial.json`. Do not hand-edit
`src/data/generated/collections.json`: the publisher owns that file. The local
resolver validates and applies editorial overrides after generated data and map
source defaults are loaded. Legacy Drive `meta.json` remains supported.

Collection keys are `sourceFolderId` values; photograph keys are `images[].id`,
both from the generated manifest. These are Drive IDs, not filenames, slugs or
Cloudflare delivery IDs. Renaming a file preserves its edits when the ID stays
the same. Re-uploading as a new Drive file gives it a new identity.

The New York, Washington and Maine introductions now use the photographer's
September 15 memories and are enabled as approved collection copy at his request.
Santa Cruz uses his September 16 July-sunset story as approved copy. Hampi uses
his supplied monochrome-photography story and early-2019 visit year. Its full
story is in `note`; its concise map-card excerpt is in `indexNote`. Image review
states are separate. There are 41 visually grounded image description/caption
drafts and 23 blocked records (nine Maine, two New York, twelve newly imported
Hampi photographs awaiting descriptions). Blocked records keep the generated
photo visible; they do not remove photographs or invent descriptions.

By default only `approved` overrides apply. Collection copy/cover/spread approval
and individual image approval are independent. Set
`NEXT_PUBLIC_EDITORIAL_PREVIEW=true` at local dev/build time to include drafts.
Blocked records never apply, even in preview. Review descriptions against the
actual full-resolution photograph and approve each deliberately. Do not bulk
approve based solely on a passing test.

## Example

The IDs and copy below illustrate the schema, not real approved content. Replace
the placeholder IDs with exact existing IDs and author verified copy.

```json
{
  "version": 1,
  "collections": {
    "DRIVE_FOLDER_ID": {
      "reviewStatus": "draft",
      "note": "A factual introduction grounded in these photographs.",
      "category": "City",
      "year": null,
      "coverIds": ["IMAGE_A"],
      "spreads": [["IMAGE_A"], ["IMAGE_B", "IMAGE_C"]],
      "mapPresentation": {
        "desktop": { "focalPosition": "60% 40%", "scrim": 0.92 },
        "mobile": { "focalPosition": "50% 45%", "scrim": 0.94 }
      },
      "images": {
        "IMAGE_A": {
          "reviewStatus": "draft",
          "alt": "Describe the visible subject, setting and relevant composition.",
          "caption": "A short factual caption"
        },
        "IMAGE_B": {
          "reviewStatus": "blocked",
          "reason": "Photographer must verify the pictured subject."
        }
      }
    }
  }
}
```

## Rules

- `note` is the full collection introduction. Optional `indexNote` is a short
  map-card excerpt; when absent, the card uses `note`. Both require collection
  approval. Keep excerpts concise enough for short mobile screens.
- Omitted fields keep generated values. `null` clears optional year, category or
  caption; unknown dates should stay unknown, not be replaced with Field Notes.
- `coverIds[0]` is the opening preview. Invalid stale covers warn and cannot
  erase every usable generated cover. Tigers uses the photographer-selected
  Drive image `front-page` (ID `1wjpYvZEcuq3QDoE6pALOfrbFPixjkacr`, imported as
  `90557.JPEG`) as its approved opening cover. The gallery order is unchanged;
  the stable ID preserves the selection across Drive renames and future syncs.
- `spreads` is an ordered list of single, paired or portrait/square-trio groups.
  Triples containing a landscape fail validation. Duplicate assignments fail,
  including in drafts. Nothing is cropped to force a spread shape.
- Stale IDs warn with their folder/image identity and are excluded from resolved
  overrides. The JSON is not rewritten. Unassigned current images append as
  single spreads in their existing order. Without explicit spreads, filename
  order and automatic row grouping remain unchanged.
- Image descriptions should describe what is visible. Do not infer dates,
  species, venues, camera settings, emotions or travel experiences without evidence.
- `focalPosition` is horizontal then vertical percent (0-100). `scrim` is 0-1.
  These settings affect presentation only; they do not supply or alter map files.
- Use `npm run test:editorial` after editing. Invalid metadata fails validation
  rather than silently publishing a partially curated sequence.

## Photographer Review Queue

1. Review the 41 image drafts. All four city introductions now use supplied personal stories.
2. Supply or inspect the 11 blocked photographs and replace each blocked record
   with a verified draft before approving it. Maine's introduction now reflects
   the supplied early-fall weekend in Acadia and Bar Harbor.
3. Choose cover IDs and deliberate spread groups for each book. Automatic layout
   remains the fallback until those selections are made.
4. Approve actual dates/categories and the revised About story. The father and
   Badami origin remain; no commercial offerings or new contact details were added.
5. Rebuild without the draft flag and confirm the approved-only result before any
   separately authorized publication.
