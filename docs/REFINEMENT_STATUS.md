# Phased Refinement: Implementation And Acceptance

Updated September 14, 2026. Local implementation; no deployment, remote push,
Drive synchronization, Cloudflare upload or photograph deletion performed.

## Outcome

The engineering changes are implemented. Full portfolio acceptance is **not
complete**: authored descriptions/sequence require photographer approval, clean
map artwork is unavailable, and physical-device/200% browser zoom checks remain
outstanding. Automated success is not editorial approval or a security certificate.

The typography-only hero, map-only destination panels, horizontal destination
index, vertical dark galleries, equal-height desktop rows, white mats and
uncropped images remain. No font family, CMS or animation engine was added.
Image signing, private-original controls and photographic quality settings were
not changed. The test fixture's resizing applies only to isolated test responses.

## Phase Ledger

| Phase | Status | Local commit / result |
| --- | --- | --- |
| 0: regression baseline | Verified | `4dbdbc6`; pinned Playwright/axe, isolated server, reproducible interaction failures and baseline screenshots. |
| 1: interaction/loading | Verified for automated cases | `43f26d8`; single map link, native dialog, guarded intro, decoded-image retention and Retry. Final Safari/early-image-event fixes in phase 6. |
| 2: responsive/type | Verified at listed viewports | `5f602ce`; flexible openings, fitting names, touch/focus/contrast tokens. Browser zoom and physical devices pending. |
| 3: contents/motion | Verified for automated cases | `9f66825`; contents, hash/history restoration, mobile snap, reduced-motion/short-screen flow. |
| 4: editorial/identity | Implemented; approval blocked | `d7c4535`; stable-ID overrides and 41 drafts. Eleven photographs still require visual description review; no authored selections are falsely approved. |
| 5: maps/polish | Implemented; replacement artwork blocked | `3f626d1`; 24 responsive WebP derivatives from six immutable sources, including transitional Maine maps. |
| 6: integrated acceptance | Engineering verification complete; release gates remain | Final local verification/documentation commit; evidence and limitations below. |

## Review Issue Ledger

Status terms: **verified** means the named automated/source checks passed, not
every possible browser/device; **implemented** means code exists but acceptance
requires further work; **blocked** identifies the specific missing input.

| Review issue | Status | Resolution and remaining gate |
| --- | --- | --- |
| 1 Map hit target | Verified | One accessible full-panel link, map/title/action same target, drag activation suppressed; mouse and keyboard tests. |
| 2 Modal focus | Verified | Native `showModal`, visible Close focus, background inertness, Tab wrap, Escape/arrows, explicit pointer-opener focus for Safari, scroll/opener restoration. Physical touch pending. |
| 3 Tablet preview | Verified | Stack below 768, flexible two columns through tablet, three from 1280; no width overflow in tested openings. |
| 4 Narrow titles | Verified at current-name viewports | Fixed breakpoint sizes plus font/container measurement; long Washington title fits at 320. Arbitrary future names and actual 200% browser zoom remain manual checks. |
| 5 Descriptions/contrast | Implemented; editorial approval blocked | Caption/navigation contrast and axe checks pass. 41 draft descriptions, 11 blocked records. Approved-only production retains existing descriptions until reviewed. |
| 6 Contents/position | Verified | Actual-scroller snapping, direct controls, active item, explicit hash history, native Index return, breakpoint reconfiguration. Physical swipe/Back/Forward follow-up remains. |
| 7 Extra ceremony | Verified | Full-screen City Books interstitial removed; compact contents immediately follow the hero. |
| 8 Map assets | Implemented; artwork blocked | One responsive picture, correct width descriptors, map focal/scrim metadata. All four destinations still need clean source-art approval/replacement; duplicate baked labels are not declared fixed. |
| 9 Curation | Implemented; photographer decisions blocked | Selected cover honored; single/pair/tall-trio overrides validated. Filename order and automatic grouping remain until deliberate cover/spread choices are approved. |
| 10 Loading/intro | Verified for automated failure cases | Server content visible without JS; storage optional; keyboard/pointer skip; unconditional teardown; failed/cached-early image Retry; previous lightbox photo retained during failed next-image decode. |
| 11 Reduced motion | Verified | Unpinned flow, no large horizontal translation or animated backdrop blur; resize/media-change cleanup tested. |
| 12 Navigation | Verified in automated checks | Legible text, 44px control targets, skip link, focus styles and active-page semantics; no decorative button pills. |
| 13 Personal identity | Implemented; copy approval pending | Nagarjun Mallesh page metadata; shorter father/Badami narrative; distinct factual city drafts. Public canonical/social assets await domain/art decisions. |

## Verification Evidence

- Isolated production build passed: `NEXT_PUBLIC_EDITORIAL_PREVIEW=true npm run
  test:browser:build`. Output is `.next-test`, leaving the existing `.next` dev
  server untouched. No production deployment was run.
- `npm run lint` passed.
- 30 local tests passed: publisher/image delivery 5, editorial 14, map pipeline 8,
  server-rendered gallery edge cases 3.
- **81 browser tests passed**: 27 scenarios each in installed Google Chrome,
  Playwright Firefox 155 and WebKit 26.6. Command:
  `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`.
- Axe WCAG A/AA automated checks passed for homepage, About, Washington opening
  and an open New York modal. This is not a whole-site manual accessibility audit.
- Responsive screenshots captured at 320, 390, 768, 1024, 1440 and 1920px.
  Checked narrow titles, tablet preview bounds, horizontal overflow and responsive
  map source selection. Short landscape behavior tested at 844 x 390.
- Manually inspected captured hero, mixed-orientation frames, 320px opening,
  tablet opening and mobile/desktop map compositions. Mats and original ratios
  remain intact; transitional Washington's baked label is visibly unresolved.
- Browser scenarios include mobile contents/arrows/Back, return to city, map
  clicks and drag suppression, keyboard-only frame activation, modal Tab and
  Shift+Tab containment, Escape and restored focus, denied storage, no JavaScript,
  intro keyboard dismissal, image 503/Retry, failed next-photo retention, out-of-order
  successful image decoding, reduced
  motion, and breakpoint source changes.
- The independent reviewer found and rechecked four fixed issues: mobile GSAP
  initialization, keyboard-hidden reveal rows, dialog measurement before opening,
  and intro dismissal. Cross-browser testing additionally found and resolved
  Safari pointer-opener focus restoration.
- A separate read-only local-preview smoke check returned HTTP 200 for the homepage
  and one configured Cloudflare gallery photograph (`image/jpeg`). This is a
  single delivery check, not an expiry, invalid-signature or all-image audit.

Screenshots/traces are under ignored `test-results/`; HTML report under
`playwright-report/`. Baseline capture is retained locally in
`.cache/frontend-baseline/`. These contain test fixtures and are not an original-
versus-Cloudflare fidelity certification. Tests never depend on live cloud calls.

## Map Measurements

Six source masters total 33,008,432 bytes. Their six 1920-long-edge derivatives
total 3,130,802 bytes, 90.5% smaller; 3840-edge versions total 9,101,178 bytes.
These are measured encoded bytes, not page-transfer totals or loading times.
All source checksums are unchanged. Browser source selection was verified; no
Lighthouse score, real-device FPS or live CDN speed claim is made.

## Remaining Acceptance Gates

1. **Photographer:** approve 41 descriptions/captions and three city notes; inspect
   nine Maine and two New York photographs with unavailable local sources. Approve
   covers, sequence, dates/category and About wording. See `EDITORIAL.md`.
2. **Artwork:** provide clean desktop/mobile map-only masters, nominally 6000 x
   3375 and 3375 x 6000, for all destinations. Maine's atlas and the other existing
   posters are transitional. Verify city centers and attribution after replacement.
   Do not remove credits by cropping or conceal the missing artwork status.
3. **Physical-device/manual checks:** actual iOS Safari and Android Chrome,
   pinch/browser 200% zoom, screen-reader reading order, physical gestures and
   long-session navigation. Desktop WebKit is not physical iOS testing.
4. **Additional stress/performance:** full touch single-image dialog exercise and
   representative hardware animation profiling. Cancellation passes a deliberately
   reordered successful-decode regression; this does not cover every race order.
5. **Dependency security:** the local `npm audit --omit=dev` reported seven
   production dependency findings (one critical, four high, two moderate) in the
   existing dependency tree, including Next 16.2.9 and Sharp. Exploitability for
   this application was not established. No blanket `npm audit fix` or framework
   upgrade was applied in this frontend scope. Review compatible patches, rerun
   audit/build/tests and complete deployment security checks before public launch.
6. **Live delivery and domain:** confirm Cloudflare signing/expiry behavior against
   the configured account, bot/rate rules and canonical/social metadata in the
   separately authorized launch workflow. Fixture-backed tests are not live checks.

## Local Review

The draft-enabled isolated build can be served without rebuilding development:

```sh
NEXT_DIST_DIR=.next-test npm start -- --hostname 127.0.0.1 --port 3002
```

Or use `NEXT_PUBLIC_EDITORIAL_PREVIEW=true npm run dev -- --port 3002` after
stopping whichever process owns that port. Draft mode must be present at build
time for production preview. Unset it and rebuild for approved-only review.
Existing photograph delivery uses the configured local credentials; never commit
environment values. There is no automatic publishing or remote push in this work.
