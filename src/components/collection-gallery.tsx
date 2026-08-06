"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PhotoLightbox } from "@/components/photo-lightbox";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<LightboxOrigin | null>(null);
  const previewImage =
    collection.images.find(
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
  const exhibitionRows = buildExhibitionRows(collection.images);

  const openLightbox = (index: number, element: HTMLElement) => {
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
            autoAlpha: 0,
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
      <section
        ref={scope}
        className="city-book-texture relative overflow-x-clip bg-[#090908] text-[#f1efe9]"
      >
        <article
          data-book-spread
          className="site-gutter grid min-h-svh items-center gap-12 pb-16 pt-28 md:grid-cols-[minmax(8rem,0.3fr)_minmax(24rem,0.95fr)_minmax(18rem,0.55fr)] md:gap-10 md:pb-20"
        >
          <div className="self-start pt-3 md:pt-[14vh]">
            <Link
              href="/#work"
              className="editorial-link font-mono-custom text-[11px] uppercase tracking-[0.18em] text-white/50"
            >
              Index
            </Link>
          </div>

          <div className="max-w-4xl self-center">
            <p className="font-mono-custom mb-4 text-[10px] uppercase tracking-[0.18em] text-white/45 md:text-[11px]">
              {collection.location} / {collection.year}
            </p>
            <h1
              className={`font-display max-w-[7ch] font-medium leading-[0.78] text-[#f5f2eb] md:text-[clamp(5rem,11vw,11rem)] ${
                collection.title.length > 9
                  ? "text-[3.35rem] sm:text-[4rem]"
                  : "text-[5rem]"
              }`}
            >
              {collection.title}
            </h1>
            <p className="mt-8 max-w-2xl text-balance text-[clamp(1.15rem,2vw,1.75rem)] leading-[1.3] text-white/68">
              {collection.note}
            </p>
          </div>

          {previewImage ? (
            <figure className="self-center">
              <button
                type="button"
                aria-label={`Open ${previewImage.alt} full screen`}
                onClick={(event) =>
                  openLightbox(previewIndex, event.currentTarget)
                }
                className="group ml-auto block w-[min(72vw,25rem)] cursor-zoom-in border-0 bg-transparent p-0 text-left"
              >
                <Image
                  src={previewImage.src}
                  alt={previewImage.alt}
                  width={previewImage.width}
                  height={previewImage.height}
                  sizes="25rem"
                  className="h-auto max-h-[60vh] w-auto max-w-full object-contain shadow-[0_1.4rem_4rem_rgb(0_0_0_/_0.4)] transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                  loading="eager"
                  unoptimized
                />
              </button>
              <figcaption className="font-mono-custom mt-4 text-right text-[10px] uppercase tracking-[0.16em] text-white/40">
                Preview / {String(collection.images.length).padStart(2, "0")} frames
              </figcaption>
            </figure>
          ) : null}
        </article>

        <div className="border-t border-white/10 px-[clamp(1rem,4vw,5rem)] py-[clamp(3.5rem,8vw,8rem)] text-[var(--gallery-ink)]">
          <div className="mx-auto max-w-[96rem]">
            <header className="mb-[clamp(4rem,9vw,9rem)] grid gap-5 border-b border-white/15 pb-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="font-mono-custom text-[9px] uppercase tracking-[0.16em] text-white/45">
                  {collection.location} / {collection.year}
                </p>
                <h2 className="font-display mt-4 text-[clamp(2.8rem,5vw,5rem)] font-medium leading-none">
                  Gallery
                </h2>
              </div>
              <p className="font-mono-custom text-[9px] uppercase tracking-[0.16em] text-white/45">
                {String(collection.images.length).padStart(2, "0")} photographs
              </p>
            </header>

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
                      <button
                        type="button"
                        aria-label={`Open ${photo.alt} full screen`}
                        onClick={(event) =>
                          openLightbox(index, event.currentTarget)
                        }
                        className="exhibition-frame flex w-full cursor-zoom-in items-center justify-center border-0"
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          sizes={
                            row.length === 3
                              ? "(min-width: 768px) 34vw, 100vw"
                              : row.length === 2
                                ? "(min-width: 768px) 60vw, 100vw"
                                : "100vw"
                          }
                          className="exhibition-photo h-auto max-h-[78svh] w-auto max-w-full select-none object-contain transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.003] group-hover:brightness-[1.025]"
                          priority={index < 2}
                          unoptimized
                        />
                      </button>
                      <figcaption className="mt-4 flex items-start justify-between gap-4 border-t border-white/12 pt-2 text-white/70">
                        <span className="font-display text-[12px] leading-4">
                          Frame {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono-custom text-right text-[8px] uppercase tracking-[0.12em] text-white/35">
                          {photo.orientation}
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

        <footer className="site-gutter grid min-h-[55svh] items-end gap-14 border-t border-white/10 pb-16 pt-24 md:grid-cols-2 md:pb-20">
          <div>
            <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-white/40">
              End of volume
            </p>
            <Link
              href="/#work"
              className="editorial-link mt-5 font-display text-[clamp(2.8rem,5vw,5rem)] leading-none"
            >
              City Index
            </Link>
          </div>

          {nextCollection ? (
            <div className="md:text-right">
              <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-white/40">
                Next volume
              </p>
              <Link
                href={`/series/${nextCollection.slug}`}
                className="editorial-link mt-5 font-display text-[clamp(2.8rem,5vw,5rem)] leading-none"
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
