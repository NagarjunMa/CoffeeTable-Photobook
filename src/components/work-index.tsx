"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, MoveHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { collections } from "@/data/collections";
import { bookPresentation } from "@/lib/photobook-presentation";
import type { BookOrigin, ShelfRenderer } from "@/lib/bookshelf-renderer";
import { PhotobookShelfScene } from "@/components/photobook-shelf-scene";
import { BookDetailDialog } from "@/components/book-detail-dialog";

const volumes = collections.map((collection) => {
  const book = bookPresentation(collection);
  return { title: collection.title, color: book.color, image: book.coverSrc, count: book.count };
});
const bounded = (index: number) => ((index % collections.length) + collections.length) % collections.length;

export function WorkIndex() {
  const section = useRef<HTMLElement>(null);
  const scene = useRef<Pick<ShelfRenderer, "select" | "inspect" | "bounds">>(null);
  const [origin, setOrigin] = useState<BookOrigin | undefined>(undefined);
  const opener = useRef<HTMLElement | null>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [fallback, setFallback] = useState(false);
  const current = collections[active];
  const selectedBook = bookPresentation(current);

  const choose = useCallback((index: number) => {
    const next = bounded(index);
    setActive(next);
    scene.current?.select(next);
  }, []);

  const open = useCallback((index: number, trigger?: HTMLElement) => {
    const next = bounded(index);
    const focused = trigger ?? document.activeElement;
    opener.current = focused instanceof HTMLElement && focused !== document.body && section.current?.contains(focused) ? focused : links.current[next];
    let source = scene.current?.bounds(next);
    if (!source) {
      const cover = section.current?.querySelectorAll<HTMLElement>(".shelf-fallback-book")[next];
      if (cover && getComputedStyle(cover).visibility !== "hidden") source = cover.getBoundingClientRect();
    }
    setOrigin(source);
    setActive(next);
    setDetail(next);
    scene.current?.select(next);
    scene.current?.inspect(true);
    history.pushState(history.state, "", `#city-${collections[next].slug}`);
  }, []);

  const close = useCallback(() => {
    setDetail(null);
    scene.current?.inspect(false);
    history.replaceState(history.state, "", "#work");
  }, []);

  const ready = useCallback(() => setEnhanced(true), []);
  const fail = useCallback(() => { setEnhanced(false); setFallback(true); }, []);
  const select = useCallback((index: number) => setActive(index), []);

  useEffect(() => {
    if (enhanced) return;
    const rail = section.current?.querySelector<HTMLElement>(".shelf-fallback");
    const book = rail?.children[active] as HTMLElement | undefined;
    if (rail && book) rail.scrollTo({ left: book.offsetLeft - (rail.clientWidth - book.clientWidth) / 2, behavior: "instant" });
  }, [active, enhanced]);

  useEffect(() => {
    const restore = () => {
      setOrigin(undefined);
      const slug = location.hash.replace("#city-", "");
      const index = collections.findIndex((item) => item.slug === slug);
      if (index >= 0) {
        choose(index);
        setDetail(index);
        scene.current?.inspect(true);
        section.current?.scrollIntoView({ block: "start", behavior: "instant" });
        window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { top: window.scrollY } }));
      } else {
        setDetail(null);
        scene.current?.inspect(false);
      }
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", restore); };
  }, [choose]);

  function onContents(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    open(index, event.currentTarget);
  }

  return <section id="work" ref={section} className="photobook-library" aria-label="Destination books">
    <header className="library-heading site-gutter">
      <h2 className="font-display">Photobooks</h2>
      <p>Places I’ve been. Moments I’ve kept.<br />Take a book from the shelf.</p>
    </header>
    <div className="photobook-shelf" data-enhanced={enhanced ? "true" : undefined} data-fallback={fallback ? "true" : undefined}>
      <p className="shelf-gesture-hint font-mono-custom" id="shelf-gesture-hint"><MoveHorizontal size={18} aria-hidden="true" /><span>Drag or swipe to browse · Tap a book to open</span></p>
      <div className="photobook-shelf-stage" role="group" aria-label="Interactive bookshelf" aria-describedby="shelf-gesture-hint">
        {!fallback && <PhotobookShelfScene ref={scene} volumes={volumes} initialIndex={active} onSelect={select} onOpen={open} onReady={ready} onError={fail} />}
        <div className="shelf-fallback no-scrollbar" aria-label="Photobook covers">
          {collections.map((collection, index) => {
            const book = bookPresentation(collection);
            return <Link key={collection.slug} href={`/series/${collection.slug}`} className="shelf-fallback-book" style={{ "--book-color": book.color } as CSSProperties} onClick={(event) => onContents(event, index)}>
              <span className="font-mono-custom">Nagarjun Mallesh</span>
              <h3 className="font-display">{collection.title}</h3>
              <span className="shelf-fallback-plate">{book.cover ? <picture><img src={book.coverSrc} width={book.cover.width} height={book.cover.height} alt="" loading="lazy" decoding="async" /></picture> : <span className="font-display">{collection.title}</span>}</span>
              <span>{book.count}</span>
            </Link>;
          })}
        </div>
      </div>
      <div className="shelf-selection site-gutter">
        <div className="shelf-selection-copy" aria-live="polite" aria-atomic="true">
          <h3 className="font-display">{current.title}</h3>
          <p>{current.location} <span aria-hidden="true">·</span> {selectedBook.count}</p>
        </div>
        <button className="shelf-inspect" type="button" onClick={(event) => open(active, event.currentTarget)} aria-label={`Preview ${current.title} photobook`}>Take a closer look <ArrowUpRight size={18} aria-hidden="true" /></button>
        <div className="shelf-controls" role="group" aria-label="Browse photobooks">
          <span className="font-mono-custom">{String(active + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}</span>
          <button type="button" aria-label="Previous photobook" onClick={() => choose(active - 1)}><ArrowLeft size={22} /></button>
          <button type="button" aria-label="Next photobook" onClick={() => choose(active + 1)}><ArrowRight size={22} /></button>
        </div>
      </div>
      <nav className="shelf-contents site-gutter" aria-label="Destination contents" onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const from = links.current.indexOf(document.activeElement as HTMLAnchorElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? collections.length - 1 : bounded((from >= 0 ? from : active) + (event.key === "ArrowRight" ? 1 : -1));
        choose(next);
        links.current[next]?.focus();
      }}>
        {collections.map((collection, index) => <Link key={collection.slug} id={`city-${collection.slug}`} ref={(element) => { links.current[index] = element; }} href={`/series/${collection.slug}`} aria-current={active === index ? "location" : undefined} onFocus={() => choose(index)} onClick={(event) => onContents(event, index)}>{collection.title}</Link>)}
      </nav>
    </div>
    {detail !== null && <BookDetailDialog key={collections[detail].slug} collection={collections[detail]} origin={origin} opener={opener} onClose={close} />}
  </section>;
}
