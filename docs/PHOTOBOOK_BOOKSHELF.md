# Photobook bookshelf

## Release validation — October 21, 2026

The user authorized a direct push to main for the bookshelf refinement and
preview Thinking Orbs transition. The release retains the published Bhutan
story; a separate local deletion of that story is excluded and preserved.
Marketing notes and local review screenshots are also excluded.

Release snapshot checks: lint passed without warnings; webpack production build
and TypeScript/static generation passed (12 routes); editorial15/15 and gallery
6/6 checks passed. The production build with the retained Bhutan story passed
21/21 selected browser checks across Chrome, Firefox and WebKit: all five
preview loading/decode/error/cancel/slow paths and all eight volumes at390px and
1440px. Prior broader review/validation below remains historical evidence.

Publishing uses the existing Vercel Git integration after pushing main. No
Drive sync, dependency changes, collection data edits or manual deployment is
part of this release. Deployment status is verified after the push.

## Preview photograph transition — October 20, 2026

Standard tier, compact extension within the existing book dialog. Apply the
production engineering loop to this bounded loading behavior. Preserve all
previous bookshelf work, unrelated local editorial copy, and gallery loading.

The user wants Thinking Orbs while a book's photographs prepare, then an
uninterrupted opening. The dialog owns a loading gate for its actual rendered
images (responsive preview, animated cover, and secondary map). It waits for
load and decode; no speculative full-gallery preload or duplicate Image object.
GSAP keeps the opening paused until this gate releases. Cancellation must work
throughout. Cached/empty books have no artificial minimum waiting time. A slow
load offers a deliberate continue after12s; failed images offer retry/continue.

| ID | Acceptance | Check / wrong behavior rejected |
| --- | --- | --- |
| L1 | Orb is visible, book content hidden and inert while the selected photograph is delayed; opening starts only once decoded. | Hold responsive image route, assert loading/inert state, release, assert visible decoded image and hinged opening; rejects an orb laid over an already playing opening. |
| L2 | Escape/return cancels loading, restores focus/scroll, and late completion does not reopen the book. | Cancel held request then release and open a different collection. |
| L3 | Slow/error requests cannot trap the reader; retry remounts image requests; explicit continue remains usable. | Failed route then retry success; accelerated timeout with pending images then continue; rejects infinite spinner or silent placeholder reveal. |
| L4 | Empty/cached collections, keyboard trapping and reduced motion still work. | Existing focused bookshelf cases and reduced-motion delayed-image case in three engines. |

Planned validation: red/green loading browser case, lint/build, focused new
loading suite and existing bookshelf cases. Self-review is proportional to this
local Standard change; no shared image-delivery or gallery policy is altered.
Current source: `book-detail-dialog.tsx` owns load/decode state and paused
animation; preview CSS owns the light-paper orb and hidden/inert spread;
`book-preview-loading.spec.ts` exercises delayed transfer/decode, cancellation,
retry and slow continue. No delivery API or shared photo component changed.

L1 reproduced red against the preceding build: no `.book-preparing-screen`
existed. New Chrome loading cases5/5 pass. Lint and webpack production build
with TypeScript/static generation pass. The selected cross-browser loading,
all-volume, history/focus, motion and fallback run passed35/36; its remaining
WebKit cancellation case exposed a real opener-focus issue: Safari pointer
activation need not focus a button, so `document.activeElement` identified the
previous title link instead of the clicked preview button. `WorkIndex.open`
now accepts the explicit trigger from button/contents events; renderer opens
retain their accessible contents-link fallback. Affected focus paths passed12/12 across Chrome, Firefox and WebKit on
the corrected production build (cancellation/late completion, hinged opening,
keyboard/history and no-WebGL fallback). Together with the35 unaffected passing
checks, this resolves the only observed failure; no final full-suite run is
claimed. Current build/lint/diff checks pass. Changes are verified locally and
not published. Physical devices and screen-reader sessions were not run.
Self-review traced cached completion, responsive source changes, cancellation
before reveal, retry remounts, late promises, media changes and listener/timer
cleanup. Unlike the complete gallery's settle-on-load policy, this local preview
waits for decode and allows a deliberate retry before revealing. This policy
difference stays within the preview rather than changing shared image delivery.

## Active refinement — October 20, 2026

Implement and review, Significant tier; full record retained because gesture
physics, WebGL-to-DOM geometry and modal lifecycle change together. Base:
`8e60622`. Preserve the unrelated local Bhutan editorial edit and local folders.
No publishing is part of this request.

The user wants ordered books along one horizontal shelf, direct browsing without
relying on arrows, and a physical opening into a spread: title and photograph
left, first-person experience right, then a link to the complete photobook.
GSAP owns the reversible DOM opening timeline; Three owns shelf geometry,
pointer tracking and spring settling. React owns selection/history. Existing
authored prose, image delivery, gallery routes and progressive fallback remain.

| ID | Refinement acceptance | Evaluation / wrong implementation rejected |
| --- | --- | --- |
| R1 | Straight ordered shelf; pointer/touch drag follows input, projects release velocity and snaps; horizontal trackpad scroll browses while vertical scroll remains available. | Real Chrome pointer/wheel tests, vertical wheel scroll check; rejects arrow-only browsing, drag opening a book and cancelled gestures opening a book. |
| R2 | Any visible book opens in one click; keyboard and real collection links still work. | Off-center raycast test, existing keyboard/fallback/history cases. |
| R3 | Opening hinges around the spine, anchored to the selected book; close reverses and accepts Escape during opening. | Inspect timeline transforms mid-opening; immediate Escape plus repeated opening/closing; rejects a flat popup fade or orphaned scroll lock. |
| R4 | Title and complete photograph on left, authored experience first on right, complete-book link; maps/facts are secondary expandable content. | Desktop geometry and authored paragraph checks; mobile no-overflow/axe; rejects title on right and metadata preceding the experience. |
| R5 | Reduced motion skips spatial animation; small screens, deep links, no WebGL/JS, focus restoration and image error controls remain usable. | Existing focused browser suite plus motion-toggle and keyboard checks. |

Planned verification: lint, production build, focused bookshelf and affected
editorial/layout browser tests, fresh-context read-only engineering review.
`prompt-motion` was not found in installed skill roots or the local skill
collection; available GSAP React/core/timeline and Apple design guidance used.

Execution context: `work-index.tsx` owns shelf selection and routes;
`photobook-shelf-scene.tsx` owns lazy renderer lifecycle;
`bookshelf-renderer.ts` owns picking/movement/source bounds; new
`book-detail-dialog.tsx` owns presentation, scoped GSAP opening/reversal and modal
lifecycle. The build adds no dependencies. Complete: affected regression run and fresh review are green. Lint and
production webpack/type generation pass. Changes remain local on
`codex/bookshelf-direct-interaction`; this refinement has not been published.

### Current review evidence

Fresh-context read-only reviewer `/root/bookshelf_motion_review`, host model
identifier unavailable beyond GPT-6, reviewed source/callers and ran independent
Chromium probes against development port3101. Isolation was instructions-only;
reviewer reported no repository mutation. Two rounds, no recursive delegation.

- R-M1 / P2, confirmed, underlying pre-existing missing outside-release cleanup:
  press near canvas edge, leave before drag threshold, release outside, return;
  shelf treated hover as a drag and ignored wheel input. Repository regression
  reproduced red (cursor remained `grabbing`). Clear pending gesture on leave;
  handle lost pointer capture as cancellation. Reviewer independently confirmed
  outside-release, captured outside-release and lost-capture cases green, with
  no unintended dialog/page errors. Resolved on renderer SHA256
  `601e6dd01844ff6a6c4bbac6166946aeca87e1788e05f455a050419a67c7216b`.
- No other material findings in inspected source. Not a whole-repository audit.
- The new left-title/story regression failed against base as intended. Initial
  Chrome15/16 run caught fractional wheel state surviving title selection;
  choosing a title now clears wheel settling and targets an integer volume.
  Before the R-M1 correction, cross-browser bookshelf run:42 passed,6 deliberate
  graphics skips. Final corrected snapshot:112 passed,8 deliberate graphics
  skips across Chromium/Firefox/WebKit in the affected five-file browser run
  (8.1 minutes). Physical WebGL pointer/trackpad cases run in Chrome; the other
  engines cover DOM, history, keyboard, motion, maps and fallback behavior.
- Current command set: `npm run lint`,
  `NEXT_DIST_DIR=.next-test npm run build`, and
  `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/browser/bookshelf.spec.ts tests/browser/editorial-copy.spec.ts tests/browser/layout-refinement.spec.ts tests/browser/hampi.spec.ts tests/browser/photobooks-navigation.spec.ts --trace off --reporter=list`.
  Native tests start an isolated production server on3100; development preview
  remains on3101. Lint passed with no warnings; webpack production build and
  TypeScript/static generation passed (12 routes). Desktop screenshot confirms aligned books and a two-page
  spread; 390px screenshot confirms readable stacked pages and the full-book
  action. Geometry/keyboard/reduced-motion checks cover narrower and short
  landscape viewports. No frame-rate claim is made.
- Actual changes: the shelf renderer and scene interface, shelf index and new
  focused dialog component, shared bookshelf CSS, affected browser tests, and
  product/design/feature documentation. No collection data, image-delivery,
  gallery source or dependencies changed. Existing unrelated local editorial
  edits are excluded from this task.
- Physical touch devices, screen readers and GPU/FPS profiling are not tested.
  Automated photo routes use controlled fixtures; grey plates in screenshots
  indicate missing optional local photo fixtures, not a production fallback.
- Local skill search found no `prompt-motion`. No installed skill or external
  reference was modified to fill this gap.

October 18, 2026. Implement and review; significant risk because the home-page
navigation model changes and a new WebGL lifecycle crosses the React boundary.
Full feature record; scope is the destination index, not the hero or galleries.

## Goal and scope

Adapt ThreeUI's Bookshelf interaction to eight real photographic collections.
Each place or subject is its own clothbound book. Selecting a book opens a
separate paper detail card with real collection information and a link to its
existing gallery. The requested reference fixes the interaction concept; the
existing warm-paper/serif visual identity continues.

The public ThreeUI Bookshelf has hard-coded demo volumes and embedded demo art.
This adaptation uses its MIT-licensed wrapped layout, damped selection and cover
hinge approach with a typed, smaller portfolio-specific renderer. It does not
ship the demo books or their large atlas. Three r165 matches the reference.
See `THIRD_PARTY_NOTICES.md` and the source URL in `bookshelf-renderer.ts`.

## Acceptance and evaluation contract

| ID | Observable outcome | Evaluation / plausible failure rejected |
| --- | --- | --- |
| B1 | All eight collections appear as distinct books, including the empty collection. | Browser contents count and every preview opens the matching title, count and gallery link; rejects fixed seven-book demo data. |
| B2 | Pointer drag, arrow buttons and keyboard contents choose a book without hijacking vertical scroll. | Browser drag/keyboard tests with actual selection checks; rejects visible motion without working navigation. |
| B3 | Selecting a book opens its individual card with cover, authored copy, available metadata, map/illustration and full-book route. | Browser tests for New York, Bhutan, Hampi, Tigers and empty collection; map breakpoint and OSM attribution checks. |
| B4 | Escape/close restores focus and scroll; direct city hashes and browser history remain meaningful. | Native-dialog keyboard, history and gallery-to-index tests; rejects stuck body locks or stale detail state. |
| B5 | Mobile, reduced motion, no JavaScript and unavailable WebGL retain usable collection links. | Chrome/Firefox/WebKit desktop/mobile, reduced-motion, blocked WebGL, no-JS; narrow-screen overflow and axe checks. |
| B6 | Photographs remain uncropped, private delivery and collection data remain untouched. | Source/diff review, real image smoke test and existing gallery/editorial suites. |
| B7 | 3D code is lazy and releases observers, events, GPU resources and frames on unmount. | Source review, chunk/build inspection and browser route/unmount smoke checks. Renderer sleeps offscreen and after motion settles. |

No new visit dates, stories or descriptions are invented. No Drive sync, provider
upload, commit, push or production deployment is part of this implementation.
A pre-existing local editorial change removing Bhutan's story is preserved.

## Design and ownership

Quality bar: recognizable bound volumes with real photographic cover plates;
the current title and controls agree during movement; selection reveals an
individual readable paper spread; mobile retains the complete photograph and
all details through scrolling; maps keep their credit and appropriate source;
fallbacks preserve real links; no invented dates or prose. The shelf is the
signature interaction, while the hero and gallery retain their existing world.

- `work-index.tsx`: React owns selected volume, native dialog, URL history and
  focus/scroll lifecycle. Contents are real links with progressive enhancement.
- `photobook-shelf-scene.tsx`: intersection-gated import, renderer lifetime and
  resize observer; dynamic code stays outside the initial route bundle.
- `bookshelf-renderer.ts`: Three scene, tactile covers, wrap placement, raycasts
  and horizontal pointer gestures; callbacks communicate selection/open intent.
- `photobook-presentation.ts`: one source for binding color, cover and count.
- `collection-map.tsx`: responsive derivative selection extracted from the old
  index; checks source path before using generated variants and retains credit.
- `globals.css`: shelf, fallback books and two-page detail layout.

No second scrolling controller, alternate image-signing implementation, duplicated
collection data, new schema or provider API is introduced. A native dialog is
appropriate for the requested individual inspection card; full reading remains
on its existing route. CSS fallback links work before hydration and without GPU.

## Execution context and delivery

Base: `9fa34f5` on main. Implementation branch: `codex/photobook-bookshelf`.
Source and browser tests inspected before implementation; existing browser tests
that assert the discarded pinned map layout must be updated to the new contract.
The existing gallery/lightbox/loading behavior remains in scope for regression
checks. Replacement behavior makes pre-change shelf tests fail by design;
visual WebGL fidelity is evaluated through screenshots, not DOM-only mocks.

Implemented and reviewed on `codex/photobook-bookshelf`; the release includes
the bookshelf feature while retaining main's published editorial content.

## Review and corrections

Fresh-context engineering review inspected the renderer, React boundary,
navigation, fallback, maps and relevant callers. Three confirmed P2 findings
were corrected and scored resolved: animation overwriting the requested book,
first-visit intro/modal scroll-lock ownership, and retry controls nested inside
fallback navigation. Each has a browser regression that failed before its fix.
An additional WebKit-specific regression showed native Tab order could skip
anchors; every dialog Tab step is now explicitly managed. The final engineering
verdict found no further issue in those correction paths; tests were run by the
implementer, not independently by the reviewer.

The fresh visual review requested two material corrections: inherited font
families on canvas covers, and suppression of the generated `Field Notes` year
sentinel. Both were scored resolved against refreshed desktop/mobile captures
and source. Its final `ship` disposition covers those fixes, not dynamic behavior
or an exhaustive whole-site design audit. The mechanical detector returned `[]`.
`DESIGN.md` and the required `.impeccable/design.json` document the implemented
system. Existing photographic/map files are reused unchanged; runtime cover
textures are generated locally and no new static raster assets ship.

## Validation evidence

- Passed: final webpack production build with `NEXT_DIST_DIR=.next-test npm run
  build`; the isolated Turbopack build also passed before the final keyboard fix.
- Passed: ESLint, `git diff --check`, 15 editorial tests and 6 gallery-render tests.
- Release validation retained main's published Bhutan story: the production
  webpack build, all 21 editorial/gallery checks, and both desktop/mobile
  every-volume browser cases passed with that content present.
- Broad browser run: 153 passed, 13 failed, 2 skipped. Six failures were the
  duplicated decorative heading in the preparation card (corrected to a span).
  Other failures included the WebKit focus defect and local ENOSPC/timeouts while
  parallel workers wrote traces. They were investigated rather than ignored.
- Final focused shelf/editorial run with one worker and traces off: 39 passed,
  one WebKit focus failure, two intentional skips. After correcting focus, its
  test passed in Chrome, Firefox and WebKit (3/3). The remaining delayed-image,
  no-JavaScript, gallery geometry and accessibility cases passed on serial rerun
  in Firefox/WebKit (8/8). All previously failing cases have passing evidence;
  a single final full-suite green run is not claimed.
- Real Chrome captures at 1440×1000 and 390×844 show the shelf and New York card;
  the preparation card was also inspected. Real signed photo delivery loaded in
  those captures. Automated browser tests use controlled local photo fixtures.
- Pointer dragging/raycast picking is exercised in Chrome. The equivalent test
  is intentionally skipped in Firefox/WebKit; their contents, dialogs, maps,
  keyboard, history, reduced-motion and fallback paths are exercised.
- The sampled Turbopack Three runtime chunk was 483,637 bytes / 120,303 gzip,
  dynamically imported near the shelf. No frame-rate or Core Web Vitals claim.
- Dependency audit reports 16 existing findings; the added `three` package is
  not an affected package. No unrelated dependency remediation was attempted.

Not run: physical iOS/Android, screen-reader sessions, GPU profiling or a public
deployment of this branch. These are limits of the evidence, not passing checks.

## Compatibility and rollback

Collection routes and `#city-*` return links remain valid, now opening the
matching inspector. `#work` goes straight to the shelf without replaying the
hero intro. The pinned full-screen map rail is intentionally replaced; map
source/credit and gallery assertions continue through the new card. Existing
gallery/lightbox and private image delivery responsibilities are unchanged.
Rollback is the feature's source, dependency, browser-test and documentation
diff; preserve the pre-existing editorial change and unrelated local folders.
