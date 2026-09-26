export type PortfolioImage = {
  id: string;
  fileName: string;
  alt: string;
  caption?: string;
  src: string;
  cloudflareImageId?: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
};

export type MapPresentation = {
  /** Horizontal and vertical percentages from 0 to 100, for example "60% 40%". */
  focalPosition?: string;
  /** Scrim opacity from 0 (transparent) to 1 (opaque). */
  scrim?: number;
};

export type MapPoster = MapPresentation & {
  src: string;
  alt: string;
  sources?: { src: string; width: number }[];
};

export type Collection = {
  title: string;
  slug: string;
  location: string;
  year?: string;
  category?: string;
  note: string;
  /** Optional short introduction for the viewport-height destination panel. */
  indexNote?: string;
  /** Photographer-authored account shown between a collection opening and its gallery. */
  experience?: { title: string; subtitle?: string; paragraphs: string[] };
  mapPoster?: MapPoster;
  mapPosterDesktop?: MapPoster;
  mapPosterMobile?: MapPoster;
  /** Retained even when map assets come from a separate manifest. */
  mapPresentation?: { desktop?: MapPresentation; mobile?: MapPresentation };
  /** Map is the default for existing place collections; illustration suppresses map attribution. */
  introArtworkType?: "map" | "illustration";
  sourceFolderId?: string;
  coverImages: PortfolioImage[];
  images: PortfolioImage[];
  /** Ordered image IDs; each resolved spread contains one to three images. */
  spreads?: string[][];
};
