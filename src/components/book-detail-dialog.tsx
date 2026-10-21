"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { CSSProperties, RefObject } from "react";
import type { Collection } from "@/data/types";
import type { BookOrigin } from "@/lib/bookshelf-renderer";
import { bookPresentation } from "@/lib/photobook-presentation";
import { CollectionMap } from "@/components/collection-map";
import { PortfolioPhoto } from "@/components/portfolio-photo";

gsap.registerPlugin(useGSAP);

export function BookDetailDialog({ collection, origin, opener, onClose }: {
  collection: Collection;
  origin?: BookOrigin;
  opener: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const animation = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);
  const book = bookPresentation(collection);
  const [phase, setPhase] = useState<"loading" | "slow" | "failed" | "ready">(book.cover ? "loading" : "ready");
  const [attempt, setAttempt] = useState(0);
  const preparing = phase !== "ready";
  const personal = collection.experience;
  const introduction = personal?.paragraphs[0] ?? (collection.note.startsWith("A field study from ") ? "This collection is taking shape. Photographs will be added to the photobook as they are prepared." : collection.note);

  useGSAP(() => {
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    element.showModal();
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("portfolio:scroll-lock"));
    const shell = element.querySelector<HTMLElement>(".book-detail-shell")!;
    const spread = element.querySelector<HTMLElement>(".book-detail-spread")!;
    const plate = element.querySelector<HTMLElement>(".book-detail-plate")!;
    const cover = element.querySelector<HTMLElement>(".book-opening-cover")!;
    const copy = element.querySelector<HTMLElement>(".book-detail-copy")!;
    const rect = spread.getBoundingClientRect();
    const desktop = matchMedia("(min-width: 768px)").matches;
    const anchored = origin && origin.top < innerHeight && origin.top + origin.height > 0 && origin.left < innerWidth && origin.left + origin.width > 0;
    // The closed cover occupies the right leaf. Keep its visual centre attached
    // to the selected physical book before the hinge reveals the two pages.
    const pivot = desktop ? 0.75 : 0.5;
    const timeline = gsap.timeline({ paused: true, onReverseComplete: onClose });
    animation.current = timeline;
    if (!motion.matches) {
      timeline.fromTo(shell, {
        x: anchored ? origin.left + origin.width / 2 - (rect.left + rect.width * pivot) : 0,
        y: anchored ? origin.top + origin.height / 2 - (rect.top + rect.height / 2) : 12,
        scale: anchored ? Math.min(0.8, origin.width / (rect.width * (desktop ? 0.5 : 1))) : 0.96,
        transformOrigin: `${pivot * 100}% 50%`, opacity: 0,
      }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.42, ease: "power3.out" }, 0)
        .fromTo(cover, { rotationY: 0 }, { rotationY: -180, duration: 0.64, ease: "power2.inOut" }, 0.12)
        .fromTo(plate, { rotationY: desktop ? 82 : 0, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.56, ease: "power2.out" }, 0.18)
        .fromTo(copy, { opacity: 0 }, { opacity: 1, duration: 0.26 }, 0.36);
    } else {
      gsap.set(cover, { rotationY: -180 });
    }
    const onMotion = () => {
      if (!motion.matches) return;
      timeline.progress(1).pause();
      if (closing.current) onClose();
    };
    motion.addEventListener("change", onMotion);
    return () => {
      motion.removeEventListener("change", onMotion);
      animation.current = null;
      element.close();
      document.body.style.overflow = overflow;
      window.dispatchEvent(new Event("portfolio:scroll-unlock"));
      opener.current?.focus({ preventScroll: true });
    };
  }, { scope: dialog });

  useEffect(() => {
    if (!book.cover) return;
    const pictures = [...dialog.current!.querySelectorAll<HTMLImageElement>("img")];
    let disposed = false;
    let settled = 0;
    let failed = false;
    const timer = setTimeout(() => setPhase(current => current === "ready" ? current : "slow"), 12_000);
    const cleanups = pictures.map(picture => {
      let done = false;
      const finish = (success: boolean) => {
        if (disposed || done) return;
        done = true;
        settled += 1;
        failed ||= !success;
        if (failed) {
          clearTimeout(timer);
          setPhase(current => current === "ready" ? current : "failed");
        } else if (settled === pictures.length) {
          clearTimeout(timer);
          setPhase("ready");
        }
      };
      const check = () => {
        if (!picture.complete || done || disposed) return;
        if (!picture.naturalWidth) { finish(false); return; }
        // Observe the actual responsive DOM image, including cached responses.
        // The cover animation must not race the browser's decoding work.
        const source = picture.currentSrc;
        picture.decode().then(() => {
          if (picture.currentSrc !== source) check();
          else finish(true);
        }, () => {
          if (picture.currentSrc !== source) check();
          else finish(false);
        });
      };
      const error = () => finish(false);
      picture.addEventListener("load", check);
      picture.addEventListener("error", error);
      check();
      return () => { picture.removeEventListener("load", check); picture.removeEventListener("error", error); };
    });
    return () => { disposed = true; clearTimeout(timer); cleanups.forEach(cleanup => cleanup()); };
  }, [attempt, book.cover]);

  useEffect(() => {
    if (preparing) return;
    const timeline = animation.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) timeline?.progress(1).pause();
    else timeline?.play(0);
    dialog.current?.querySelector<HTMLButtonElement>(".book-detail-close")?.focus({ preventScroll: true });
  }, [preparing]);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    const timeline = animation.current;
    if (preparing || !timeline || matchMedia("(prefers-reduced-motion: reduce)").matches || timeline.time() === 0) onClose();
    else timeline.timeScale(1.5).reverse();
  }

  return <dialog ref={dialog} className="book-detail-dialog" aria-labelledby={preparing ? undefined : `book-title-${collection.slug}`} aria-label={preparing ? `Opening ${collection.title} photobook` : undefined} data-lenis-prevent
    onCancel={(event) => { event.preventDefault(); requestClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), summary')).filter(element => element.getClientRects().length > 0 && !element.closest("[inert]") && getComputedStyle(element).visibility !== "hidden");
      if (!controls.length) return;
      // Include links on WebKit even with macOS's limited native Tab order.
      event.preventDefault();
      const index = controls.indexOf(document.activeElement as HTMLElement);
      controls[(index + (event.shiftKey ? controls.length - 1 : 1)) % controls.length].focus();
    }}>
    {preparing && <div className="book-preparing-screen">
      <div role="status" aria-live="polite" className="book-preparing-status">
        <ThinkingOrb state="searching" size={64} theme="light" aria-hidden="true" />
        <p className="font-mono-custom">{phase === "failed" ? "A photograph couldn’t be loaded." : phase === "slow" ? "Photographs are taking longer than expected." : `Preparing ${collection.title}`}</p>
      </div>
      <div className="book-preparing-actions">
        {phase === "failed" && <button type="button" onClick={() => { setPhase("loading"); setAttempt(value => value + 1); }}>Retry photographs</button>}
        {(phase === "slow" || phase === "failed") && <button type="button" onClick={() => setPhase("ready")}>Continue to book</button>}
        <button type="button" onClick={requestClose} autoFocus>Return to shelf</button>
      </div>
    </div>}
    <div className="book-detail-shell" inert={preparing} aria-hidden={preparing ? "true" : undefined} style={{ "--book-color": book.color } as CSSProperties}>
      <button className="book-detail-close" type="button" onClick={requestClose} autoFocus={!preparing}><X size={18} aria-hidden="true" /><span>Return to shelf</span></button>
      <div className="book-detail-spread">
        <div className="book-detail-plate">
          <p className="book-author font-mono-custom">Nagarjun Mallesh</p>
          <div className="book-title-block"><h2 id={`book-title-${collection.slug}`} className="font-display">{collection.title}</h2><p>{collection.location}{book.year && ` · ${book.year}`}</p></div>
          {book.cover ? <figure className="book-detail-photo"><PortfolioPhoto key={attempt} photo={book.cover} sizes="(min-width: 900px) 40vw, 85vw" loading="eager" />
            {book.cover.caption && <figcaption>{book.cover.caption}</figcaption>}
          </figure> : <div className="book-detail-preparing"><p>Photographs are being prepared.</p></div>}
          <p className="book-plate-footer font-mono-custom">{book.count}</p>
        </div>
        <div className="book-detail-copy">
          <div className="book-story-preview">
            <p className="book-journal-label font-mono-custom">{personal ? "From my journal" : "Inside this photobook"}</p>
            <h3 className="font-display">{personal?.title ?? "About this collection"}</h3>
            <p>{introduction}</p>
          </div>
          <div className="book-detail-actions">
            {personal && <p className="book-story-continuation">The photographs. The places. The story behind them.</p>}
            <Link href={`/series/${collection.slug}`} className="book-open-link" aria-label={`Open ${collection.title} collection`}>
              {collection.images.length ? "Open complete photobook" : "View collection"}<ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <details className="book-extra-details"><summary>Location &amp; collection details</summary>
              <dl className="book-facts">
                <div><dt>Place</dt><dd>{collection.location}</dd></div>
                {collection.category && <div><dt>Subject</dt><dd>{collection.category}</dd></div>}
                {book.year && <div><dt>Year</dt><dd>{book.year}</dd></div>}
              </dl>
              {personal && <p className="book-detail-introduction">{collection.note}</p>}
              {book.cover && <CollectionMap key={attempt} collection={collection} />}
            </details>
          </div>
        </div>
        <div className="book-opening-cover" aria-hidden="true">
          <span className="font-mono-custom">Nagarjun Mallesh</span><span className="font-display">{collection.title}</span>
          {book.cover && <picture key={attempt}><img src={book.coverSrc} width={book.cover.width} height={book.cover.height} alt="" /></picture>}
          <span className="font-mono-custom">A photographic collection</span>
        </div>
      </div>
    </div>
  </dialog>;
}
