"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, ArrowUpRight, MoveHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { collections } from "@/data/collections";
import { bookPresentation } from "@/lib/photobook-presentation";
import { BookDetailDialog } from "@/components/book-detail-dialog";
import { Skiper54 } from "@/components/ui/skiper-ui/skiper54";

gsap.registerPlugin(useGSAP);

const volumes = collections.map(collection => ({ collection, ...bookPresentation(collection) }));
const bounded = (index: number) => ((index % collections.length) + collections.length) % collections.length;

export function WorkIndex() {
  const section = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const current = collections[active];
  const selectedBook = volumes[active];
  const choose = useCallback((index: number) => setActive(bounded(index)), []);

  const open = useCallback((index: number, trigger: HTMLElement) => {
    const next = bounded(index);
    opener.current = trigger;
    setActive(next);
    setDetail(next);
    history.pushState(history.state, "", `#city-${collections[next].slug}`);
  }, []);

  const close = useCallback(() => {
    setDetail(null);
    history.replaceState(history.state, "", "#work");
  }, []);

  useEffect(() => {
    const restore = () => {
      const index = collections.findIndex(item => `#city-${item.slug}` === location.hash);
      if (index < 0) { setDetail(null); return; }
      opener.current = links.current[index];
      choose(index);
      setDetail(index);
      section.current?.scrollIntoView({ block: "start", behavior: "instant" });
      window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { top: window.scrollY } }));
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", restore); };
  }, [choose]);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".photobook-selection-copy > *", { y: 14, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.05, ease: "expo.out", overwrite: true,
      });
    });
    return () => media.revert();
  }, { scope: section, dependencies: [active], revertOnUpdate: true });

  function onContents(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    open(index, event.currentTarget);
  }

  return <section id="work" ref={section} className="photobook-library" aria-label="Destination books">
    <div className="wrap library-content">
    <header className="library-heading">
      <h2 className="font-display">Photobooks<span aria-hidden="true">.</span></h2>
      <p>Eight collections from my travels and time in the wild.</p>
    </header>
    <Skiper54 items={volumes} selectedIndex={active} onSelect={choose} onOpen={open} />
    <div className="photobook-selection">
      <div className="photobook-selection-copy" aria-live="polite" aria-atomic="true">
        <h3 className="font-display">{current.title}</h3>
        <p>{current.location} <span aria-hidden="true">/</span> {selectedBook.count}</p>
      </div>
      <button className="photobook-inspect" type="button" onClick={event => open(active, event.currentTarget)} aria-label={`Preview ${current.title} photobook`}>
        Preview photobook <ArrowUpRight size={20} aria-hidden="true" />
      </button>
      <div className="photobook-controls" role="group" aria-label="Browse photobooks">
        <span className="font-mono-custom photobook-position">{String(active + 1).padStart(2, "0")} <span>/ {String(collections.length).padStart(2, "0")}</span></span>
        <button type="button" aria-label="Previous photobook" onClick={() => setActive(index => bounded(index - 1))}><ArrowLeft size={22} aria-hidden="true" /></button>
        <button type="button" aria-label="Next photobook" onClick={() => setActive(index => bounded(index + 1))}><ArrowRight size={22} aria-hidden="true" /></button>
      </div>
    </div>
    <div className="photobook-index-footer">
      <p className="photobook-gesture-hint"><MoveHorizontal size={16} aria-hidden="true" />Drag to browse. Select a book to open.</p>
      <nav className="photobook-contents" aria-label="Destination contents" onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const from = links.current.indexOf(document.activeElement as HTMLAnchorElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? collections.length - 1 : bounded((from >= 0 ? from : active) + (event.key === "ArrowRight" ? 1 : -1));
        choose(next);
        links.current[next]?.focus();
      }}>
        {collections.map((collection, index) => <Link key={collection.slug} id={`city-${collection.slug}`} ref={element => { links.current[index] = element; }} href={`/series/${collection.slug}`} aria-current={active === index ? "location" : undefined} onFocus={() => choose(index)} onClick={event => onContents(event, index)}>{collection.title}</Link>)}
      </nav>
    </div>
    <a className="carousel-credit" href="https://skiper-ui.com/v1/skiper54" target="_blank" rel="noreferrer">Carousel inspired by Skiper UI <ArrowUpRight size={12} aria-hidden="true" /></a>
    </div>
    {detail !== null && <BookDetailDialog key={collections[detail].slug} collection={collections[detail]} opener={opener} onClose={close} />}
  </section>;
}
