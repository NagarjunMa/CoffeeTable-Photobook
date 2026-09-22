"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import mapManifest from "@/data/map-derivatives.json";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { collections } from "@/data/collections";
import type { Collection } from "@/data/collections";
import { DestinationTitle } from "@/components/destination-title";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MapCandidate = { src: string; width: number; height: number };
type MapVariant = { fallback: MapCandidate | null; candidates: MapCandidate[]; objectPosition: string; source: { path: string; kind: string } | null };
const preparedMaps = mapManifest.collections as Record<string, { desktop: MapVariant; mobile: MapVariant }>;

function mapSource(collection: Collection, device: "desktop" | "mobile") {
  const poster = (device === "desktop" ? collection.mapPosterDesktop : collection.mapPosterMobile) ?? collection.mapPoster;
  const prepared = preparedMaps[collection.slug]?.[device];
  // A newly supplied source must never silently display an older derivative.
  const matches = !poster || prepared?.source?.path === "public" + poster.src;
  if (prepared?.fallback && matches) return {
    ...prepared.fallback,
    srcSet: prepared.candidates.map((candidate) => candidate.src + " " + candidate.width + "w").join(", "),
    focalPosition: collection.mapPresentation?.[device]?.focalPosition ?? poster?.focalPosition ?? prepared.objectPosition,
  };
  return poster ? {
    src: poster.src,
    width: undefined,
    height: undefined,
    srcSet: poster.sources?.map((item) => item.src + " " + item.width + "w").join(", "),
    focalPosition: collection.mapPresentation?.[device]?.focalPosition ?? poster.focalPosition ?? "50% 50%",
  } : null;
}

function CollectionBackdrop({ collection, eager = false }: { collection: Collection; eager?: boolean }) {
  const desktop = mapSource(collection, "desktop");
  const mobile = mapSource(collection, "mobile") ?? desktop;
  if (!mobile) return null;
  const style = {
    "--map-position-mobile": mobile.focalPosition,
    "--map-position-desktop": desktop?.focalPosition ?? mobile.focalPosition,
  } as CSSProperties;
  return (
    <div data-city-map className={"absolute inset-0 " + (collection.slug === "santa-cruz" ? "md:-bottom-[8%] md:-right-[18%] md:-top-[8%] md:left-[16%]" : "")} style={style}>
      <picture>
        {desktop && <source media="(min-width: 768px)" srcSet={desktop.srcSet ?? desktop.src} sizes="100vw" />}
        {/* Prepared map derivatives are already optimized; only one responsive image is mounted. */}
        <img src={mobile.src} srcSet={mobile.srcSet} sizes="100vw" width={mobile.width} height={mobile.height} alt="" className="city-map-image" loading={eager ? "eager" : "lazy"} decoding="async" />
      </picture>
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
  const note = collection.indexNote ?? collection.note;
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  return (
    <article
      id={`city-${collection.slug}`}
      style={{ "--copy-scrim-mobile": collection.mapPresentation?.mobile?.scrim ?? 0.94, "--copy-scrim-desktop": collection.mapPresentation?.desktop?.scrim ?? 0.96 } as CSSProperties}
      data-city-panel
      className="relative h-full w-[100cqw] shrink-0 snap-start overflow-hidden bg-[var(--background)]"
    >
      <CollectionBackdrop collection={collection} eager={index === 0} />
      <div className="city-map-scrim pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />

      <Link href={href} aria-label={`Open ${collection.title} collection`} className="city-panel-link relative z-20 flex h-full items-center px-[clamp(1.4rem,4vw,5rem)] pb-16 pt-24"
        onPointerDown={(event) => { gesture.current = { x: event.clientX, y: event.clientY, moved: false }; }}
        onPointerMove={(event) => { if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 12) gesture.current.moved = true; }}
        onPointerCancel={() => { if (gesture.current) gesture.current.moved = true; }}
        onClick={(event) => { if (event.detail !== 0 && gesture.current?.moved) event.preventDefault(); gesture.current = null; }}>
        <div data-city-copy className="city-copy pointer-events-none min-w-0 w-full max-w-xl">
          <p className="font-mono-custom text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] md:text-[11px]">
            {String(index + 1).padStart(2, "0")} / {collection.location}
          </p>
          <div className="mt-5 block">
            <DestinationTitle title={collection.title} />
          </div>
          {!note.startsWith("A field study from ") && <p className="mt-7 max-w-md text-base md:text-lg leading-[1.45] text-[var(--foreground)]">
            {note}
          </p>}
          <span
            className="editorial-link pointer-events-auto mt-8 font-mono-custom text-[10px] uppercase tracking-[0.18em] md:text-[11px]"
          >
            Open Book
          </span>
        </div>

      </Link>

      {collection.introArtworkType !== "illustration" && (mapSource(collection, "desktop") || mapSource(collection, "mobile")) && <p className="font-mono-custom pointer-events-none absolute bottom-4 right-5 z-20 text-[10px] text-[var(--foreground)] bg-[var(--background)] px-2 py-1 md:bottom-5 md:right-7">
        Map data (c) OpenStreetMap contributors
      </p>}
    </article>
  );
}

export function WorkIndex() {
  const scope = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const navigate = useRef<(index: number, push: boolean) => void>(() => {});
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const section = scope.current;
    const scroller = pin.current;
    const rail = track.current;
    if (!section || !scroller || !rail || !collections.length) return;
    let alive = true;
    const mm = gsap.matchMedia();
    mm.add({
      all: "all",
      desktop: "(min-width: 768px) and (min-height: 640px)",
      reduce: "(prefers-reduced-motion: reduce)",
      short: "(max-height: 639px)",
    }, (context) => {
      const { desktop, reduce, short } = context.conditions ?? {};
      const flow = Boolean(reduce || short);
      const panels = Array.from(rail.querySelectorAll<HTMLElement>("[data-city-panel]"));
      let disposed = false;
      let navigating = false;
      let ready = false;
      let current = -1;
      let unlockFrame = 0;
      const setPosition = (index: number, updateUrl: boolean) => {
        const bounded = Math.max(0, Math.min(collections.length - 1, index));
        if (current === bounded) return;
        current = bounded;
        setActive(bounded);
        if (ready && updateUrl && !navigating) {
          history.replaceState(history.state, "", "#city-" + collections[bounded].slug);
        }
      };
      let tween: gsap.core.Tween | undefined;
      if (desktop && !flow) {
        const distance = () => Math.max(0, rail.scrollWidth - scroller.clientWidth);
        tween = gsap.to(rail, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: scroller, start: "top top", end: () => "+=" + distance(),
            pin: true, scrub: 0.85, invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (self.isActive) setPosition(Math.round(self.progress * (panels.length - 1)), true);
            },
          },
        });
      }
      const scrollRoot = (top: number) => {
        window.scrollTo({ top, behavior: "instant" });
        window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { top } }));
        ScrollTrigger.update();
      };
      navigate.current = (index, push) => {
        const target = Math.max(0, Math.min(panels.length - 1, index));
        navigating = true;
        if (push) history.pushState(history.state, "", "#city-" + collections[target].slug);
        const trigger = tween?.scrollTrigger;
        if (trigger) {
          scrollRoot(trigger.start + target * scroller.clientWidth);
          trigger.getTween()?.progress(1);
        } else if (flow) {
          const contentsHeight = scroller.querySelector(".destination-contents")?.getBoundingClientRect().height ?? 0;
          scrollRoot(panels[target].getBoundingClientRect().top + window.scrollY - 64 - contentsHeight);
        } else {
          scroller.scrollTo({ left: target * scroller.clientWidth, behavior: "instant" });
          scrollRoot(section.getBoundingClientRect().top + window.scrollY);
        }
        setPosition(target, false);
        cancelAnimationFrame(unlockFrame);
        unlockFrame = requestAnimationFrame(() => { navigating = false; });
      };
      const restore = () => {
        const slug = location.hash.replace("#city-", "");
        const target = collections.findIndex((collection) => collection.slug === slug);
        if (target >= 0) navigate.current(target, false);
        else if (location.hash === "#work") navigate.current(0, false);
      };
      const onIndexLink = (event: MouseEvent) => {
        if (!ready || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href='/#work']") : null;
        if (!link || link.target === "_blank") return;
        // Native hash scrolling can move the pinned rail independently in WebKit.
        event.preventDefault();
        navigate.current(0, true);
      };
      const onScroll = () => {
        if (!desktop && !flow) {
          const bounds = section.getBoundingClientRect();
          setPosition(Math.round(scroller.scrollLeft / scroller.clientWidth), bounds.top < 160 && bounds.bottom > 160);
        } else if (flow) {
          const candidate = panels.findLastIndex((panel) => panel.getBoundingClientRect().top < window.innerHeight / 2);
          if (candidate >= 0 && section.getBoundingClientRect().bottom > 160) setPosition(candidate, true);
        }
      };
      const onFocus = (event: FocusEvent) => {
        const panel = (event.target as HTMLElement).closest<HTMLElement>("[data-city-panel]");
        if (panel) navigate.current(panels.indexOf(panel), false);
      };
      const setup = () => {
        if (!alive || disposed) return;
        ScrollTrigger.refresh();
        restore();
        ready = true;
        scroller.dataset.enhanced = "true";
      };
      document.fonts.ready.then(setup);
      scroller.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("popstate", restore);
      window.addEventListener("hashchange", restore);
      document.addEventListener("click", onIndexLink);
      rail.addEventListener("focusin", onFocus);
      return () => {
        disposed = true;
        cancelAnimationFrame(unlockFrame);
        scroller.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("popstate", restore);
        window.removeEventListener("hashchange", restore);
        document.removeEventListener("click", onIndexLink);
        rail.removeEventListener("focusin", onFocus);
        navigate.current = () => {};
        delete scroller.dataset.enhanced;
      };
    });
    return () => { alive = false; mm.revert(); };
  }, { scope });

  return (
    <section id="work" ref={scope} className="work-index relative border-t hairline" aria-label="Destination books">
      <div ref={pin} className="destination-scroller no-scrollbar">
        <nav className="destination-contents" aria-label="Destination contents">
          <div className="destination-links">
            {collections.map((collection, index) => (
              <Link key={collection.slug} href={"/series/" + collection.slug} aria-current={active === index ? "location" : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  if (!pin.current?.dataset.enhanced) return;
                  event.preventDefault(); navigate.current(index, true);
                }}>{collection.title}</Link>
            ))}
          </div>
          <div className="destination-controls">
            <span className="destination-position" aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}</span>
            <button type="button" title="Previous destination" aria-label="Previous destination" disabled={active === 0} onClick={() => navigate.current(active - 1, true)}><ArrowLeft size={18} /></button>
            <button type="button" title="Next destination" aria-label="Next destination" disabled={active === collections.length - 1} onClick={() => navigate.current(active + 1, true)}><ArrowRight size={18} /></button>
          </div>
        </nav>
        <div ref={track} className="destination-track">
          {collections.map((collection, index) => <CityPanel key={collection.slug} collection={collection} index={index} />)}
        </div>
      </div>
    </section>
  );
}
