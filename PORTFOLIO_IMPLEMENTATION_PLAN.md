# Photography Portfolio Implementation Plan

## Vision

Build a personal travel and wildlife photography portfolio that feels like a quiet coffee-table book: minimal, editorial, spacious, and image-first. The portfolio should showcase long-term photographic work organized by places, cities, forests, states, or countries.

The design should avoid a social-media gallery feeling. Images should be treated like printed objects on a white or cream gallery wall, with generous spacing, restrained typography, and subtle motion.

## Creative References

- `https://www.tamakiyoshida.com/`
  - Minimal identity.
  - Quiet artist portfolio structure.
  - Large whitespace and image-led presentation.

- `https://normalisboring.es/`
  - Horizontal scrolling experience.
  - Coffee-table-book rhythm.
  - Page-like movement through visual work.

- `https://sashasatchi.com/`
  - Two-image gallery style.
  - Small labels and restrained navigation.
  - Project title beside images.
  - Clicking a project should open a deeper image series.

- `https://kziadova.framer.website/`
  - Strong editorial hero section.
  - Large name/title treatment.
  - Portrait block with descriptive text nearby.

## Personal Story Direction

The site should reflect the photographer's origin story:

- Photography began through childhood memories of a father using a film camera.
- The father composed family images carefully, balancing subject and background.
- A specific childhood photograph from Badami, Karnataka became a creative spark.
- The goal is to capture images that freeze a moment in time without needing a backstory.
- The portfolio should inspire people to value still images in a world dominated by video.
- The work is about silence, memory, composition, place, and emotional presence.

This story should shape the tone of the About page and possibly a short excerpt on the home page.

## Core User Experience

### Home Page

- Grand editorial hero.
- Square portrait/image on the left.
- Photographer role or description on the right.
- Large words anchored toward the bottom.
- White or cream background.
- Minimal navigation.
- No heavy cards, gradients, decorative blobs, or social-feed styling.

### Work Index

- The hero remains in the normal vertical document flow.
- After the hero, vertical wheel movement drives a pinned horizontal city index.
- Each place/city/forest is presented as a full-viewport exhibition panel.
- Each panel combines the city name on the left with full-bleed map artwork. Photographs begin only after the city book is opened.
- Clicking the title, map, or photograph opens the collection page.

### Collection Page

- Vertical editorial sequence for each city book.
- Images spaced like pages in a coffee-table book with varied alignment and generous whitespace.
- Landscape and portrait images must keep their natural aspect ratio.
- Images should not be aggressively cropped.
- Use `object-fit: contain` for full-image viewing.
- Include subtle counters, captions, or place/year metadata where useful.

## Content Model

Google Drive is the source library.

Recommended folder structure:

```txt
Photography/
  Badami/
    001.jpg
    002.jpg
    003.jpg
  Bandipur/
    001.jpg
    002.jpg
  Istanbul/
    001.jpg
    002.jpg
```

Each subfolder under `Photography` becomes a collection.

Generated site data should look conceptually like:

```txt
src/data/collections.json
public/photography/badami/
public/photography/bandipur/
public/photography/istanbul/
```

Routes:

```txt
/
/about
/series/[slug]
```

## Publishing Workflow

For the first version, use a manual publish flow instead of automatic polling.

The desired flow:

```txt
Add folders/images to Google Drive
        ↓
Run local publish command
        ↓
Sync latest Drive images locally
        ↓
Generate collection manifest
        ↓
Optimize images
        ↓
Build Next.js site
        ↓
Deploy to Vercel
```

Primary command:

```bash
npm run publish
```

Suggested internal command chain:

```bash
npm run sync:drive
npm run build
vercel deploy --prod
```

Optional Mac double-click launcher:

```bash
#!/bin/zsh
cd /Users/nagarjunmallesh/Documents/photography-portfolio
npm run publish
```

This can be saved as `Publish Portfolio.command` later.

## Recommended Stack

### Application

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`

### Image And Data Pipeline

- `googleapis`
  - Fetch folders and image files from Google Drive.

- `sharp`
  - Resize and optimize images.
  - Generate web-friendly formats such as `.webp`.

- `slugify`
  - Convert folder names like `New York` into URL slugs like `new-york`.

- `zod`
  - Validate environment variables and generated data.

- `tsx`
  - Run TypeScript scripts locally, such as the Drive sync script.

### Motion

- `gsap`
  - Hero animation.
  - Horizontal coffee-table scroll.
  - Refined transitions.

- `lenis`
  - Smooth scrolling.

- CSS `scroll-snap`
  - Useful for collection pages and horizontal galleries.

### Utilities

- `clsx`
  - Conditional class names.

- `vercel`
  - Local deployment command.

## Installation List

Core dependencies:

```bash
npm install next react react-dom
npm install gsap lenis
npm install sharp googleapis slugify zod
npm install clsx
```

Development dependencies:

```bash
npm install -D typescript tailwindcss postcss autoprefixer tsx eslint
npm install -D vercel
```

## Typography

Google Fonts are enough for version one. Use `next/font/google` so the fonts are pulled at build time and self-hosted by Next.js.

Recommended pairing:

- Display / hero / city titles:
  - `Cormorant Garamond`

- Body / navigation / captions:
  - `Inter`

- Tiny metadata / counters:
  - `IBM Plex Mono`

Suggested type scale:

```txt
Hero title desktop: 96-160px
Hero title tablet: 72-110px
Hero title mobile: 48-68px

Section/city title desktop: 42-72px
Section/city title mobile: 32-44px

Body/story text: 18-24px
Small labels/counters: 11-13px
Navigation: 12-14px
Image captions: 12-15px
```

Suggested Next.js font setup:

```ts
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});
```

Premium fonts can be considered later, but they are not required to start.

Possible future premium options:

- Canela
- Editorial New
- Founders Grotesk
- Suisse Intl
- Neue Haas Grotesk

## Visual Style

Recommended design tokens:

```txt
Background: #F7F3EA or #FAF8F2
Text: #111111
Muted text: #77736A
Divider: #DDD6C8
Accent: deep olive, charcoal, or muted rust
```

Style rules:

- Prefer white or cream backgrounds.
- Keep image corners square or nearly square.
- Avoid decorative cards.
- Avoid heavy gradients.
- Avoid social-feed masonry as the primary experience.
- Let images breathe with large margins.
- Use small, precise labels.
- Keep navigation minimal.
- Motion should be subtle and editorial.

## Google Drive Sync Design

The local sync script should:

1. Authenticate with Google Drive.
2. Find the root `Photography` folder.
3. List all child folders.
4. Treat each child folder as a collection.
5. List image files inside each collection folder.
6. Download or update changed images.
7. Optimize images with `sharp`.
8. Generate `src/data/collections.json`.

Implementation update:

- The active script is `scripts/sync-drive.ts`.
- It uses local OAuth credentials, not a service account, so it can read the photographer's personal Drive folders.
- First login stores a private `.google-drive-token.json` file locally.
- Generated collection data is written to `src/data/generated/collections.json`.
- Optimized `.webp` images are written to `public/photography/`.
- Sync status is written to `.cache/drive-sync.json`.
- The app automatically falls back to demo collections when the generated collection file is empty.
- Files named `map-poster.*` or `poster.*` in a city folder are treated as city poster backdrops and are excluded from the gallery.
- See `GOOGLE_DRIVE_INTEGRATION.md` for setup and usage.

The collection manifest should include:

```ts
type Collection = {
  title: string;
  slug: string;
  sourceFolderId: string;
  coverImages: string[];
  images: {
    id: string;
    fileName: string;
    src: string;
    width: number;
    height: number;
    orientation: "portrait" | "landscape" | "square";
  }[];
};
```

## Environment Variables

Likely required:

```txt
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_DRIVE_ROOT_FOLDER_NAME=Photography
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_OAUTH_PORT=53682
```

For local-only sync, these can live in `.env.local`.

For Vercel, the final deployed site should not need Google credentials if images and manifests are generated before deployment.

## Implementation Phases

### Phase 1: Project Scaffold

- Create Next.js app.
- Add TypeScript and Tailwind CSS.
- Configure fonts.
- Add base layout and design tokens.
- Add placeholder data for three collections.

### Phase 2: Visual Prototype

- Build hero section.
- Build horizontal city work index.
- Build collection page.
- Add vertical city-book image sequence.
- Make image layout respect portrait and landscape orientation.

### Phase 3: Local Drive Sync

- Add Google Drive authentication.
- Create `scripts/sync-drive.ts`.
- Generate local image folders.
- Generate `collections.json`.
- Optimize images using `sharp`.

### Phase 4: Publish Flow

- Add `npm run publish`.
- Add local deployment command through Vercel CLI.
- Optionally add `Publish Portfolio.command` for double-click deployment.

### Phase 5: Refinement

- Add About page.
- Add captions and metadata support.
- Add smoother page transitions.
- Add loading states.
- Tune mobile layout.
- Tune horizontal scrolling interactions.

## Open Decisions

- Final portfolio name/title.
- Whether the hero square image is a self portrait, favorite image, or rotating image.
- Whether each folder should support an optional metadata file, such as `meta.json`.
- Whether image ordering should be filename-based or metadata-based.
- Whether each collection needs cover image control through `cover.jpg`.

## Recommended Next Step

Implement the approved redesign backlog below as one coordinated pass, then validate the complete experience across desktop and mobile before further visual changes.

## Approved Redesign Backlog

This section is the authoritative implementation list for the next coordinated redesign pass.

### 1. Branded Opening Sequence

- Add a black opening screen that presents the photographer's name.
- Move and scale the same typographic mark into the final bottom-aligned hero position.
- Run the full sequence once per browser session and skip it during internal navigation.
- Keep the server-rendered hero underneath the overlay to avoid a loading bottleneck or hydration mismatch.
- Respect reduced-motion preferences.

### 2. Hero Composition And Scroll Zoom

- Fix the current hero title cropping so `Nagarjun Mallesh` remains fully visible after loading at every supported viewport width.
- Recalculate the title size from the available container width, not viewport width alone.
- Preserve safe left and right gutters and prevent `overflow: hidden` from cutting off the final letters.
- Verify the title after web fonts finish loading to prevent a fallback-font-to-display-font width shift.
- Preserve the minimalist bottom-aligned hero composition.
- Keep the hero typography-only. Do not place a photograph behind or beside the name.

### 3. Horizontal City Exhibition

- Convert the city index from vertical sections into a pinned horizontal sequence driven by vertical wheel movement.
- Keep every city panel approximately one viewport wide and one viewport high.
- Keep the city number, name, field note, and open-book action on the left.
- Make the map artwork a full-bleed background rather than framed right-side artwork.
- Retain a quiet left-side zone or paper-colored gradient so the city title remains readable.
- Allow the city to open from its name or anywhere on the map panel.
- Support horizontal swipe and scroll snapping on touch devices.

### 4. Responsive Map Artwork

- Use one map-only desktop asset per city at a 16:9 ratio: `20 x 11.25` inches, approximately `6000 x 3375` pixels.
- Use one map-only mobile asset per city at a 9:16 ratio: `11.25 x 20` inches, approximately `3375 x 6000` pixels.
- Name the files `{city}-map-desktop.png` and `{city}-map-mobile.png`.
- Extend MapToPoster with `--map-only` to remove city, country, coordinates, decorative rule, and typography-specific gradient.
- Retain visible OpenStreetMap attribution in the artwork or provide it beside the map in the website.
- Keep important geography away from the outer safe-crop area and favor the center-right composition.

### 5. Vertical City Books

- Replace the collection page's pinned horizontal track with a vertical editorial sequence.
- Use a textured-black background throughout each city book.
- Begin with an opening spread containing city title, location, year, note, and selected preview photograph.
- Compose photographs into complete 12-column exhibition rows: landscape pairs, mixed 4/8 rows, and portrait trios.
- Preserve natural aspect ratios without cropping and keep spacing close enough for the images to read as one exhibition wall.
- Finish with navigation back to the city index and forward to the next city.

### 6. Immersive Gallery Lightbox

- Refine the existing lightbox rather than replacing it.
- Animate the selected thumbnail into an uncropped image contained within approximately `88vw x 88dvh`.
- Blur and darken the city page behind the image.
- Support click-outside, Close, Escape, arrow keys, counters, and mobile swipe.
- Restore the exact gallery position and focus when the lightbox closes.
- Serve high-quality web derivatives while keeping archival source files private.

### 7. Animation Ownership And QA

- Keep Lenis responsible for smooth physical scrolling.
- Keep GSAP, ScrollTrigger, and `@gsap/react` responsible for all scroll-linked and timeline animation.
- Do not add Anime.js because its `onScroll` behavior duplicates ScrollTrigger and does not replace Lenis.
- Validate Chrome, Safari, Firefox, iOS Safari, Android Chrome, wide desktop, tablet, and mobile.
- Verify no title clipping, image cropping, hydration warnings, layout shift, competing scroll behavior, or inaccessible motion.

## Redesign Implementation Status - July 30, 2026

Implemented in the current Next.js portfolio:

- Session-aware black opening sequence with reduced-motion support.
- Font-loaded, resize-aware hero title fitting with a two-line mobile composition.
- Typography-only hero with no photographic background.
- Pinned horizontal desktop city exhibition driven by vertical scrolling.
- Native horizontal swipe and container-width scroll snapping for mobile cities.
- Full-bleed city map backgrounds with a readable paper gradient and no photographic preview, preserving the map-grid cover concept.
- Responsive `mapPosterDesktop` and `mapPosterMobile` collection fields with fallback to the existing poster.
- Drive sync recognition for `*-map-desktop` and `*-map-mobile` artwork, preserved without cropping.
- Textured-black city books with tightly composed landscape pairs, mixed rows, and portrait trios at natural aspect ratios.
- Immersive blurred lightbox with thumbnail-origin motion, keyboard controls, focus restoration, and mobile swipe.
- Lenis-aware scroll locking so closing the lightbox returns to the selected photograph.
- Compact `Work / About / Contact` navigation styled as quiet photobook furniture; language and CV labels are omitted until those destinations exist.
- Series-page navigation belongs to the opening spread and scrolls away before the gallery, keeping the photographs unobstructed.
- Inset off-white gallery folios sit within the textured-black city book, with deliberate page margins, generous image gutters, and understated frame captions.
- Gallery compositions retain each photograph's natural aspect ratio while using consistent 12-column editorial rows.

Validation completed during implementation:

- ESLint passed.
- TypeScript passed with no emitted files.
- Next.js production build passed for the homepage, About page, and all generated city routes.
- Desktop and mobile browser checks confirmed title containment, horizontal city motion, natural image ratios, lightbox containment, and no document-level horizontal overflow.
