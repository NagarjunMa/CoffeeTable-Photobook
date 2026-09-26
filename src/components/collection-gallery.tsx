"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ThinkingOrb } from "thinking-orbs";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { DestinationTitle } from "@/components/destination-title";
import { collections } from "@/data/collections";
import type {
  Collection,
  PortfolioImage,
} from "@/data/collections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

  useEffect(() => {
    const pictures = [...(scope.current?.querySelectorAll<HTMLImageElement>("img") ?? [])];
    if (pictures.length === 0) return;

    let settled = 0;
    const cleanups = pictures.map((picture) => {
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        settled += 1;
        if (settled === pictures.length) setLoadingPhase("ready");
      };

      picture.addEventListener("load", settle);
      picture.addEventListener("error", settle);
      // A cached image may finish before hydration attaches these listeners.
      if (picture.complete) settle();
      return () => {
        picture.removeEventListener("load", settle);
        picture.removeEventListener("error", settle);
      };
    });

    const timeout = window.setTimeout(() => setLoadingPhase((phase) =>
      phase === "loading" ? "slow" : phase,
    ), 12_000);

    return () => {
      window.clearTimeout(timeout);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [collection.slug]);

  useEffect(() => {
    const waiting = loadingPhase !== "ready";
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

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.set("[data-book-spread]", { autoAlpha: 1, y: 0 });

      if (reduceMotion) {
        return;
      }

      gsap.utils
        .toArray<HTMLElement>("[data-book-spread]")
        .forEach((spread) => {
          gsap.from(spread, {
            y: 34,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: spread,
              start: "top 88%",
              once: true,
            },
          });
        });
    },
    { scope },
  );

  const activePhoto =
    activeIndex === null ? null : collection.images[activeIndex];

  return (
    <>
      {loadingPhase !== "ready" && (
        <div className="collection-loading-screen" role="status" aria-live="polite">
          <ThinkingOrb state="searching" size={64} theme="dark" aria-hidden="true" />
          <p className="font-mono-custom text-xs uppercase tracking-[0.16em]">
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
      <section
        ref={scope}
        className="city-book-texture relative text-[var(--gallery-ink)]"
      >
        <article
          data-book-spread
          className="collection-opening site-gutter"
        >
          <div className="collection-index">
            <a
              href={`/#city-${collection.slug}`}
              className="editorial-link font-mono-custom text-[13px] uppercase text-[var(--gallery-secondary)]"
            >
              Index
            </a>
          </div>

          <div className="min-w-0 max-w-4xl self-center">
            <p className="font-mono-custom mb-4 text-[10px] uppercase tracking-[0.18em] text-white/45 md:text-[11px]">
              {[collection.location, category].filter(Boolean).join(" / ")}
            </p>
            <DestinationTitle title={collection.title} as="h1" />
            {note && <p className="mt-8 max-w-2xl text-balance text-lg leading-relaxed text-[var(--gallery-secondary)] md:text-xl">{note}</p>}
          </div>

          {previewImage ? (
            <figure className="collection-preview" style={{ "--preview-ratio": photoRatio(previewImage) } as CSSProperties}>
              <div
                className="collection-preview-stage group"
              >
                <PortfolioPhoto
                  photo={previewImage}
                  sizes="(min-width: 1280px) 42vw, (min-width: 768px) 45vw, 92vw"
                  className="collection-preview-photo shadow-[0_1.4rem_4rem_rgb(0_0_0_/_0.4)] transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                  loading="eager"
                  fetchPriority="high"
                />
                <button type="button" className="photo-open" data-open-photo aria-label={`Open ${previewImage.alt} full screen`} onClick={(event) => openLightbox(previewIndex, event.currentTarget)} />
              </div>
              <figcaption className="font-mono-custom uppercase">
                Preview / {String(collection.images.length).padStart(2, "0")} frames
              </figcaption>
            </figure>
          ) : null}
        </article>

        {collection.experience && (
          <section
            data-book-spread
            className="personal-story site-gutter border-t border-white/10 py-[clamp(5rem,12vw,10rem)]"
            aria-labelledby={`experience-${collection.slug}`}
          >
            <div className="mx-auto grid max-w-[96rem] gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16">
              <h2
                id={`experience-${collection.slug}`}
                className="font-display max-w-[10ch] text-[clamp(3.5rem,6vw,6rem)] font-medium leading-[0.95]"
              >
                {collection.experience.title}
              </h2>
              <div className="max-w-[68ch] space-y-7 text-[var(--gallery-secondary)]">
                {collection.experience.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={index === 0
                      ? "font-display text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.3] text-[var(--gallery-ink)]"
                      : "text-base leading-[1.8] md:text-lg"}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="border-t border-white/10 px-[clamp(1rem,4vw,5rem)] py-12 md:py-16 text-[var(--gallery-ink)]">
          <div className="mx-auto max-w-[96rem]">
            <header className="mb-12 md:mb-16 grid gap-5 border-b border-white/15 pb-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="font-mono-custom text-[9px] uppercase tracking-[0.16em] text-white/45">
                  {[collection.location, category].filter(Boolean).join(" / ")}
                </p>
                <h2 className="font-display mt-4 text-5xl md:text-7xl font-medium leading-none">
                  Gallery
                </h2>
              </div>
              <p className="font-mono-custom text-[9px] uppercase tracking-[0.16em] text-white/45">
                {String(collection.images.length).padStart(2, "0")} photographs
              </p>
            </header>

            {collection.images.length === 0 && <p className="text-[var(--gallery-secondary)]">This volume is being prepared.</p>}
            <div className="space-y-[clamp(2.5rem,5vw,5.5rem)]">
            {exhibitionRows.map((row) => (
              <div
                key={row[0].photo.id}
                data-book-spread
                className="exhibition-row items-start"
                style={exhibitionRowStyle(row)}
              >
                {row.map(({ photo, index }) => (
                  <figure
                    key={photo.id}
                    className="exhibition-item group relative min-h-0 min-w-0"
                    style={exhibitionItemStyle(photo)}
                  >
                    <div
                      className="exhibition-frame-group mx-auto max-w-full"
                    >
                      <div
                        className="exhibition-frame flex w-full cursor-zoom-in items-center justify-center border-0"
                      >
                        <PortfolioPhoto
                          photo={photo}
                          sizes={
                            row.length === 3
                              ? "(min-width: 768px) 34vw, 100vw"
                              : row.length === 2
                                ? "(min-width: 768px) 60vw, 100vw"
                                : "100vw"
                          }
                          className="exhibition-photo h-auto max-h-[78svh] w-auto max-w-full select-none object-contain transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.003] group-hover:brightness-[1.025]"
                          loading="eager"
                          fetchPriority={index < 2 ? "auto" : "low"}
                        />
                        <button type="button" className="photo-open" data-open-photo aria-label={`Open ${photo.alt} full screen`} onClick={(event) => openLightbox(index, event.currentTarget)} />
                      </div>
                      <figcaption className="mt-4 flex items-start justify-between gap-4 border-t border-white/12 pt-2 text-white/70">
                        <span className="font-display text-[12px] leading-4">
                          {photo.caption ?? `Frame ${String(index + 1).padStart(2, "0")}`}
                        </span>
                      </figcaption>
                    </div>
                  </figure>
                ))}
              </div>
            ))}
            </div>
          </div>
        </div>

        <footer className="site-gutter grid items-end gap-14 border-t border-white/10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-white/40">
              End of volume
            </p>
            <a
              href={`/#city-${collection.slug}`}
              className="editorial-link mt-5 font-display text-4xl md:text-6xl leading-none"
            >
              City Index
            </a>
          </div>

          {nextCollection ? (
            <div className="md:text-right">
              <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-white/40">
                Next volume
              </p>
              <Link
                href={`/series/${nextCollection.slug}`}
                className="editorial-link mt-5 font-display text-4xl md:text-6xl leading-none break-words"
              >
                {nextCollection.title}
              </Link>
            </div>
          ) : null}
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
