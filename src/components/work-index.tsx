"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  return (
    <article
      id={`city-${collection.slug}`}
      data-city-panel
      className="relative h-full w-[100cqw] shrink-0 snap-start overflow-hidden bg-[var(--background)]"
    >
      <MapBackdrop collection={collection} eager={index === 0} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,rgb(250_248_242_/_0.97)_21%,rgb(250_248_242_/_0.68)_42%,rgb(250_248_242_/_0.06)_70%)] md:bg-[linear-gradient(90deg,var(--background)_0%,rgb(250_248_242_/_0.96)_16%,rgb(250_248_242_/_0.62)_34%,transparent_61%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />

      <Link href={href} aria-label={`Open ${collection.title} city book`} className="city-panel-link relative z-20 flex h-full items-center px-[clamp(1.4rem,4vw,5rem)] pb-16 pt-24"
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
          scrollRoot(panels[target].getBoundingClientRect().top + window.scrollY - 128);
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
      };
      document.fonts.ready.then(setup);
      scroller.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("popstate", restore);
      window.addEventListener("hashchange", restore);
      rail.addEventListener("focusin", onFocus);
      return () => {
        disposed = true;
        cancelAnimationFrame(unlockFrame);
        scroller.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("popstate", restore);
        window.removeEventListener("hashchange", restore);
        rail.removeEventListener("focusin", onFocus);
        navigate.current = () => {};
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
