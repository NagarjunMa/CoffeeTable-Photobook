# Photobook carousel

## Current contract

November 19, 2026. Replace the simulated bookshelf with the photographer's
specified Skiper UI 54 clip-path carousel. Preserve the portfolio's actual
photographs, personal accounts, collection URLs, image privacy, full-gallery
composition, and photo-and-story preview. The photographer chose to keep the
preview before the complete photobook.

Mode: Experience. This is a precisely specified replacement of a component in
the existing paper/ink/serif world, not a redesign of the hero or galleries.
Standard risk, compact engineering record: established collection data and
preview ownership remain, but the carousel and its interaction lifecycle change.

## Design and ownership

- `src/components/ui/skiper-ui/skiper54.tsx`: adapt the actual free registry
  source's centered cards, clipped inactive images, drag/swipe and navigation.
  Embla owns track movement; GSAP owns image masks and caption transitions.
  Do not let two animation systems write the same transform.
- `src/components/work-index.tsx`: selection, accessible destination links,
  history/deep links, preview opening and return focus.
- `src/components/book-detail-dialog.tsx`: existing private-image decode gate,
  Thinking Orbs, retry/cancel/continue, authored preview and full-book link.
- Keep real links without JavaScript. Preserve vertical page scrolling, modifier
  clicks, keyboard browsing, reduced motion and current history URLs.
- Remove the unused WebGL shelf and its Three.js dependencies.
- Keep free-component attribution. The upstream install command was attempted;
  its dependency list incorrectly includes `@/components/ui` as an npm package.
  Use its retrieved source and valid Embla dependency, replacing Motion with the
  already installed GSAP rather than installing an unused second animator.

## Acceptance and checks

- All eight real books can be browsed by drag, swipe, arrows and keyboard and
  opened into their correct preview; changing slides does not open a preview.
- A selected image expands from its clipped state. Caption movement and preview
  reveal are interruptible, scoped, cleaned up and reduced-motion aware.
- The active photograph and preview keep their complete compositions. Failed or
  slow image delivery retains its existing deliberate recovery controls.
- Back/forward, Escape, focus restoration and no-JavaScript links still work.
- Desktop and narrow mobile views have no horizontal document overflow.
- Run focused browser interaction/loading checks, build, lint, and existing
  editorial/gallery checks. Inspect real-image screenshots separately from mocked
  browser fixtures. Finish with a fresh review of the completed surface.

## Implementation and evidence

Implemented on `codex/skiper-photobook-carousel`, based on `origin/main`
(`6c408bb`). An unrelated Bhutan editorial change and existing video/review
artifacts remain outside this task. No publication is requested.

The carousel uses actual cover photographs, a centered loop with visible
neighbours, a 13%-to-zero clip reveal, and a selected destination caption. The
preview uses a reversible masked reveal after its original decode gate. The
unused scene, renderer, Three.js and its type package were removed. The only
new runtime dependency is `embla-carousel-react@8.6.0` (with its Embla peers).
The npm lock remains authoritative; `pnpm dlx` was only the requested CLI runner.

- Webpack production build: passed. The separate Turbopack test build also passed.
- TypeScript, lint, `git diff --check`: passed.
- Existing editorial/gallery checks: 21 passed.
- Focused browser coverage: all 36 checks passed in one final Chrome/WebKit run;
  carousel navigation, all eight
  previews at desktop/mobile widths, history, focus, no-JavaScript links,
  reduced motion, image decode/failure/retry/cancel/continue, and Axe checks.
- Live-image captures: passed at 1440px and 390px, all eight cover photographs
  loaded, with complete images and no document horizontal overflow. Final
  production captures are `.impeccable/review/skiper54/{desktop,mobile}.png`,
  `new-york-{1440,390}.png`, and `journal-{1440,390}.png`.
- The mechanical detector ran once: 47 advisory token findings, zero
  non-advisory findings. Existing global type-scale drift is outside this
  component replacement; intentional carousel endpoints/radius are documented.

The initial browser run lacked the exact bundled Chromium executable; the final
run uses the installed Chrome through `PLAYWRIGHT_CHANNEL=chrome`. Initial
loading tests were corrected to intercept image requests before eagerly cached
covers loaded, and the vertical-scroll regression now scrolls upward because
this section is at the document end. The actual recovery behavior remains tested.

Fresh finish review identified a card keyboard selection/focus mismatch and an
old journal eyebrow. Card navigation now transfers focus before activation,
with ArrowRight/Enter, Home/End and Escape regression coverage; the eyebrow was
removed without changing authored text. Scoped product/design documentation
was reconciled by the scoped documenter.

The fresh reviewer's verdict pass scored all three fixes resolved, observed no
regressions from that batch, and returned `disposition: ship` for those scored
fixes. It inspected source and final screenshots; browser tests were executed by
the parent, not independently repeated by the reviewer. Reviewer:
`/root/skiper54_finish_review`; documenter: `/root/skiper54_documenter`.

Status: verified locally within the checks above and prepared for a pull request
on `codex/skiper-photobook-carousel`. Production publication remains separate.
Firefox and the complete unrelated browser suite were not run.
