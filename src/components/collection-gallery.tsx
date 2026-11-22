"use client";

import { ThinkingOrb } from "thinking-orbs";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import { GalleryFrame } from "@/components/gallery-frame";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { DestinationTitle } from "@/components/destination-title";
import { ArrowLeft, ArrowDown, ArrowUpRight } from "lucide-react";
import { collections } from "@/data/collections";
import type {
  Collection,
  PortfolioImage,
} from "@/data/collections";


export type LightboxOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ExhibitionItem = {
  photo: PortfolioImage;
  index: number;
};

const isTall = (photo?: PortfolioImage) =>
  photo?.orientation === "portrait" || photo?.orientation === "square";

const photoRatio = (photo: PortfolioImage) => photo.width / photo.height;

const exhibitionRowStyle = (row: ExhibitionItem[]): CSSProperties => {
  const ratioTotal = row.reduce(
    (total, { photo }) => total + photoRatio(photo),
    0,
  );

  return {
    "--row-image-height": `min(78svh, calc((100cqw - (${row.length - 1} * var(--row-gap)) - (${row.length * 2} * var(--frame-mat))) / ${ratioTotal.toFixed(4)}))`,
  } as CSSProperties;
};

const exhibitionItemStyle = (photo: PortfolioImage): CSSProperties => {
  const ratio = photoRatio(photo);

  return {
    "--exhibition-frame-width": `calc((var(--row-image-height) * ${ratio.toFixed(4)}) + (2 * var(--frame-mat)))`,
    "--exhibition-mobile-frame-width": `calc(${(ratio * 78).toFixed(2)}svh + (2 * var(--frame-mat)))`,
  } as CSSProperties;
};

function buildExhibitionRows(images: PortfolioImage[]) {
  const rows: ExhibitionItem[][] = [];
  let index = 0;

  while (index < images.length) {
    const current = images[index];
    const next = images[index + 1];
    const third = images[index + 2];

    if (isTall(current) && isTall(next) && isTall(third)) {
      rows.push([
        { photo: current, index },
        { photo: next, index: index + 1 },
        { photo: third, index: index + 2 },
      ]);
      index += 3;
      continue;
    }

    if (next) {
      rows.push([
        { photo: current, index },
        { photo: next, index: index + 1 },
      ]);

      index += 2;
      continue;
    }

    rows.push([{ photo: current, index }]);
    index += 1;
  }

  return rows;
}

export function CollectionGallery({ collection }: { collection: Collection }) {
  const scope = useRef<HTMLElement>(null);
  const loadingScreen = useRef<HTMLDivElement>(null);
  const [loadingPhase, setLoadingPhase] = useState<"loading" | "slow" | "ready">(
    collection.images.length > 0 ? "loading" : "ready",
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<LightboxOrigin | null>(null);
  const previewImage =
    collection.coverImages[0] ?? collection.images.find(
      (photo) =>
        photo.orientation === "portrait" || photo.orientation === "square",
    ) ?? collection.images[0];
  const previewIndex = previewImage
    ? collection.images.findIndex((photo) => photo.id === previewImage.id)
    : -1;
  const currentCollectionIndex = collections.findIndex(
    (item) => item.slug === collection.slug,
  );
  const nextCollection =
    collections[(currentCollectionIndex + 1) % collections.length];
  const exhibitionRows = collection.spreads?.length
    ? collection.spreads.map((ids) => ids.flatMap((id) => {
      const index = collection.images.findIndex((image) => image.id === id);
      return index < 0 ? [] : [{ photo: collection.images[index], index }];
    })).filter((row) => row.length > 0)
    : buildExhibitionRows(collection.images);
  const category = collection.year === "Field Notes" ? collection.category : collection.year ?? collection.category;
  const note = collection.note.startsWith("A field study from ") ? "" : collection.note;
  const experience = collection.experience ?? (note ? {
    title: `Notes from ${collection.title}`,
    subtitle: undefined,
    paragraphs: [note],
  } : undefined);

  useEffect(() => {
    const picture = scope.current?.querySelector<HTMLImageElement>(".collection-preview img");
    if (!picture) return;
    let active = true;
    const settle = async () => {
      if (picture.naturalWidth > 0) await picture.decode().catch(() => {});
      if (active) setLoadingPhase("ready");
    };
    picture.addEventListener("load", settle);
    picture.addEventListener("error", settle);
    // A cached cover may finish before hydration attaches these listeners.
    if (picture.complete) void settle();
    const timeout = window.setTimeout(() => setLoadingPhase((phase) =>
      phase === "loading" ? "slow" : phase,
    ), 12_000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      picture.removeEventListener("load", settle);
      picture.removeEventListener("error", settle);
    };
  }, [collection.slug]);

  useEffect(() => {
    const waiting = loadingPhase !== "ready";
    // Hydration can arrive after the CSS-only fallback has already revealed the book.
    if (waiting && loadingScreen.current && getComputedStyle(loadingScreen.current).visibility === "hidden") {
      setLoadingPhase("ready");
      return;
    }
    const header = document.querySelector<HTMLElement>(".site-header");
    const section = scope.current;
    if (section) section.inert = waiting;
    if (header) header.inert = waiting;
    document.body.classList.toggle("collection-is-loading", waiting);
    return () => {
      if (section) section.inert = false;
      if (header) header.inert = false;
      document.body.classList.remove("collection-is-loading");
    };
  }, [loadingPhase]);

  const openLightbox = (index: number, element: HTMLElement) => {
    // Safari does not focus buttons on pointer activation by default.
    element.focus({ preventScroll: true });
    const rect = element.getBoundingClientRect();
    setOrigin({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    setActiveIndex(index);
  };

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return null;
      }

      return (current - 1 + collection.images.length) % collection.images.length;
    });
  }, [collection.images.length]);
  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return null;
      }

      return (current + 1) % collection.images.length;
    });
  }, [collection.images.length]);

  const activePhoto =
    activeIndex === null ? null : collection.images[activeIndex];

  return (
    <>
      {loadingPhase !== "ready" && (
        <div ref={loadingScreen} className="collection-loading-screen" role="status" aria-live="polite">
          <ThinkingOrb state="searching" size={64} theme="light" aria-hidden="true" />
          <p className="collection-loading-label">
            {loadingPhase === "slow" ? "Photographs are taking longer than expected" : "Preparing photographs"}
          </p>
          {loadingPhase === "slow" && (
            <button type="button" className="collection-loading-continue" onClick={() => setLoadingPhase("ready")}>
              Continue to photobook
            </button>
          )}
        </div>
      )}
      <noscript><style>{".collection-loading-screen { display: none; }"}</style></noscript>
      <section ref={scope} className="photobook-journal">
        <article className="hero collection-opening" data-enter aria-labelledby={`title-${collection.slug}`}>
          <div className="wrap">
            <div className="collection-topline">
              <a href={`/#city-${collection.slug}`} className="collection-index editorial-link"><ArrowLeft size={16} aria-hidden="true" /> All photobooks</a>
              <p>Volume {String(currentCollectionIndex + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}</p>
            </div>
            <div className="collection-opening-spread">
              <div className="collection-opening-copy">
                <p className="section-label">{[collection.location, category].filter(Boolean).join(" · ")}</p>
                <div id={`title-${collection.slug}`}><DestinationTitle title={collection.title} as="h1" /></div>
                {note && <p className="collection-introduction">{note}</p>}
                <p className="collection-count">{collection.images.length} photographs by Nagarjun Mallesh</p>
                <div className="collection-actions btn-row">
                  <a className="btn btn--primary" href={`#gallery-${collection.slug}`}>See photographs <ArrowDown className="m-arrow" size={18} aria-hidden="true" /></a>
                  {experience && <a className="link" aria-label="Read the story" href={`#experience-${collection.slug}`}>Read the story</a>}
                </div>
              </div>
              {previewImage && <figure className="collection-preview" style={{ "--preview-ratio": photoRatio(previewImage) } as CSSProperties}>
                <div className="collection-preview-stage group">
                  <PortfolioPhoto photo={previewImage} sizes="(min-width: 1024px) 50vw, 90vw" className="collection-preview-photo" loading="eager" fetchPriority="high" />
                  <button type="button" className="photo-open" data-open-photo aria-label={`Open ${previewImage.alt} full screen`} onClick={event => openLightbox(previewIndex, event.currentTarget)} />
                </div>
              </figure>}
            </div>
          </div>
        </article>

        {experience && <section className="personal-story" aria-labelledby={`experience-${collection.slug}`}>
          <div className="wrap personal-story-spread">
            <header className="personal-story-heading">
              <p className="section-label">The experience</p>
              <h2 id={`experience-${collection.slug}`}>{experience.title}</h2>
              {experience.subtitle && <p>{experience.subtitle}</p>}
            </header>
            <div className="personal-story-columns">
              {experience.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </div>
        </section>}

        <section className="collection-gallery" aria-labelledby={`gallery-${collection.slug}`}>
          <div className="wrap">
            <header className="gallery-heading">
              <h2 id={`gallery-${collection.slug}`}>Gallery</h2>
              <p>{collection.images.length} photographs <span aria-hidden="true">·</span> Select a photograph to view full screen</p>
            </header>
            {collection.images.length === 0 && <p>This volume is being prepared.</p>}
            <div className="gallery-spreads">
              {exhibitionRows.map(row => <div key={row[0].photo.id} className="exhibition-row items-start" style={exhibitionRowStyle(row)}>
                {row.map(({ photo, index }) => <GalleryFrame key={photo.id} index={index} style={exhibitionItemStyle(photo)}>
                  <div className="exhibition-frame flex w-full cursor-zoom-in items-center justify-center border-0" data-moment={index === 0 ? "picture-develops" : undefined} data-moment-opts={index === 0 ? '{"look":"film"}' : undefined}>
                    <PortfolioPhoto photo={photo} sizes={row.length === 3 ? "(min-width: 768px) 34vw, 100vw" : row.length === 2 ? "(min-width: 768px) 60vw, 100vw" : "100vw"}
                      className="exhibition-photo h-auto max-h-[78svh] w-auto max-w-full select-none object-contain"
                      loading="lazy" fetchPriority="low" />
                    <button type="button" className="photo-open" data-open-photo aria-label={`Open ${photo.alt} full screen`} onClick={event => openLightbox(index, event.currentTarget)} />
                  </div>
                </GalleryFrame>)}
              </div>)}
            </div>
          </div>
        </section>
        <footer className="collection-end">
          <div className="wrap">
            <div><p className="section-label">End of {collection.title}</p><a href={`/#city-${collection.slug}`} className="editorial-link">All photobooks <ArrowUpRight size={20} aria-hidden="true" /></a></div>
            {nextCollection && <div><p className="section-label">Next photobook</p><Link href={`/series/${nextCollection.slug}`} className="editorial-link">{nextCollection.title} <ArrowUpRight size={20} aria-hidden="true" /></Link></div>}
          </div>
        </footer>
      </section>

      {activePhoto && activeIndex !== null ? (
        <PhotoLightbox
          photo={activePhoto}
          current={activeIndex}
          total={collection.images.length}
          origin={origin}
          onClose={closeLightbox}
          onNext={showNext}
          onPrevious={showPrevious}
        />
      ) : null}
    </>
  );
}
