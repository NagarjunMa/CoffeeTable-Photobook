# Bhutan collection

October 18, 2026. The collection was added through the existing Drive,
Cloudflare Images, editorial, and responsive-map workflows. Its personal story
uses the established collection experience layout.

## Contract and implementation

- The Bhutan folder directly under the configured Photography root adds one
  `/series/bhutan` book and one destination in the index. A scoped sync must
  preserve the seven existing collections byte-for-byte.
- All 21 photographs in that folder remain in the gallery. The reviewed
  cliffside-monastery frame `135702.JPEG` is the opening cover. Its visible
  content has an approved description; the other 20 descriptions await
  full-resolution review without hiding their photographs.
- The photographer-supplied desktop and mobile Bhutan maps are used at their
  matching breakpoints. They include place labels and a small baked map credit,
  so the derivative manifest classifies them as annotated, transitional maps,
  rather than label-free artwork.
- The photographer's first-visit account now appears as a personal story before
  the gallery. Its shorter introduction also appears on the collection opening
  and destination index. No visit date was supplied, so none is invented.
- "Pukhara" in the supplied account is interpreted as Punakha, the Bhutanese
  destination. Unverified claims about a motorcycle ban, the king's security,
  and an exact mobile-data price are not presented as facts.

The Drive folder ID is stored in `src/data/generated/collections.json` and the
selected stable photograph ID in `src/data/editorial.json`. Local map sources
live in `public/map-posters/`; `src/data/collections.ts` maps them to the book,
and `src/data/map-derivatives.json` selects the generated WebP variants.

## Evaluation

The desktop and mobile index panels load their matching Bhutan maps, and the
collection opens with the selected cover and all 21 photographs. The focused
browser checks passed in Chrome, Firefox, and WebKit; gallery, editorial, map,
and sync tests passed, as did lint and both production build modes. Signed
delivery verification passed across all 102 photographs and five image sizes.
The scoped sync left the seven existing collection records unchanged.
