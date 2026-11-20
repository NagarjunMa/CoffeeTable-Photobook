# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors, editors, collaborators, and potential clients exploring Nagarjun Mallesh's travel and wildlife photography.

## Product Purpose

Present photographic stories as quiet, collection-led coffee-table books. Success means visitors can discover a place or subject through its introduction and then move into an uncropped, image-first gallery.

## Positioning

The portfolio treats each place or wildlife subject as a distinct editorial volume instead of presenting photographs as a social feed.

## Operating Context

The responsive website is viewed on desktop and mobile. Google Drive is the private source library, Cloudflare Images delivers gallery photographs, and publishing is a deliberate local workflow.

## Capabilities and Constraints

- The collection index is a centered, looping photo carousel adapted from Skiper
  UI 54. Drag, swipe, horizontal trackpad gestures, arrows and destination links
  browse collections. A photograph or preview action opens a photo-and-story
  dialog before the complete photobook. Available facts and maps remain in a
  secondary expandable section.
- Real collection links remain usable without JavaScript; keyboard, touch,
  reduced-motion and history navigation are supported.
- Individual collections open as vertical galleries with uncropped photographs.
- A preview waits behind Thinking Orbs until its photographs have loaded and
  decoded, then reveals the photo and authored opening. Cancellation, retry and
  a slow-connection continue option keep it usable. Complete galleries retain
  their own full-screen Thinking Orbs transition while photographs load.
- A collection may include a photographer-authored personal account between its opening and gallery.
- New collections may be published before their gallery photographs are ready, with an explicit preparation state.
- Do not fabricate photographs, captions, locations, or field observations.

## Brand Commitments

- Name: Nagarjun Mallesh.
- Travel and wildlife photography, including tigers photographed in Indian tiger reserve forests.
- A restrained, image-led coffee-table-book presentation.

## Evidence on Hand

- Authored travel collections and photographs in `src/data/generated/collections.json` and `src/data/editorial.json`.
- The user-approved tiger line illustration at `public/intro-art/tigers-line-poster.webp`.
- The synced Tigers volume contains 17 photographs delivered through Cloudflare Images.
- Ranganathittu now contains 49 Drive image files, with a photographic cover and
  complete gallery delivered through private Cloudflare Images.

## Product Principles

- Let the artwork and photography lead.
- Organize stories as coherent volumes rather than isolated posts.
- Preserve each photograph's complete composition.
- Keep responsive navigation accessible and predictable.
- Distinguish factual published material from work that is still being prepared.
