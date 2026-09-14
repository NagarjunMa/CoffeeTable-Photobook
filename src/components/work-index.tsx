"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { collections } from "@/data/collections";
import type { Collection } from "@/data/collections";
import { DestinationTitle } from "@/components/destination-title";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function posterSources(collection: Collection) {
  return {
    desktop: collection.mapPosterDesktop ?? collection.mapPoster,
    mobile: collection.mapPosterMobile ?? collection.mapPoster,
  };
}

function MapBackdrop({
  collection,
  eager = false,
}: {
  collection: Collection;
  eager?: boolean;
}) {
  const { desktop, mobile } = posterSources(collection);

  if (!desktop && !mobile) {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(125deg,#f5f0e7,#e6e0d5)]" />
    );
  }

  const isSantaCruz = collection.slug === "santa-cruz";

  return (
    <div
      data-city-map
      className={`absolute inset-0 will-change-transform ${isSantaCruz ? "md:-bottom-[8%] md:-right-[18%] md:-top-[8%] md:left-[16%]" : ""}`}
    >
      {mobile ? (
        <Image
          src={mobile.src}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover opacity-[0.76] mix-blend-multiply md:hidden ${isSantaCruz ? "object-[center_38%]" : ""}`}
          loading={eager ? "eager" : "lazy"}
          unoptimized
        />
      ) : null}
      {desktop ? (
        <Image
          src={desktop.src}
          alt=""
          fill
          sizes="100vw"
          className={`hidden object-cover opacity-[0.78] mix-blend-multiply md:block ${isSantaCruz ? "object-[center_38%]" : ""}`}
          loading={eager ? "eager" : "lazy"}
          unoptimized
        />
      ) : null}
    </div>
  );
}

function CityPanel({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const href = `/series/${collection.slug}`;

  return (
    <article
      data-city-panel
      className="relative h-full w-[100cqw] shrink-0 snap-start overflow-hidden bg-[var(--background)]"
    >
      <MapBackdrop collection={collection} eager={index === 0} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,rgb(250_248_242_/_0.97)_21%,rgb(250_248_242_/_0.68)_42%,rgb(250_248_242_/_0.06)_70%)] md:bg-[linear-gradient(90deg,var(--background)_0%,rgb(250_248_242_/_0.96)_16%,rgb(250_248_242_/_0.62)_34%,transparent_61%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />

      <Link href={href} aria-label={`Open ${collection.title} city book`} className="city-panel-link relative z-20 flex h-full items-center px-[clamp(1.4rem,4vw,5rem)] pb-16 pt-24">
        <div data-city-copy className="city-copy pointer-events-none min-w-0 w-full max-w-xl">
          <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] md:text-[11px]">
            {String(index + 1).padStart(2, "0")} / {collection.location}
          </p>
          <div className="mt-5 block">
            <DestinationTitle title={collection.title} />
          </div>
          <p className="mt-7 max-w-md text-[clamp(1rem,1.35vw,1.2rem)] leading-[1.45] text-[#36332d]">
            {collection.note}
          </p>
          <span
            className="editorial-link pointer-events-auto mt-8 font-mono-custom text-[10px] uppercase tracking-[0.18em] md:text-[11px]"
          >
            Open Book
          </span>
        </div>

      </Link>

      <p className="font-mono-custom pointer-events-none absolute bottom-4 right-5 z-20 text-[8px] tracking-[0.08em] text-[#656158] md:bottom-5 md:right-7">
        Map data (c) OpenStreetMap contributors
      </p>
    </article>
  );
}

export function WorkIndex() {
  const scope = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scopeElement = scope.current;
      const pinElement = pin.current;
      const trackElement = track.current;

      if (!scopeElement || !pinElement || !trackElement) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 768px)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop, animate } = context.conditions ?? {};

          if (!desktop) {
            return;
          }

          const distance = () =>
            Math.max(0, trackElement.scrollWidth - pinElement.clientWidth);
          const horizontalTween = gsap.to(trackElement, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pinElement,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: animate ? 0.85 : true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          if (animate) {
            gsap.utils
              .toArray<HTMLElement>("[data-city-panel]")
              .forEach((panel) => {
                const copy = panel.querySelector("[data-city-copy]");
                const map = panel.querySelector("[data-city-map]");

                if (copy) {
                  gsap.from(copy, {
                    autoAlpha: 0,
                    x: 70,
                    duration: 0.65,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: panel,
                      containerAnimation: horizontalTween,
                      start: "left 78%",
                      toggleActions: "play none none reverse",
                    },
                  });
                }

                if (map) {
                  gsap.fromTo(
                    map,
                    { xPercent: 3 },
                    {
                      xPercent: -3,
                      ease: "none",
                      scrollTrigger: {
                        trigger: panel,
                        containerAnimation: horizontalTween,
                        start: "left right",
                        end: "right left",
                        scrub: true,
                      },
                    },
                  );
                }
              });
          }
        },
      );

      const refreshAfterFonts = () => ScrollTrigger.refresh();
      document.fonts.ready.then(refreshAfterFonts);

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="work" ref={scope} className="relative border-t hairline">
      <div
        ref={pin}
        className="no-scrollbar h-svh overflow-x-auto overflow-y-hidden [container-type:inline-size] md:overflow-hidden"
      >
        <div
          ref={track}
          className="flex h-full w-max snap-x snap-mandatory will-change-transform md:snap-none"
        >
          <article className="relative flex h-full w-[100cqw] shrink-0 snap-start items-end overflow-hidden bg-[var(--background)] px-[clamp(1.4rem,4vw,5rem)] pb-[clamp(3rem,8vh,7rem)] pt-24">
            <div className="grid w-full gap-8 md:grid-cols-[minmax(12rem,0.45fr)_minmax(0,1.2fr)] md:items-end">
              <p className="font-mono-custom text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Selected Places / {String(collections.length).padStart(2, "0")}
              </p>
              <div>
                <h2 className="font-display text-[clamp(4.8rem,11vw,12rem)] font-medium leading-[0.78]">
                  City Books
                </h2>
                <p className="mt-7 max-w-2xl text-balance text-[clamp(1.15rem,2vw,1.8rem)] leading-[1.3] text-[#34312b]">
                  Places held as individual volumes. Move across the exhibition,
                  then open a city to read its photographs vertically.
                </p>
              </div>
            </div>
            <p className="font-mono-custom absolute bottom-5 right-6 text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Scroll to explore
            </p>
          </article>

          {collections.map((collection, index) => (
            <CityPanel
              key={collection.slug}
              collection={collection}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
