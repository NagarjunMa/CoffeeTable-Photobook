# Responsive Layout Refinement - September 16, 2026

## Change Contract

Implement the read-only audit's layout and image-loading corrections without
redesigning the portfolio. Engineering-loop mode: implement and review.
Risk: **significant**, because shared responsive CSS, destination navigation and
the photograph component affect all collections and the lightbox.

Preserve typography-only hero, map-only destination panels, desktop horizontal
browsing, vertical galleries, equal-height desktop rows, uniform white mats,
uncropped photographs, native dialog behavior and existing signed delivery.
No publishing, deployment, Drive synchronization, image deletion, new dependency,
schema change, editorial approval or photographic-quality change is included.
Pre-existing copy, maps, generated manifests and tests were preserved.

## Audit Resolution

| Finding | Status | Resolution / evidence |
| --- | --- | --- |
| Mobile contents clipped maps and attribution | Verified in browser tests | CSS grid reserves the contents row's actual height. No negative margin. Controls do not wrap independently. All four panels tested at 320, 390 and 609px, at both 640 and 844px height. |
| Preview collapsed during loading | Verified in browser tests | Explicit responsive stage width and intrinsic ratio reserve space. Delayed requests verify less than 2px change in position and dimensions after load. |
| Mobile alignment / undersized desktop preview | Verified in browser tests and visual review | Mobile text, preview and caption share a left edge. Desktop preview uses a larger column; portrait height remains bounded and all aspect ratios stay intact. |
| Tablet opening contained excessive upper whitespace | Verified in browser tests and visual review | Content-driven rows below 1280px; Index has an explicit row, without full-screen stretching. Tablet heading begins above 300px in the Santa Cruz regression. |
| Mobile copy obscured map in a paper rectangle | Implemented and visually reviewed | Bottom-aligned copy with a continuous paper scrim replaces the rectangular panel. Existing focal positions and responsive artwork stay unchanged. Washington fixture and live Maine compositions reviewed. Final art direction remains photographer-owned. |
| Excess gallery transition / footer whitespace | Implemented and visually reviewed | Fixed breakpoint spacing replaces accumulated viewport-sized margins; footer no longer requires half a screen. Between-frame spacing and mats remain unchanged. |
| Filename-style image descriptions | Deferred: photographer approval | Existing 41 drafts and 11 blocked image descriptions are not falsely approved. No narrative, sequencing or image descriptions were changed in this pass. |

## Engineering Review

- Reviewed actual changes in `globals.css`, `collection-gallery.tsx`,
  `portfolio-photo.tsx` and `work-index.tsx`, plus affected lightbox and image
  source callers. Review was self-review, not an independent security audit.
- Layout remains CSS-owned; no resize observer or second scroll controller was
  introduced. GSAP pinning, scoped cleanup and native mobile snapping remain.
  Normal-flow navigation now measures the contents height instead of assuming it.
- The public `PortfolioPhoto` interface is unchanged. Its keyed internal request
  component resets loading/retry state when the photograph or delivery mode
  changes. It adds no DOM wrapper and does not alter URL generation or variants.
- Cached early load/error events, failed-request Retry, delayed responses, modal
  focus and stale lightbox selections remain covered. The initial server render
  hides the loading overlay, so disabling JavaScript cannot hide loaded images.
- No new persistence, transactions, migration, authorization or external-I/O
  responsibility: those review dimensions are N/A for this diff. Existing signing
  and publisher contract tests were rerun without calling production services.
- Performance evidence is confined to geometry assertions and observed rendering.
  No FPS, transfer-size improvement, CDN-quality or Core Web Vitals score is claimed.
  The placeholder is bounded to one element per rendered photograph.
- No material introduced defect remains identified in the reviewed scope. Existing
  dependency/security and physical-device launch gates in `REFINEMENT_STATUS.md`
  remain outside this frontend pass.

## Validation Evidence

Passed:

- `npm run test:browser:build`: isolated Next.js production build, eight pages.
- `npx tsc --noEmit` and `npm run lint`.
- `npm run test:images`: 5 mocked delivery/publisher tests.
- `npm run test:editorial`: 14 tests.
- `npm run test:maps`: 8 tests.
- `npm run test:gallery`: 3 tests, including server-rendered hidden loading state.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- --trace off --reporter=list`:
  **123 passed**, 41 each in Chrome, Firefox and WebKit, final run 2.6 minutes.
- `git diff --check`.

The three new baseline cases first failed on the prior build: overlapping
contents/panel geometry, zero-width pending previews and a tablet heading at
520px. They passed after implementation. The first expanded run had 122 passes
and one WebKit test timeout: `document.fonts.ready` stalled while the test held
image requests. Explicitly loading font faces removed that dependency without
relaxing geometry assertions; the focused retry and full final run passed.

Screenshots were captured for all four collection openings at 320, 390, 768,
1024, 1440 and 1920px. Inspected Santa Cruz mobile/tablet/wide desktop,
Washington mobile, Maine tablet, mobile Washington map and mixed New York mats.
Also viewed live Cloudflare Santa Cruz at the original 609px width and the live
Maine mobile map. Fixture photographs are not an original-versus-CDN fidelity
comparison; unavailable local images use neutral fixtures. Screenshots live in
ignored `test-results/` and are review artifacts, not approved golden baselines.

Not run: physical iOS/Android, actual 200% browser zoom, screen-reader testing,
hardware animation profiling or exhaustive full-resolution image inspection.
Those remain explicit follow-ups, not implied by desktop WebKit or axe success.

## Compatibility And Local Review

Routes, hash anchors, image props, editorial schema and signing APIs are unchanged.
No migration or version bump is needed. Rollback is limited to these frontend,
test and documentation changes; do not revert unrelated worktree changes.
No commit, push or deployment was performed.

The isolated preview is available at <http://127.0.0.1:3004/series/santa-cruz>.
Port 3002 was already occupied and was left untouched. To restart the preview:

```sh
NEXT_DIST_DIR=.next-test npm start -- --hostname 127.0.0.1 --port 3004
```

Rebuild with `npm run test:browser:build` after further source changes, or run a
development server on a free port for hot reload. Do not run the publishing
command as part of local layout validation.
