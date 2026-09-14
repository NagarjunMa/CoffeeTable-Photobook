# CoffeeTable Photobook

Nagarjun Mallesh's travel and wildlife photography portfolio, designed to feel
like a coffee-table book. Each place becomes its own volume: a horizontal index
of city maps opens into a vertical gallery of uncropped photographs, with white
frames on a textured black background and an immersive, blurred lightbox.

This repository contains the Next.js website and its local publishing tools.
Google Drive is the private source library; Cloudflare Images delivers responsive
photographs through expiring signed URLs. Updating the portfolio is a manual
local action, with no scheduled polling.

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4.
- GSAP and Lenis for transitions and scrolling.
- Google Drive API, Sharp, and Cloudflare Images for the image pipeline.
- Zod for validation; Node.js built-ins for URL signing and upload transport.

Exact dependency versions are recorded in `package.json` and `package-lock.json`.

## Frontend Refinement

The typography-only opening now leads directly to compact destination contents.
City maps are single accessible links, with horizontal browsing, history-aware
destination anchors, and a normal-flow alternative for reduced motion and short
screens. Collections retain their dark exhibition wall, equal-height desktop
rows, uniform mats, and uncropped photographs. The native modal lightbox traps
focus, restores the opener, and retains the current photo while the next decodes.
Failed images offer Retry; the optional introduction cannot block a page without
JavaScript or functioning session storage.

Editorial copy, covers and spreads live in version-controlled
`src/data/editorial.json`, not the sync-owned generated manifest. Read the
[editorial guide](docs/EDITORIAL.md) before approving drafts. The local draft
preview is opt-in:

```sh
NEXT_PUBLIC_EDITORIAL_PREVIEW=true npm run dev -- --port 3002
```

Restart the server when changing this flag. For production builds it is a
build-time setting; unset it and rebuild to return to approved-only content.
It is not authentication or a secret. Do not deploy draft-enabled builds.

[Refinement status](docs/REFINEMENT_STATUS.md) records verification and remaining
artwork, editorial approval, device-testing and dependency-security gates.

## Run Locally

Use Node.js 22 or later and npm.

1. Install dependencies with `npm ci`.
2. Create `.env.local` using `.env.example` as a template. Keep an existing
   configured `.env.local` when updating this checkout.
3. Configure the Cloudflare Images account hash, signing key, and URL TTL to view
   the collections already included in the generated manifest.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

To sync your source library, also configure Google Drive OAuth, the root folder
ID, the Cloudflare account ID, and an Images API token. See
[Google Drive setup](GOOGLE_DRIVE_INTEGRATION.md) and
[Cloudflare setup and rollback](CLOUDFLARE_IMAGES.md).

## Update The Photographs

Organize the private Drive library by place:

```text
Photography/
  New York/
    001.jpg
    002.jpg
  Santa Cruz/
    001.jpg
  Washington/
    001.jpg
```

Each top-level folder becomes a collection. Images are ordered by filename;
optional `meta.json` files customize the title, notes, and cover selection.
Map posters are handled separately from gallery photographs.

After changing the Drive library, run:

```sh
npm run sync:cloudflare
```

The sync prepares high-quality, uncropped web masters, removes private metadata,
adds copyright attribution, and uploads private images to Cloudflare. Unchanged
uploads are reused. A failed photograph upload preserves the current collection
manifest, and interrupted uploads can be recovered on a later run.

The browser selects a suitable image size, with variants from 960 to 4096 pixels
on the long edge. Signed URLs are generated on request by Next.js, keeping keys
out of client code and avoiding expired URLs in static pages.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run sync:cloudflare` | Sync Drive collections to private Cloudflare Images. |
| `npm run test:images` | Run image-delivery and publisher tests without cloud uploads. |
| `npm run test:editorial` | Validate stable-ID editorial merging, review states and stale references. |
| `npm run test:maps` | Validate responsive map encoding, source preservation and atomic manifest publication. |
| `npm run test:gallery` | Check empty/single-image rendering, selected covers and explicit spread order. |
| `npm run test:browser:build` | Build the isolated `.next-test` production test application. |
| `npm run test:browser` | Run Playwright interaction, responsive and axe accessibility checks. |
| `npm run maps:prepare -- --supplied-dir /path/to/posters` | Generate local map derivatives; see the map guide for required Maine filenames. |
| `npm run verify:images` | Check live signed delivery and rejection of invalid signatures. |
| `npm run images:retire-local` | Verify delivery, then move old public photos into a local backup. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Validate and build the production application locally. |
| `npm start` | Serve an existing production build. |

## Repository Guide

- `src/app/`: pages and the server-side image-signing endpoint.
- `src/components/`: hero, city index, framed galleries, and lightbox.
- `src/data/generated/collections.json`: generated collection manifest.
- `src/data/editorial.json`: authored descriptions, captions, cover and spread overrides.
- `src/data/map-derivatives.json`: generated responsive map manifest and artwork status.
- `scripts/`: Drive sync, Cloudflare publishing, verification, and migration tools.
- `public/map-posters/`: city-map artwork.
- `tests/`: publisher, editorial, map and browser regressions.
- [Implementation plan](PORTFOLIO_IMPLEMENTATION_PLAN.md): design direction and history.
- [Map assets](docs/MAP_ASSETS.md): required replacement masters and measured derivative sizes.

## Browser Validation

Install test browsers once, then run an isolated production test build:

```sh
npx playwright install chromium firefox webkit
NEXT_PUBLIC_EDITORIAL_PREVIEW=true npm run test:browser:build
npm run test:browser
```

The suite owns port 3100 and refuses an existing server there. It does not touch
the normal `.next` development output. To use installed Google Chrome instead of
Playwright Chromium, run `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`.
Browser requests to photograph endpoints are replaced with deterministic local
fixtures: private retired copies when available, neutral fixtures otherwise.
No live Drive/Cloudflare access, synchronization, upload or deletion is needed.
This validates behavior and geometry, not live delivery quality or ownership
protection. Reports and screenshots go to ignored `playwright-report/` and
`test-results/`; run `npx playwright show-report` to inspect the report.

## Privacy And Deployment

Original photographs remain private in Drive. Gallery photographs are no longer
served from `public/photography`; retired copies are backed up under `.cache/`.
Signed delivery limits URL reuse and unsigned access, but displayed pixels can
still be saved or captured. Rate limiting and bot controls remain launch tasks.

Environment files, OAuth tokens, and private backups are excluded from Git.
Removing public derivatives does not remove copies from older Git history.

Development currently stays local. Vercel deployment is not configured. The
existing `npm run publish` command includes a production deployment step, so use
the separate sync and build commands for local review. A future host must support
the Next.js Node.js route handler; a purely static export cannot sign image URLs.
