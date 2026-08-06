export type PortfolioImage = {
  id: string;
  fileName: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape" | "square";
};

export type MapPoster = {
  src: string;
  alt: string;
};

export type Collection = {
  title: string;
  slug: string;
  location: string;
  year: string;
  note: string;
  mapPoster?: MapPoster;
  mapPosterDesktop?: MapPoster;
  mapPosterMobile?: MapPoster;
  sourceFolderId?: string;
  coverImages: PortfolioImage[];
  images: PortfolioImage[];
};
