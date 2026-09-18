# Cloudflare Images: Local Publishing

The site runs locally in Next.js. Google Drive remains the private source library;
Cloudflare stores private web masters and delivers responsive display images.
No Vercel configuration or deployment is needed for local review.

## Commands

```sh
npm run sync:cloudflare
npm run dev
```

To add or refresh just one album without changing other books:

```sh
npm run sync:cloudflare -- --folder-id DRIVE_ALBUM_FOLDER_ID
```

Use the album's ID, not the Photography root ID. The folder must be an immediate
child of the configured root. The command preserves other collections and their
order, appends new books, and still requires all selected photographs and privacy
checks to pass before replacing the manifest. Without `--folder-id`, the command
retains its full-library sync behavior. No Cloudflare images are deleted.

Open http://localhost:3000. `npm run sync:drive` also uses Cloudflare whenever
`CLOUDFLARE_ACCOUNT_ID` is configured. The explicit Cloudflare command fails if
credentials are missing, instead of falling back to public local images.

After adding, removing, or renaming photos in Drive, rerun the sync command.
There is no scheduled polling. Renamed files are reordered naturally by filename.
Deleted Drive files disappear from the manifest after a successful sync; their
old Cloudflare uploads are retained privately for rollback, and still incur
storage charges. Remote deletion is intentionally a separate future maintenance
operation. Previously issued signatures remain valid until expiry.

## Local Environment

Use `.env.local` (preferred) or `.env`. The sync follows Next.js precedence:
existing process environment, then `.env.local`, then `.env`.

Required Cloudflare fields:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGES_ACCOUNT_HASH`
- `CLOUDFLARE_IMAGES_API_TOKEN`: Account / Cloudflare Images / Edit
- `CLOUDFLARE_IMAGES_SIGNING_KEY`
- `CLOUDFLARE_IMAGES_URL_TTL_SECONDS`: default 3600, range 60 to 86400

Google Drive OAuth settings remain required for publishing. An expired Drive
login opens a fresh authorization window. Keys and tokens never belong in
`NEXT_PUBLIC_` variables, generated collection data, or source control.

## Quality And Privacy

Uploads come directly from Drive source files, not previous WebP derivatives.
Sharp applies orientation, converts to sRGB, preserves the full composition,
and produces a maximum 4096-pixel long-edge JPEG at quality 96 with 4:4:4 chroma.
Small sources are never enlarged. Uploads exceeding 10 MB fail explicitly rather
than silently lowering quality. Apple ImageIO provides a lossless PNG decoding
fallback for HEIF files unsupported by Sharp on macOS.

Source EXIF/XMP metadata is removed, including GPS and device identifiers. The
web master receives creator and copyright EXIF tags for Nagarjun Mallesh and an
sRGB profile. This does not preserve source-specific licensing fields or C2PA
Content Credentials; those need a separate metadata policy if required later.

Cloudflare variants all use square bounding boxes, `scale-down`, copyright
metadata, and public access disabled:

| Variant | Long-edge bound |
| --- | ---: |
| mobile | 960 |
| gallery | 1920 |
| retina | 2560 |
| lightbox | 3200 |
| hero | 4096 |

Cloudflare chooses the output format. Its delivery encoding may still introduce
compression; visual approval remains part of the local review. Enlarged views
can request up to 4096 pixels, while normal gallery views stop at 2560.

## Delivery

`/api/photographs/[id]/[variant]` validates that the image is in the current
published manifest and that the variant is one of the five approved sizes.
It creates a fresh HMAC-SHA256 signed Cloudflare URL and issues an uncached 302.
The browser downloads image bytes directly from Cloudflare. Static page builds
contain stable local paths, not expiring signatures. Lazy loading works even
after a page has been left open beyond the signing TTL.

The native image component uses actual pixel widths for responsive `srcset`,
including portrait images. Cloudflare performs the image optimization, so the
photographs intentionally bypass the Next.js image optimizer. Maps still use
the existing Next.js image handling.

This is an anonymous public portfolio: visitors can obtain signed URLs for
published photographs. Signed delivery protects the private masters from
unsigned access and limits URL reuse; it cannot prevent screenshots or saving
delivered pixels. The cross-site browser embedding check is a modest deterrent,
not bot protection. Rate limiting and bot controls are NOT implemented locally
and must be selected for the eventual hosting/delivery domain before launch.

## Reliability And Rollback

- Upload cache: `.cache/cloudflare-images.json`, keyed by Drive ID, modification
  time, and processing version, scoped to the Cloudflare account.
- Provider metadata lets a rerun recover uploads after a lost response/cache.
- Existing unchanged uploads are checked and reused.
- The manifest is replaced atomically only after all photographs succeed and
  signed/unsigned checks pass for a sample from each collection.
- A failed sync preserves the existing gallery; rerun it to resume.
- Previous manifest: `.cache/collections-before-sync.json`.
- Original local manifest: `.cache/collections-before-cloudflare.json`, retained
  across later syncs for migration rollback.
- Concurrent sync commands are prohibited by a local exclusive lock.
- Existing public derivatives remain until the explicit retirement command.

## Verification And Cutover

```sh
npm run test:images
npm run verify:images
npm run images:retire-local
npm run build
```

Verification checks every published image, every variant, unsigned requests,
expired signatures, and tampering. Retirement first repeats delivery verification,
then moves old public files into `.cache/retired-public-photographs/<timestamp>`.
Active Drive map posters remain public. A public derivative can be restored
from that backup together with the matching previous manifest for local rollback.

Retirement removes current public paths but does not erase previously deployed
assets, cached copies, or Git history. No deployment has been performed as part
of this local setup. Review the Git diff before publishing.

## Later Deployment

The Next.js host needs the Images account hash, signing key, and TTL. The upload
API token and Google OAuth credentials stay on the publishing machine. Hosting
must support Node.js route handlers; a purely static export cannot sign URLs.

## Local Validation - September 13, 2026

- Synced 52 photographs: Maine 9, New York 12, Santa Cruz 12, Washington 19.
- Repeated sync: zero uploads, all 52 reused.
- All 52 signed images and all five variants passed live delivery checks.
- Unsigned, expired, and modified signatures were rejected by Cloudflare.
- Local endpoint rejected unpublished IDs, arbitrary variants, and cross-site
  embedding requests. Redirects use `private, no-store`.
- Retired 41 local public files into a private backup; tested an old URL as 404.
- Five focused automated tests, ESLint, TypeScript, and production build passed.
- Browser checks at desktop and 390px mobile confirmed loaded photographs,
  uncropped frames, no gallery horizontal overflow, and working blurred lightboxes.
- No upload token or signing key appeared in generated data or production client
  bundles. No Vercel deployment or Git push was performed.

Review depth: critical because this change handles credentials, access controls,
and migration of public image paths. The local implementation has been reviewed
and checked against live provider denial behavior. Production bot controls,
rate limiting, and final visual approval remain launch tasks. Browser-visible
pixels remain capturable, and older Git history still contains past derivatives.

Sources verified September 13, 2026:

- https://developers.cloudflare.com/images/optimization/hosted-images/serve-private-images/
- https://developers.cloudflare.com/images/storage/upload-images/methods/
- https://sharp.pixelplumbing.com/api-output/
