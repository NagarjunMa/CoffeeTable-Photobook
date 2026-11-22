# Photobook redesign

Service: a personal travel and wildlife photography portfolio, not a booking site.
Deal: stone-blueprint / Schibsted Grotesk / film still hero / picture-develops;
the warm stone ground lets the photographer's own colour and monochrome work lead.
Native scrolling, immediate press feedback and reversible existing dialogs apply
Apple Design's response, agency, spatial consistency and reduced-motion guidance.

## Brief and voice

Nagarjun Mallesh; eight collections, 151 photographs. The primary action is
See photobooks. Use only the existing photographs and authored experiences.
Voice: the photographer's first-person, specific recollections; plain navigation.
No invented trip, client, award, pricing, biography or dates. Collections with
only a note use that note, without claiming an undocumented first visit.

## Page plan

- Landing hero: one screen; actual New York photograph, photographer's name,
  photography category, collection count and See photobooks.
- Photobooks: existing direct-manipulation carousel and photo/story preview,
  pending the photographer's optional grid preference. Equal page edges.
- Behind the photographs: the photographer's Kanha account beside a different
  tiger photograph; the dealt picture-develops moment gives the still its arrival.
- Closing: contact and collection navigation; no invented services or address.
- Every book: cover and introduction, readable full experience or existing note,
  tightly spaced uncropped gallery, previous/next collection navigation.

## Scope and application constraints

Significant visual/interaction scope, full record in this document. Branch
`codex/photobook-editorial-redesign`, based on 2c41a5b. Preserve the unrelated
Bhutan editorial edit and existing media artifacts. No publishing is requested.

Keep the current Next.js server and signed photograph endpoint: a static export
would break private-image delivery. Use the skill's local-URL checks instead.
Keep the user-requested carousel and progressive image/decode gate; these take
precedence over generic prohibitions on carousels and per-frame transitions.
Drop rotation in favour of restrained frame motion. Keep authored long accounts
and a dense gallery at natural height, rather than force either into fixed-height
marketing screens. Existing real contact information remains functional.

Taste assets are copied unchanged, only for the used system/layout/motion and
picture-develops families. React owns their mount/unmount lifecycle. No shader,
stock photograph, generated art, fake video control or new animation dependency.

## Acceptance and checks

1. Landing shows actual work immediately, identifies photographer/category,
   and reaches all eight books and their existing previews.
2. Every collection presents its cover, existing introductory note, full existing
   experience and every photograph in original order. No invented memories.
3. Gallery remains close-set, uncropped, keyboard-operable and responsive;
   retry, lightbox, decode and slow-loading recovery remain usable.
4. Typography, aligned edges, controls and focus states share one system;
   press is immediate, scrolling native, reduced motion leaves content visible.
5. Check real images at 1440, 1024, 820, 768, 390 and narrow 320 widths. Run
   production build, lint, editorial/gallery tests and affected browser checks.
   Use the Taste checker/layout/performance scripts sequentially, inspect their
   screenshots, and run its finish gate without changing its source.
6. Fresh-context engineering review on the completed source; fix material
   findings and recheck affected behavior before handoff.

## Implementation and review

`Hero`, `WorkIndex`, `PhotographerNote` and `SiteFooter` compose the landing page.
`CollectionGallery` owns each cover, complete introduction, personal account,
gallery and collection navigation. `GalleryFrame`, `PortfolioPhoto`, the image
API and lightbox retain their existing error/decode/loading responsibilities.
`DesignMotion` mounts the unchanged local Taste modules and destroys only the
moment instances belonging to its route. One Schibsted Grotesk family and shared
stone/blue tokens replace the old typography and textured backgrounds.

Removed the unused introductory overlay, home animation wrapper and Lenis
wrapper. Native scrolling keeps navigation immediate. The requested carousel
still supports pointer drag, wheel, arrows, keyboard and photo/story previews.
Stories grow naturally in two columns on wider screens and one on phones.
Images retain original aspect ratios/order, white mats and 12–24px row gaps.
Short phones allow the hero to grow instead of clipping its text or photograph.

Fresh read-only reviewer: `/root/photobook_redesign_review`, separate context,
three rounds maximum. PRR-01 (confirmed) restored the full collection note rather
than using the shortened index blurb. A distinct-note rendering regression test
covers this. PRR-02 (pre-existing, fixed) nested GSAP contexts could contain each
other and overflow the stack during carousel unmount; callbacks now register
only in their media context. Preview-to-book browser checks cover that path.
Responsive WebKit validation also exposed a retained title-fitting feedback
loop: observing parent height caused repeated font fits. The observer now fits
only on width changes, while retaining the font-ready fit. All-book responsive
navigation checks cover the long Ranganathittu heading.

## Validation receipt and limits

- **Passed:** `NEXT_DIST_DIR=.next-test npm run build` (production webpack build,
  TypeScript and all static routes); `npm run lint`; `npm run test:gallery`
  (8 tests); `npm run test:editorial` (15 tests); `git diff --check`.
- **Mixed / incomplete:** affected Playwright suite, Chrome and WebKit, 79 passed,
  21 failed. The run reported 5.7 hours with individual navigation, audit and
  browser-teardown timeouts of 15–18 minutes. These are not a clean test receipt.
  Chrome and WebKit both passed cover-to-preview navigation, story readability,
  lightbox focus/recovery checks, and multiple responsive sizes. WebKit passed
  all eight books at 1440px; at 390px it passed the corrected Ranganathittu story
  interaction before timing out on the next Tigers page load.
- One WebKit contrast audit sampled an intermediate translucent entrance frame
  rather than final colours. The audit now requests reduced motion and waits
  for the loading screen to disappear before checking the settled interface.
  This last test-only change has **not been rerun**; no claim of a fully passing
  accessibility suite is made. The separate gallery motion checks remain.
- **Blocked:** final Taste gate: `GATE: ERROR (the checks ran past 9.5 minutes)`.
  No retry after ERROR, per the skill. Final real-photo screenshot also timed
  out. Layout and performance checks are **not complete**; no performance
  improvement or final design-gate pass is claimed. The earlier visual/checker
  run predates final fixes and cannot establish final acceptance.
- Local free disk fell below 500 MiB during the long run. This and the browser
  stalls need resolving before completing the remaining checks. No user media
  or unrelated files were deleted to make space.

No Taste waivers were added. Earlier generic findings about carousel/scroll
effects and fixed screen heights conflict with the explicit retained product
requirements above; other earlier findings must be re-evaluated against this
snapshot. There is no completed final open-FAIL inventory because the gate
timed out. Initial checker warnings about missing share metadata remain; no
canonical URL or social image was invented. All photographs are existing client
assets; no assumed facts, coined names, stock frames or media placeholders were
introduced. The existing real email remains functional rather than being
replaced with the skill's generic `.example` contact.

Final independent review disposition: no unresolved material source findings
identified; PRR-01 and PRR-02 resolved. Validation remains incomplete and the
snapshot must not be described as release-ready. Host limitations do not prove
that all 21 browser failures are environmental.

Execution context: implementation is available in the production preview at
http://127.0.0.1:3101/. Validation remains pending as listed above. No commit,
push or deployment is part of this task. The unrelated Bhutan editorial edit
and existing marketing/video artifacts remain untouched.

## Remote branch handoff

The subsequent November 22 request authorizes committing and pushing this
redesign to `codex/photobook-editorial-redesign`, with a PR description for manual
PR creation. This supersedes the initial local-only delivery scope, not the
validation limitations. The branch also contains the earlier progressive
gallery reveal/spacing commit `2c41a5b`, which is not yet on fetched `origin/main`.
Exclude the unrelated local Bhutan editorial edit, private/cache files, Taste
browser profiles and marketing/video artifacts. Existing validation ran with
that local editorial override present; the remote commit retains the original
Bhutan story. No deployment or merge is authorized by this handoff.
