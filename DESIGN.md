---
name: Nagarjun Mallesh Photography
description: A restrained, collection-led photographic archive in warm paper, dark ink, and tactile volumes.
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
  shelf-wood: "#78634d"
  binding-hampi: "#9b542c"
  binding-maine: "#314d43"
  binding-new-york: "#283c53"
  binding-santa-cruz: "#a34336"
  binding-washington: "#55435d"
  binding-tigers: "#666039"
  binding-bhutan: "#7d3036"
  binding-ranganathittu: "#31656b"
  binding-default: "#405649"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "80px"
    fontWeight: 600
    lineHeight: 0.8
    letterSpacing: "0"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(48px, 6vw, 88px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
  detail-title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(40px, 4.8vw, 68px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.1
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
  shelf-control:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.circular}"
    width: "48px"
    height: "48px"
  shelf-control-hover:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
  shelf-inspect:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    padding: "8px 0"
  book-open-link:
    textColor: "{colors.foreground}"
    padding: "14px 0"
    width: "100%"
  book-open-link-hover:
    textColor: "{colors.accent}"
  detail-spread:
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

The photobook shelf extends this inherited identity with cloth bindings, photographic cover plates, page edges, warm wood, and individual paper spreads. This tactile vocabulary belongs to books and their inspection cards; it does not require every interface surface to become three-dimensional. The hero and galleries retain their existing visual roles.

**Key Characteristics:**

- Photography keeps its complete composition, with room around the image.
- Oversized serif titles sit beside restrained utility text.
- Paper, cloth, mats, and wood provide material depth.
- Each collection has a distinct binding within one coherent library.
- Responsive layouts preserve readable content and usable navigation.

## Colors

The palette combines warm neutral paper and ink with an olive interaction accent; collection bindings introduce richer, muted colors as physical materials.

### Primary

- **Olive accent** (`accent`): the open-photobook link changes to this color on hover. It is an interaction accent, not a broad page fill.

### Secondary

- **Collection cloth** (`binding-*`): Hampi uses clay, Maine forest, New York slate blue, Santa Cruz brick, Washington plum, Tigers ochre olive, Bhutan burgundy, and Ranganathittu teal. The default is forest gray. These assignments come from the collection presentation source and carry through the shelf, fallback covers, and detail spread binding edges.

### Neutral

- **Warm background** (`background`) and **paper** (`paper`): the public site canvas and readable detail pages.
- **Brown ink** (`foreground`), **muted ink** (`muted`), and **paper line** (`line`): primary copy, supporting copy, and quiet structure on the light surfaces.
- **Exhibition wall** (`gallery-wall`), **mat** (`gallery-mat`), **gallery ink** (`gallery-ink`), and **gallery secondary** (`gallery-secondary`): the inherited dark gallery and light photographic frames.
- **Plate paper** (`detail-plate`): the warmer left leaf of an inspected volume.
- **Shelf wood** (`shelf-wood`): the physical support beneath the rendered books.

**The Material Color Rule.** Binding colors identify volumes; they do not replace the portfolio's shared paper-and-ink navigation palette.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks. Loaded weights are 400, 500, and 600.

**Body Font:** Inter, with Arial and sans-serif fallbacks.

**Label/Mono Font:** IBM Plex Mono, with Courier New and monospace fallbacks. Loaded weights are 400 and 500.

**Character:** The serif supplies editorial scale and book-like titles. Inter handles facts and introductions; the mono face marks navigation, counts, and book imprints. The global default letter spacing is zero.

### Hierarchy

- **Display**: the uppercase photographer name uses the display token. Its nominal size steps to 140px, 220px, and 280px at 768px, 1280px, and 1600px. The existing hero fits it to available width after fonts load; these are maximum starting sizes rather than guaranteed rendered sizes.
- **Headline**: the library heading uses the fluid headline token. Gallery destination titles use weight 500, line-height 0.9, and a separate responsive 56/80/128/152px scale at the same breakpoints.
- **Detail title**: the fluid detail-title token names the selected collection; long titles wrap and balance.
- **Title**: the selection caption uses the title token, reducing to 30px on narrow screens. Story previews use a smaller serif title (26px, weight 400, line-height 1.15).
- **Body**: introductions use the body token. Library invitation copy uses line-height 1.6 and a 32ch maximum. Metadata values use 14px. Authored gallery story text uses the serif story token; an available subtitle is limited to 62ch.
- **Label**: header navigation and shelf counters use the mono label role. Counts use tabular numerals. The existing header is uppercase; shelf titles and actions retain sentence case.

**The Editorial Hierarchy Rule.** Let serif scale carry the title hierarchy; reserve the mono face for navigation and useful book information.

## Layout

The shared site gutter is fluid (`clamp(1rem, 3vw, 3rem)`). The inherited hero has its own slightly wider gutter and nearly fills the viewport. General spacing is deliberately generous, with repeated 16px, 24px, 32px, 48px, and 64px steps; smaller gaps support controls and facts.

The library heading is capped at 1600px. The shelf occupies the full available width, with a stage height of `clamp(420px, 42vw, 560px)`. Beneath it, a selection row capped at 1440px puts collection information on the left, the inspection action in the middle, and browsing controls on the right. A wrapping contents navigation completes the section.

Below 768px, the heading stacks, the stage is 360px high, and the selection becomes two columns with a full-width inspection action on its second row. The count beside the arrows hides while the complete contents remain available. The CSS fallback is a horizontal snap rail with individual book links.

An inspected book is a centered spread capped at 1180px within a scrollable full-viewport dialog. Equal-width leaves become one stacked column below 768px. Facts remain in a two-column grid; copy and photographs stay within their page widths. Maps switch responsive sources at 768px and retain their credit.

The inherited gallery is one column on mobile, with rows of photographs at 48rem and above. Row widths derive from actual image ratios and a shared image height; the frame mat is fluid (`clamp(0.65rem, 1.25vw, 1.25rem)`). The story becomes two columns at 900px. Collection openings gain two columns at 768px and an index/title/image layout at 1280px.

**The Whole Photograph Rule.** Fit photographs and map plates to their available space without cropping; derive gallery proportions from the actual image dimensions.

## Elevation & Depth

Depth follows the material: a faint ruled paper background, textured dark gallery walls, light mats, soft frame shadows, and tactile books. Flat navigation remains quiet around these objects. Cloth weave is generated locally in canvas; the cover plate uses an existing collection photograph fitted inside a paper rectangle. The shelf adds soft lighting, page edges, a hinged cover, and perspective.

### Shadow Vocabulary

- **Light image frame** (`0 1rem 3rem rgb(17 17 17 / 0.075)`): soft depth for the inherited light frame utility.
- **Gallery frame** (`0 1.5rem 3.5rem rgb(0 0 0 / 0.28), 0 0 0 1px rgb(255 255 255 / 0.12)`): physical mat separation against the dark wall.
- **Inspected volume** (`0 22px 64px rgb(0 0 0 / 0.35)`): the paper spread lifted over the dimmed shelf.
- **Page fold** (`inset -20px 0 28px -24px rgb(60 40 20 / 0.35)`): subtle shading along the left leaf's inner edge.
- **Fallback binding** (`inset 10px 0 14px rgb(0 0 0 / 0.2), 10px 16px 25px rgb(37 33 29 / 0.18)`): a book spine and soft cast shadow when WebGL is unavailable.

**The Object Depth Rule.** Use depth to describe a photograph, frame, or bound volume; do not turn structural navigation into a field of elevated cards.

The horizontal shelf follows a drag directly and settles with a critically damped spring that preserves release velocity. A horizontal trackpad gesture browses volumes without consuming vertical page scrolling. Hover opens a cover slightly. A scoped GSAP timeline lifts a book from its visible shelf position and hinges its cover over 760ms to reveal the spread; closing reverses the same path and can interrupt an opening. Reduced motion skips the spatial opening and cover hover and resolves selection directly; the fallback also loses its perspective transform. The existing gallery reveals spreads once on entry and skips that reveal for reduced motion.

## Shapes

Paper spreads, mats, photographs, cover plates, and fallback books use square corners. Thin rules organize content: light separators on paper, subtle light rules on the dark gallery, and dark horizontal rules around the full-book action. The inspected spread has narrow cloth-colored top and bottom edges (6px). Circular arrow controls are the deliberate exception to the rectangular book geometry.

The rendered book has a distinct front board, back board, spine, and page block. Its dimensional form remains local to the library interaction. Existing illustrations and maps keep their own artwork silhouettes rather than being redrawn into a new icon style.

## Components

### Buttons and links

Actions are restrained and readable, with line or outline treatments rather than large filled call-to-action blocks.

- **Shelf arrows:** circular, outlined controls at the shelf-control token dimensions; 44px square below 768px. Hover inverts ink and background over 180ms. Arrow icons are SVGs.
- **Inspection action:** transparent, a single bottom rule, minimum height 48px, and a directional SVG. It expands across its mobile row.
- **Open photobook:** a full-width text link between two ink rules, minimum height 48px, with hover accent and a directional SVG.
- **Close:** a paper-colored rectangular button with text and an SVG, minimum height 44px, above the spread.
- **Editorial text link:** an underline grows over 360ms on hover. Header links retain a minimum 44px target.
- **Focus:** the shared visible focus treatment is a 2px current-color outline offset by 5px. Keep it visible on both paper and gallery surfaces.

### Navigation

The inherited header is a 64px-high strip with the mono initials, Photobooks, About, and Contact. It uses the relevant light or dark page palette. Shelf contents are real collection links with a 44px minimum height; the selected item receives ink color and an underline offset by 7px. Arrow keys, Home, and End move through the contents.

### Photobook shelf

An ordered horizontal row centers one clothbound volume while neighboring books signal browsing. A visible drag/swipe hint explains direct manipulation; arrows remain an alternative. Each cover uses the collection's title, binding color, photographer imprint, photograph count or preparation state, and an actual cover photo when available. Touch and pointer dragging share selection with the DOM caption and controls. Vertical scrolling stays available. The scene loads near the viewport, rests when motion settles, and sleeps offscreen.

Real CSS book links support the same collection routes before enhancement and when WebGL fails. The rendered canvas is decorative to assistive technology; the accompanying controls and contents provide its accessible interaction.

### Individual detail spread

Each collection opens a separate native dialog: title, photograph and place on the left, authored experience opening on the right. Without a personal account, the existing collection introduction supplies the preview. A clear complete-photobook link follows the prose. Available factual information and the existing map or illustration remain in a secondary expandable section, preserving attribution. An empty volume says that photographs are being prepared. Available dates and captions come from collection data.

A light-paper Thinking Orbs screen holds the opening until the preview photographs have loaded and decoded. The spread stays hidden and inert while preparing; return remains available, failed images offer retry, and slow connections offer a deliberate continue. Empty books open immediately.

The spread scrolls on narrow or short viewports. Closing or pressing Escape restores the opener's focus and page scrolling; the collection hash supports direct linking and history. Photographs use contain fitting. Existing map assets retain responsive selection and OpenStreetMap attribution; illustrations do not receive map attribution.

### Gallery and lightbox

The inherited gallery presents uncropped photographs in light mats on a dark textured wall. Captions stay attached to their frames. Clicking a photograph opens a full-viewport dark lightbox with close, previous, next, and count controls. A loading screen uses the existing Thinking Orbs treatment and offers a way to continue when loading is slow. Loading and error states remain readable in the gallery palette.

## Do's and Don'ts

### Do:

- **Do** retain the shared warm paper, dark ink, serif titles, and mono navigation when extending the library.
- **Do** fit photographs completely inside cover plates, detail pages, gallery frames, and lightboxes.
- **Do** keep binding colors consistent for each collection across rendered books, fallback books, and inspection cards.
- **Do** preserve visible focus, usable touch targets, real collection links, and reduced-motion behavior.
- **Do** use actual photographs, authored text, available metadata, and the existing approved maps or illustrations.
- **Do** distinguish a volume in preparation from a published photographic gallery.

### Don't:

- **Don't** fabricate photographs, locations, dates, field observations, or personal accounts to fill a layout.
- **Don't** replace complete image compositions with cropped thumbnails.
- **Don't** spread the library's three-dimensional book treatment into every navigation or content surface.
- **Don't** make a decorative canvas the only way to discover or open a collection.

Not canonized: inherited gallery metadata eyebrows and footer kickers, and isolated 10–11px map/imprint/fact labels, are recorded as existing surface details rather than reusable hierarchy rules. This documentation pass does not repair unrelated visual drift.

Source basis: `src/app/globals.css`, `src/app/fonts.ts`, `src/components/hero.tsx`, `src/components/site-header.tsx`, `src/components/collection-gallery.tsx`, `src/components/work-index.tsx`, `src/components/collection-map.tsx`, `src/components/photobook-shelf-scene.tsx`, `src/lib/bookshelf-renderer.ts`, and `src/lib/photobook-presentation.ts`. Scope and durable constraints are grounded in `PRODUCT.md` and the photobook surface direction contract. This records the local implementation; it makes no release or deployment claim.
