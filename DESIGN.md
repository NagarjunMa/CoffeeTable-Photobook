---
name: Nagarjun Mallesh Photography
description: A restrained, collection-led photographic archive in warm paper, dark ink, and authored photographic volumes.
colors:
  background: "#faf8f2"
  foreground: "#25211d"
  muted: "#686258"
  line: "#ddd6c8"
  accent: "#4e563d"
  paper: "#f7f3ea"
  gallery-wall: "#090908"
  gallery-mat: "#f5f3ed"
  gallery-ink: "#f1efe9"
  gallery-secondary: "#bdbab3"
  detail-plate: "#eee8dc"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "80px"
    fontWeight: 600
    lineHeight: 0.8
    letterSpacing: "0"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(56px, 7.2vw, 96px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "0"
  detail-title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(40px, 4.8vw, 68px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(38px, 4vw, 58px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
    letterSpacing: "0"
  story:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "20px"
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "IBM Plex Mono, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  square: "0"
  circular: "50%"
  photobook: "16px"
spacing:
  compact: "8px"
  small: "12px"
  inline: "16px"
  medium: "20px"
  section-inner: "24px"
  panel: "32px"
  section: "40px"
  generous: "48px"
  spread: "64px"
components:
  carousel-control:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.circular}"
    width: "52px"
    height: "52px"
  carousel-control-hover:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
  carousel-inspect:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    padding: "12px 0"
  book-open-link:
    textColor: "{colors.foreground}"
    padding: "14px 0"
    width: "100%"
  book-open-link-hover:
    textColor: "{colors.accent}"
  carousel-image-window:
    rounded: "{rounded.photobook}"
    height: "clamp(300px, 32vw, 430px)"
    width: "min(43vw, 580px)"
  detail-spread:
    rounded: "{rounded.photobook}"
    backgroundColor: "{colors.paper}"
    textColor: "{colors.foreground}"
  detail-plate:
    backgroundColor: "{colors.detail-plate}"
    padding: "32px"
  detail-close:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.foreground}"
    padding: "8px 14px"
---

# Design System: Nagarjun Mallesh Photography

## Overview

**Creative North Star: "The Photographic Volume"**

The portfolio presents travel and wildlife photographs as authored collections with the gravitas of coffee-table books. Warm paper and dark brown ink frame the public index; a dark exhibition wall holds the complete photographic galleries. Large, expressive serif titles establish authorship while quiet sans-serif copy and monospaced navigation support reading.

The photobook index extends this inherited identity with a centered photographic carousel and an individual photo-and-story preview. A selected photograph expands from the clipped neighboring windows; paper mats and the existing serif hierarchy connect the interaction to the rest of the portfolio. This component replacement leaves the hero and galleries in their established visual world.

**Key Characteristics:**

- Photography keeps its complete composition, with room around the image.
- Oversized serif titles sit beside restrained utility text.
- Paper, mats, and photographic frames provide material depth.
- Each collection leads with its own photograph and authored opening.
- Responsive layouts preserve readable content and usable navigation.

## Colors

The palette combines warm neutral paper and ink with an olive interaction accent; the photographs supply the carousel’s color.

### Primary

- **Olive accent** (`accent`): the open-photobook link changes to this color on hover. It is an interaction accent, not a broad page fill.

### Neutral

- **Warm background** (`background`) and **paper** (`paper`): the public site canvas and readable detail pages.
- **Brown ink** (`foreground`), **muted ink** (`muted`), and **paper line** (`line`): primary copy, supporting copy, and quiet structure on the light surfaces.
- **Exhibition wall** (`gallery-wall`), **mat** (`gallery-mat`), **gallery ink** (`gallery-ink`), and **gallery secondary** (`gallery-secondary`): the inherited dark gallery and light photographic frames.
- **Plate paper** (`detail-plate`): the warmer left leaf of an inspected volume.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks. Loaded weights are 400, 500, and 600.

**Body Font:** Inter, with Arial and sans-serif fallbacks.

**Label/Mono Font:** IBM Plex Mono, with Courier New and monospace fallbacks. Loaded weights are 400 and 500.

**Character:** The serif supplies editorial scale and book-like titles. Inter handles facts and introductions; the mono face marks navigation, counts, and book imprints. The global default letter spacing is zero.

### Hierarchy

- **Display**: the uppercase photographer name uses the display token. Its nominal size steps to 140px, 220px, and 280px at 768px, 1280px, and 1600px. The existing hero fits it to available width after fonts load; these are maximum starting sizes rather than guaranteed rendered sizes.
- **Headline**: the Photobooks heading uses the fluid headline token. Gallery destination titles use weight 500, line-height 0.9, and a separate responsive 56/80/128/152px scale at the same breakpoints.
- **Detail title**: the fluid detail-title token names the selected collection; long titles wrap and balance.
- **Title**: the selection caption uses the title token, fixed at 38px below 768px. Preview story titles use a fluid serif size (`clamp(30px, 3.5vw, 44px)`, weight 400, line-height 1.15); their opening prose uses `clamp(20px, 2vw, 26px)` with line-height 1.55.
- **Body**: introductions use the body token. The carousel invitation uses line-height 1.7. Metadata values use 14px. Authored gallery story text uses the serif story token; an available subtitle is limited to 62ch.
- **Label**: header navigation and carousel counters use the mono label role. Counts use tabular numerals. The existing header is uppercase; carousel titles and actions retain sentence case.

**The Editorial Hierarchy Rule.** Let serif scale carry the title hierarchy; reserve the mono face for navigation and useful book information.

## Layout

The shared site gutter is fluid (`clamp(1rem, 3vw, 3rem)`). The inherited hero has its own slightly wider gutter and nearly fills the viewport. General spacing is deliberately generous, with repeated 16px, 24px, 32px, 48px, and 64px steps; smaller gaps support controls and facts.

The library heading and selected-collection row are capped at 1600px. The full-width carousel centers a photograph with neighboring windows visible on each side. Desktop card width is `min(43vw, 580px)`, window height is `clamp(300px, 32vw, 430px)`, and the card gap is 32px. The selected row puts collection information on the left, the preview action in the middle, and browsing controls on the right; a wrapping footer carries the gesture hint and destination links.

Below 768px, the heading stacks, cards become 82vw wide with an 18px gap, and window height becomes `clamp(260px, 78vw, 430px)`. The selection becomes two columns with a full-width preview action on its second row. The arrow count hides while destination links remain available. Before enhancement, the same real photograph links form a horizontal CSS snap rail.

The photo-and-story preview is capped at 1080px within a scrollable full-viewport native dialog. Equal-width photograph and story panels stack below 768px. Facts remain in a two-column grid; copy and photographs stay within their panel widths. Maps switch responsive sources at 768px and retain their credit.

The inherited gallery is one column on mobile, with rows of photographs at 48rem and above. Row widths derive from actual image ratios and a shared image height; the frame mat is fluid (`clamp(0.65rem, 1.25vw, 1.25rem)`). The story becomes two columns at 900px. Collection openings gain two columns at 768px and an index/title/image layout at 1280px.

**The Whole Photograph Rule.** Fit photographs and map plates to their available space without cropping; derive gallery proportions from the actual image dimensions.

## Elevation & Depth

Depth follows the material: a faint ruled paper background, textured dark gallery walls, light mats, and soft frame shadows. Flat navigation remains quiet. The carousel replaces simulated books with paper-matted photographic windows; the preview retains a soft shadow and subtle inner-panel shading rather than a physical hinge.

### Shadow Vocabulary

- **Light image frame** (`0 1rem 3rem rgb(17 17 17 / 0.075)`): soft depth for the inherited light frame utility.
- **Gallery frame** (`0 1.5rem 3.5rem rgb(0 0 0 / 0.28), 0 0 0 1px rgb(255 255 255 / 0.12)`): physical mat separation against the dark wall.
- **Inspected volume** (`0 22px 64px rgb(0 0 0 / 0.35)`): the paper preview lifted over the dimmed page.
- **Page fold** (`inset -20px 0 28px -24px rgb(60 40 20 / 0.35)`): subtle shading along the photograph panel’s inner edge.
- **Story panel shading** (`inset 20px 0 28px -24px rgb(60 40 20 / 0.25)`): the matching inner edge on desktop; stacked mobile panels use `inset 0 16px 20px -20px rgb(60 40 20 / 0.3)`.

**The Object Depth Rule.** Use depth to describe a photograph, frame, or bound volume; do not turn structural navigation into a field of elevated cards.

Embla owns the centered looping track, drag/swipe, and horizontal trackpad selection while vertical page scrolling remains available. GSAP expands the active window from a 13% top/bottom inset to zero over 800ms with `expo.out`; both endpoints retain the photobook radius. Selected caption children rise 14px and fade in over 550ms with a 50ms stagger and `expo.out`. Each animation is scoped and cleaned up; track transforms and mask animation have separate owners.

After the preview’s image decode gate, GSAP reveals its shell from 24px below at scale 0.98 over 550ms, wipes the photograph panel from its right edge over 700ms beginning at 80ms, and reveals story children from 14px below over 500ms with an 80ms stagger beginning at 200ms. All use `expo.out`; closing reverses the timeline at 1.5× speed and can interrupt opening. Reduced motion resolves masks, selection and preview immediately. The existing gallery reveals spreads once on entry and skips that reveal for reduced motion.

## Shapes

Gallery mats, gallery photographs, and map plates retain square corners. The carousel’s clipped windows and link outlines, plus the photo-and-story preview container, use the scoped photobook radius; this local rounded treatment does not redefine gallery frames. Thin rules organize paper content and the complete-photobook action. Circular arrow controls remain the browsing affordance.

Existing illustrations and maps keep their own artwork silhouettes rather than being redrawn into a new icon style.

## Components

### Buttons and links

Actions are restrained and readable, with line or outline treatments rather than large filled call-to-action blocks.

- **Carousel arrows:** circular, outlined controls at the carousel-control token dimensions; 44px square below 768px. Hover inverts ink and background over 180ms. Arrow icons are SVGs.
- **Preview action:** transparent, a single bottom rule, minimum height 48px, and a directional SVG. It expands across its mobile row.
- **Open photobook:** a full-width text link between two ink rules, minimum height 48px, with hover accent and a directional SVG.
- **Close:** a paper-colored rectangular button with text and an SVG, minimum height 44px, above the preview.
- **Editorial text link:** an underline grows over 360ms on hover. Header links retain a minimum 44px target.
- **Focus:** the shared visible focus treatment is a 2px current-color outline offset by 5px. Keep it visible on both paper and gallery surfaces.

### Navigation

The inherited header is a 64px-high strip with the mono initials, Photobooks, About, and Contact. It uses the relevant light or dark page palette. Carousel contents are real collection links with a 44px minimum height; the selected item receives ink color and an underline offset by 7px. Arrow keys, Home, and End move through the contents.

### Photobook carousel

A Skiper UI 54 adaptation centers one paper-matted photograph while clipped neighboring windows signal browsing. The complete selected image is contained inside its mat; inactive windows use the top/bottom mask as a selection cue. A visible drag/swipe hint, arrows, and destination links support exploration. Every card is a real collection link; ordinary clicks open its preview, while modifier clicks retain link behavior. Arrow keys, Home and End update selection and move focus to the corresponding card. Focusing a card also selects it. Card focus uses a 2px olive outline inset by 3px so it remains visible inside the clipped viewport.

The selected caption announces place and photograph count, and a separate underlined action opens the same preview. Empty collections show a preparation state. Image delivery retains the existing photograph error recovery. The looping track is enhanced with Embla 8.6.0, while GSAP owns masks and caption motion. With JavaScript unavailable, the photograph links remain a horizontally scrollable snap rail leading to complete collection routes. A Skiper UI attribution link remains below the index.

### Photo-and-story preview

Each collection opens a native dialog: title, photograph and place on the left, authored experience opening on the right. Without a personal account, the existing collection introduction supplies the preview. A clear complete-photobook link follows the prose. Available factual information and the existing map or illustration remain in a secondary expandable section, preserving attribution. An empty volume says that photographs are being prepared. Available dates and captions come from collection data.

A light-paper Thinking Orbs screen holds the preview until its photographs have loaded and decoded. The preview stays hidden and inert while preparing; return remains available, failed images offer retry, and slow connections offer a deliberate continue. Empty books open immediately.

The preview scrolls on narrow or short viewports. Closing or pressing Escape restores the opener's focus and page scrolling; the collection hash supports direct linking and history. Photographs use contain fitting. Existing map assets retain responsive selection and OpenStreetMap attribution; illustrations do not receive map attribution.

### Gallery and lightbox

The inherited gallery presents uncropped photographs in light mats on a dark textured wall. Captions stay attached to their frames. Clicking a photograph opens a full-viewport dark lightbox with close, previous, next, and count controls. A loading screen uses the existing Thinking Orbs treatment and offers a way to continue when loading is slow. Loading and error states remain readable in the gallery palette.

## Do's and Don'ts

### Do:

- **Do** retain the shared warm paper, dark ink, serif titles, and mono navigation when extending the library.
- **Do** fit selected carousel photographs completely inside their mats, and preserve complete compositions in detail pages, gallery frames, and lightboxes.
- **Do** preserve visible focus, usable touch targets, real collection links, and reduced-motion behavior.
- **Do** use actual photographs, authored text, available metadata, and the existing approved maps or illustrations.
- **Do** distinguish a volume in preparation from a published photographic gallery.

### Don't:

- **Don't** fabricate photographs, locations, dates, field observations, or personal accounts to fill a layout.
- **Don't** replace complete image compositions with cropped thumbnails.
- **Don't** generalize the carousel and preview’s rounded mask treatment to the square gallery mats.
- **Don't** make carousel enhancement the only way to discover or open a collection.

Not canonized: inherited gallery metadata eyebrows and footer kickers, and isolated 10–11px map/imprint/fact labels, are recorded as existing surface details rather than reusable hierarchy rules. This documentation pass does not repair unrelated visual drift.

Source basis: `src/app/globals.css`, `src/app/fonts.ts`, `src/components/hero.tsx`, `src/components/site-header.tsx`, `src/components/collection-gallery.tsx`, `src/components/work-index.tsx`, `src/components/collection-map.tsx`, `src/components/ui/skiper-ui/skiper54.tsx`, `src/components/book-detail-dialog.tsx`, and `src/lib/photobook-presentation.ts`. Scope and durable constraints are grounded in `PRODUCT.md` and the photobook surface direction contract. This scoped November 19, 2026 update records the implemented carousel and preview; the finish reviewer scored the three requested fixes resolved (`disposition: ship` for those fixes). It makes no release or deployment claim.
