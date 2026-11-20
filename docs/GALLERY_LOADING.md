# Collection loading and scroll reveal

## Current contract — 2026-11-20

Standard risk, compact record: change collection presentation inside its existing
client boundary. User approved an original GSAP reveal after the requested
Skiper32 registry returned HTTP 401 and required a Pro licence. No protected
component source or new dependency is used.

The full-screen Thinking Orbs gate now prepares only the opening photograph,
including `decode()` and cached completion. A failed cover releases the screen
and exposes Retry. The existing 12-second Continue control, no-JavaScript rule,
CSS fallback for missing client scripts, and late-hydration recovery remain.
Later gallery photographs use native lazy loading and low priority, so an
unvisited frame cannot hold the opening or story behind the loading screen.

`collection-gallery.tsx` owns that opening gate, authored rows/story and lightbox
selection. `gallery-frame.tsx` owns each frame's original GSAP entrance: a small
perspective tilt, rise and fade to its complete, uncropped composition. It starts
once at the viewport edge and waits for decoding, with a local Thinking Orb only
while an entered frame is pending. Load errors reveal existing Retry controls.
Cached images, replacement image nodes after Retry, focus, media changes and
unmount are handled within the frame lifecycle. GSAP moves only the inner group;
its figure keeps the intrinsic layout. Existing row tweens no longer target the
gallery, preventing competing transforms.

Reduced motion leaves frames static. Keyboard focus immediately exposes its
frame and controls, even if pending. Server markup stays visible without client
JavaScript. Image delivery, original order, uncropped ratios, equal desktop row
heights, white mats, stories, signed URLs and native lightbox remain unchanged.

## Evaluations and execution context

Base: `origin/main` 2f0d6c1, branch `codex/gallery-scroll-reveal`.
The unrelated existing `src/data/editorial.json` edit is outside this task.

| Criterion | Check / wrong implementation rejected |
| --- | --- |
| Opening releases while a later frame is held | New scroll browser test holds last photo; rejects waiting for every lazy image |
| Decode precedes reveal, pending orb clears | Hold/release last frame; verify loaded image, final opacity and identity transform |
| Retry and keyboard focus stay usable | Failed lazy image then Retry; focus pending frame and open/close lightbox |
| Reduced motion / lifecycle cleanup | Static preference and live preference change tests; no hidden frame or lingering transform |
| Full image geometry and no-JS fallback | Existing layout/loading regressions; server-render eager cover/lazy gallery assertions |

## Validation and review

November 20, 2026, uncommitted feature snapshot on the branch above:

- Baseline: six server-rendered gallery checks passed before implementation.
- `npm run lint`, `npm run test:gallery` (6), and `npm run test:editorial` (15): passed.
- Isolated webpack production build: passed, including TypeScript and static pages.
  The initial build caught an unsupported Orb size (40); the supported 32px size
  was used before successful browser/build checks.
- Initial broad run: `PLAYWRIGHT_CHANNEL=chrome npx playwright test
  tests/browser/gallery-scroll-reveal.spec.ts tests/browser/layout-refinement.spec.ts
  tests/browser/portfolio.spec.ts --project=chromium --project=webkit`: 80 passed.
- Fresh-context read-only review of the actual dirty source identified GSR-1:
  focusing an already-playing entrance did not settle it immediately. The
  deterministic reproduction returned opacity 0.347 and a non-identity transform.
  The instant branch now completes the existing tween even after reveal begins.
  Correction review found GSR-1 resolved, with no new material findings.
- Corrected production build: focused Chrome/WebKit feature + consumer run had
  27 passes and one test-setup failure: WebKit correctly deferred a lazy request
  until scrolling, while the new test waited before scrolling. The test now
  approaches the frame first and retains its synchronous, clock-controlled
  assertion. Final focused feature run: **14/14 passed**, including mid-tween
  focus, held decode, pending/failed/retried frames and live reduced motion.
  The 14 affected consumer checks (lightbox, keyboard, geometry and Axe) passed
  on the corrected application code in the preceding run.
- Live, unmocked New York and Ranganathittu checks: passed at 1440px and 390px;
  first four NYC images and Ranganathittu's final frame decoded successfully,
  with no horizontal overflow. Screenshots are in ignored
  `.cache/gallery-scroll-review/`. The in-app preview also confirmed real images,
  scrolling, lightbox opening/closing and restored focus.

`GalleryFrame` owns preparation/reveal, reusing `PortfolioPhoto` for image
requests and errors. No second image pipeline, copied Pro source or extra
animation dependency was introduced. The deliberate shared-policy change is
cover-first loading; the browser decides native lazy-loading lookahead. These
checks establish behavior, not a measured production speedup or device FPS.
Physical iOS/Android testing was not run. No commit, push or deployment occurred.
The pre-existing Bhutan editorial change remains separate.

Scoped lesson: keyboard focus may arrive after a reveal starts. Finish the
current tween on focus, rather than treating the already-started flag as a
reason to return. The clock-controlled synchronous assertion prevents a normal
animation completion from hiding this defect. Lazy-loading tests must scroll
before expecting an offscreen request to complete, particularly in WebKit.

## Preview loading (separate boundary)

`book-detail-dialog.tsx` retains its independent Thinking Orbs/decode gate,
retry/cancel/continue behavior and reduced-motion handling. The preview opens
from the carousel; [PHOTOBOOK_CAROUSEL.md](PHOTOBOOK_CAROUSEL.md) records that
component's current contract and earlier validation. This change does not alter
that preview lifecycle. The former all-gallery eager loading policy is
superseded by the cover-first policy above.

## Gallery spacing refinement — 2026-11-20

The photographer requested less empty space between photographs. Horizontal
and vertical gallery gutters now use 12–24px responsive spacing, replacing
32–72px within rows and 40–88px between rows. Caption separation is 8px instead
of 16px. Original ratios, mats and reveal behavior are preserved.

Lint, six gallery render checks and live desktop/mobile checks passed. Actual
computed gutters were verified within 12–24px, with loaded NYC/Ranganathittu
photographs and no horizontal overflow. The local Turbopack cache initially
served the former stylesheet; refreshing that generated cache exposed the new
CSS and the spacing check passed. No additional dependency or deployment.
