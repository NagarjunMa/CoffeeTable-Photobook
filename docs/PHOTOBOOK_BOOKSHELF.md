# Photobook bookshelf

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
