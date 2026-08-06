# Google Drive Integration

The portfolio can now use Google Drive as the source of truth for photo collections.

## Drive Folder Structure

Create or use a Drive folder named `Photography`.

Each subfolder becomes one portfolio collection:

```txt
Photography/
  Badami/
    001.jpg
    002.jpg
    003.jpg
    map-poster.png
    meta.json
  Bandipur/
    001.jpg
    002.jpg
```

Images are sorted by filename, so use names like `001.jpg`, `002.jpg`, `003.jpg` when you want precise ordering.

## Optional Map Poster Background

Each city can have a map-poster backdrop for the homepage city index.

Add one of these files inside the city/place folder:

```txt
map-poster.png
map-poster.jpg
poster.png
poster.jpg
```

The sync script optimizes that poster and excludes it from the photo gallery.

You can generate these with a tool like `originalankur/maptoposter`, then export the result into the matching Drive folder.

## Optional Collection Metadata

Add a `meta.json` file inside any city/place folder to control the text shown in the portfolio.

Example:

```json
{
  "title": "Badami",
  "location": "Karnataka, India",
  "year": "Origin Study",
  "note": "Stone, family memory, and the first understanding that a photograph can become complete without explanation.",
  "mapPoster": "map-poster.png",
  "cover": ["001.jpg", "002.jpg"]
}
```

If `meta.json` is missing, the sync script uses the folder name and a default note.

Empty top-level city folders still become portfolio sections. They show the map-poster artwork treatment and a pending-photo state until images are uploaded.

Use `meta.json` when the Drive folder name is shorter than the public display name. For example, a folder named `Santa Cruz` can display as `Santa Cruz Beach Park`:

```json
{
  "title": "Santa Cruz Beach Park",
  "location": "Santa Cruz, California"
}
```

## Local Environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Set:

```txt
GOOGLE_DRIVE_ROOT_FOLDER_NAME=Photography
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_OAUTH_PORT=53682
```

`GOOGLE_DRIVE_ROOT_FOLDER_ID` is optional but recommended. It is the ID in the Drive folder URL:

```txt
https://drive.google.com/drive/folders/<FOLDER_ID>
```

## Google OAuth Setup

Use a Google Cloud OAuth client for local authentication.

Recommended:

- Application type: Desktop app
- Scope used by the script: `https://www.googleapis.com/auth/drive.readonly`

The first sync opens Google login in your browser. After you approve access, the script stores a local token at:

```txt
.google-drive-token.json
```

That file is ignored by git and should stay private.

## Sync Command

Run:

```bash
npm run sync:drive
```

The script will:

1. Find the root Drive folder.
2. Read every child folder as a collection.
3. Download image files from each collection.
4. Convert them to optimized `.webp` files with `sharp`.
5. Write images to `public/photography/`.
6. Generate `src/data/generated/collections.json`.

The site automatically uses generated Drive collections when that JSON file has entries. If it is empty, the site uses the sample demo collections.

## Reset Login

To reconnect with another Google account:

```bash
npm run sync:drive:reset
```

## Publish Flow

After uploading new folders or photos to Drive:

```bash
npm run publish
```

This runs:

```bash
npm run sync:drive
npm run build
npx vercel@54.15.1 deploy --prod
```
