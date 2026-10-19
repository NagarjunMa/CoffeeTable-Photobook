"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { collections } from "@/data/collections";
import type { Collection } from "@/data/types";
import { bookPresentation } from "@/lib/photobook-presentation";
import type { ShelfRenderer } from "@/lib/bookshelf-renderer";
import { PhotobookShelfScene } from "@/components/photobook-shelf-scene";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import { CollectionMap } from "@/components/collection-map";

const volumes = collections.map((collection) => {
  const book = bookPresentation(collection);
  return { title: collection.title, color: book.color, image: book.coverSrc, count: book.count };
});
const bounded = (index: number) => ((index % collections.length) + collections.length) % collections.length;

function BookDetails({ collection }: { collection: Collection }) {
  const book = bookPresentation(collection);
  return <div className="book-detail-spread" style={{ "--book-color": book.color } as CSSProperties}>
    <div className="book-detail-plate">
      <p className="book-author font-mono-custom">Nagarjun Mallesh</p>
      {book.cover ? <figure className="book-detail-photo"><PortfolioPhoto photo={book.cover} sizes="(min-width: 900px) 40vw, 85vw" loading="eager" />
        {book.cover.caption && <figcaption>{book.cover.caption}</figcaption>}
      </figure> : <div className="book-detail-preparing"><span className="font-display" aria-hidden="true">{collection.title}</span><p>Photographs are being prepared.</p></div>}
      <p className="book-plate-footer font-mono-custom">A photographic collection</p>
    </div>
    <div className="book-detail-copy">
      <h2 id={`book-title-${collection.slug}`} className="font-display">{collection.title}</h2>
      <dl className="book-facts">
        <div><dt>Place</dt><dd>{collection.location}</dd></div>
        {collection.category && <div><dt>Subject</dt><dd>{collection.category}</dd></div>}
        {book.year && <div><dt>Year</dt><dd>{book.year}</dd></div>}
        <div><dt>Collection</dt><dd>{book.count}</dd></div>
      </dl>
      {!collection.note.startsWith("A field study from ") && <p className="book-detail-introduction">{collection.note}</p>}
      {collection.experience && <div className="book-story-preview">
        <h3 className="font-display">{collection.experience.title}</h3>
        <p>{collection.experience.paragraphs[0]}</p>
        <span className="book-story-continuation">The story continues inside the photobook.</span>
      </div>}
      {book.cover && <CollectionMap collection={collection} />}
      <Link href={`/series/${collection.slug}`} className="book-open-link" aria-label={`Open ${collection.title} collection`}>
        {collection.images.length ? "Open photobook" : "View collection"}<ArrowUpRight size={20} aria-hidden="true" />
      </Link>
    </div>
  </div>;
}

export function WorkIndex() {
  const section = useRef<HTMLElement>(null);
  const scene = useRef<Pick<ShelfRenderer, "select" | "inspect">>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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

  const open = useCallback((index: number) => {
    const next = bounded(index);
    const focused = document.activeElement;
    opener.current = focused instanceof HTMLElement && focused !== document.body && section.current?.contains(focused) ? focused : links.current[next];
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

  useEffect(() => {
    const element = dialog.current;
    if (detail === null || !element) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("portfolio:scroll-lock"));
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      window.dispatchEvent(new Event("portfolio:scroll-unlock"));
      opener.current?.focus({ preventScroll: true });
    };
  }, [detail]);

  function onContents(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    open(index);
  }

  return <section id="work" ref={section} className="photobook-library" aria-label="Destination books">
    <header className="library-heading site-gutter">
      <h2 className="font-display">Photobooks</h2>
      <p>Places I’ve been. Moments I’ve kept.<br />Take a book from the shelf.</p>
    </header>
    <div className="photobook-shelf" data-enhanced={enhanced ? "true" : undefined} data-fallback={fallback ? "true" : undefined}>
      <div className="photobook-shelf-stage">
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
        <button className="shelf-inspect" type="button" onClick={() => open(active)} aria-label={`Preview ${current.title} photobook`}>Take a closer look <ArrowUpRight size={18} aria-hidden="true" /></button>
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
    {detail !== null && <dialog ref={dialog} className="book-detail-dialog" aria-labelledby={`book-title-${collections[detail].slug}`} data-lenis-prevent onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')).filter((element) => element.getClientRects().length > 0);
      if (!controls.length) return;
      // WebKit can omit links from native Tab order depending on the macOS
      // keyboard preference. Move every step so the gallery action stays reachable.
      event.preventDefault();
      const index = controls.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? (index <= 0 ? controls.length - 1 : index - 1) : (index + 1) % controls.length;
      controls[next].focus();
    }}>
      <div className="book-detail-shell">
        <button className="book-detail-close" type="button" onClick={close} autoFocus><X size={18} aria-hidden="true" /><span>Return to shelf</span></button>
        <BookDetails collection={collections[detail]} />
      </div>
    </dialog>}
  </section>;
}
