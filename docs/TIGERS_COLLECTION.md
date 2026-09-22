# Tigers collection

## Outcome

Add a first-class `Tigers` volume to the portfolio index, using the approved monochrome tiger illustration as its responsive introduction background and presenting the synced Indian tiger reserve photography.

## Contract

- The main index includes a `Tigers` panel and links it to `/series/tigers`.
- The approved line illustration fills the panel on desktop and mobile with deliberate focal positioning.
- Illustrated covers do not show map-data attribution.
- Synced Drive photographs populate the existing Tigers volume without creating a duplicate introduction.
- The collection route retains an intentional preparation state if a future manifest contains no tiger photographs.
- Existing city map collections and their OpenStreetMap attribution are unchanged.

## Code map

- `src/data/types.ts`: collection introduction-art classification.
- `src/data/collections.ts`: local Tigers collection and illustration source.
- `src/data/generated/collections.json`: synced Cloudflare-backed Tigers photographs.
- `src/components/work-index.tsx`: shared backdrop rendering and attribution behavior.
- `public/intro-art/tigers-line-poster.webp`: optimized approved artwork.
- `tests/browser/portfolio.spec.ts`: responsive artwork, route, and attribution regression.

## Evaluation

- Drive-to-Cloudflare sync completed with 7 collections and 81 photographs, including 17 Tigers photographs after duplicate removal.
- Live delivery verification passed for all 81 private photographs and all five variants; unsigned, expired, and tampered URLs were denied.
- `npm run lint`, `npm run test:gallery`, `npm run test:editorial`, and `npm run test:images` passed.
- `npm run test:browser:build` passed and generated the Tigers route.
- Focused desktop/mobile Tigers coverage passed in Chrome, Firefox, and WebKit.
- Fresh-context release review found no material correctness, data-integrity, privacy, or deployment blocker.
