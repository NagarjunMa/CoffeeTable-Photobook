"use client";

/**
 * Adapted from Skiper UI 54 / Carousel_006, by @gurvinder-singh02.
 * https://skiper-ui.com/v1/skiper54 — free personal and commercial use with attribution.
 * The original centered, clipped-image carousel uses Motion and Embla.
 * This adaptation uses the project's GSAP for masks and preserves private photo delivery.
 */
import { useGSAP } from "@gsap/react";
import useEmblaCarousel from "embla-carousel-react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import type { Collection, PortfolioImage } from "@/data/types";

gsap.registerPlugin(useGSAP);

type Volume = {
  collection: Collection;
  cover?: PortfolioImage;
  count: string;
};

export function Skiper54({ items, selectedIndex, onSelect, onOpen }: {
  items: Volume[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpen: (index: number, trigger: HTMLElement) => void;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const [viewport, api] = useEmblaCarousel({ loop: true, align: "center", watchFocus: false });

  useEffect(() => {
    if (!api) return;
    // Hydration removes the static rail's centering padding; measure that layout.
    api.reInit();
    const select = () => onSelect(api.selectedScrollSnap());
    api.on("select", select);
    return () => { api.off("select", select); };
  }, [api, onSelect]);

  useEffect(() => {
    if (api && api.selectedScrollSnap() !== selectedIndex) {
      api.scrollTo(selectedIndex, matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, [api, selectedIndex]);

  useGSAP(() => {
    if (!api) return;
    const panels = gsap.utils.toArray<HTMLElement>(".skiper-image-window", scope.current);
    const media = gsap.matchMedia();
    media.add({ reduce: "(prefers-reduced-motion: reduce)", animate: "(prefers-reduced-motion: no-preference)" }, context => {
      const reduce = Boolean(context.conditions?.reduce);
      // Embla callbacks belong to this media context, never its parent context.
      const paint = () => { context.add(() => {
        const selected = api.selectedScrollSnap();
        gsap.to(panels, {
          clipPath: index => index === selected ? "inset(0% 0% 0% 0% round 16px)" : "inset(13% 0% 13% 0% round 16px)",
          duration: reduce ? 0 : 0.8, ease: "expo.out", overwrite: "auto",
        });
      }); };
      paint();
      api.on("select", paint);
      api.on("reInit", paint);
      if (reduce) api.scrollTo(api.selectedScrollSnap(), true);
      return () => { api.off("select", paint); api.off("reInit", paint); };
    });
    return () => media.revert();
  }, { scope, dependencies: [api], revertOnUpdate: true });

  useEffect(() => {
    const element = api?.rootNode();
    if (!element || !api) return;
    let accumulated = 0;
    let previous = 0;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.ctrlKey) return;
      event.preventDefault();
      if (event.timeStamp - previous > 180) accumulated = 0;
      previous = event.timeStamp;
      accumulated += event.deltaX;
      if (Math.abs(accumulated) < 40) return;
      const jump = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (accumulated > 0) api.scrollNext(jump);
      else api.scrollPrev(jump);
      accumulated = 0;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [api]);

  return <div ref={scope} className="photobook-carousel" role="region" aria-roledescription="carousel" aria-label="Photobook collections" data-enhanced={api ? "true" : undefined}>
    <div ref={viewport} className="photobook-carousel-viewport" onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (selectedIndex + (event.key === "ArrowRight" ? 1 : items.length - 1)) % items.length;
      onSelect(next);
      scope.current?.querySelectorAll<HTMLAnchorElement>(".photobook-card-link")[next]?.focus({ preventScroll: true });
    }}>
      <div className="photobook-carousel-track">
        {items.map(({ collection, cover }, index) => <article className="photobook-card" key={collection.slug} data-selected={index === selectedIndex ? "true" : undefined} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}: ${collection.title}`}>
          <div className="skiper-image-window">
            <div className="photobook-image-mat">
              {cover ? <PortfolioPhoto photo={cover} sizes="(min-width: 1440px) 560px, (min-width: 768px) 42vw, 82vw" loading="eager" /> : <div className="photobook-empty"><p className="font-display">{collection.title}</p><span>Photographs in preparation</span></div>}
            </div>
          </div>
          <Link href={`/series/${collection.slug}`} className="photobook-card-link" aria-label={`Preview ${collection.title} photobook`} onFocus={() => onSelect(index)} onClick={event => {
            if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            onOpen(index, event.currentTarget);
          }}>
            <span className="photobook-card-open"><ArrowUpRight size={23} aria-hidden="true" /></span>
          </Link>
        </article>)}
      </div>
    </div>
  </div>;
}
