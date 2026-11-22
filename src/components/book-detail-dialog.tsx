"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { CSSProperties, RefObject } from "react";
import type { Collection } from "@/data/types";
import { bookPresentation } from "@/lib/photobook-presentation";
import { CollectionMap } from "@/components/collection-map";
import { PortfolioPhoto } from "@/components/portfolio-photo";

gsap.registerPlugin(useGSAP);

export function BookDetailDialog({ collection, opener, onClose }: {
  collection: Collection;
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
    const plate = element.querySelector<HTMLElement>(".book-detail-plate")!;
    const copy = element.querySelector<HTMLElement>(".book-detail-copy")!;
    const timeline = gsap.timeline({ paused: true, onReverseComplete: onClose });
    animation.current = timeline;
    if (!motion.matches) {
      timeline.fromTo(shell, { y: 24, scale: 0.98, autoAlpha: 0 }, {
        y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: "expo.out",
      }, 0)
        .fromTo(plate, { clipPath: "inset(0% 100% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out",
        }, 0.08)
        .fromTo(copy.children, { y: 14, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.5, ease: "expo.out",
        }, 0.2);
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
        <button type="button" onClick={requestClose} autoFocus>Return to photobooks</button>
      </div>
    </div>}
    <div className="book-detail-shell" inert={preparing} aria-hidden={preparing ? "true" : undefined} style={{ "--book-color": book.color } as CSSProperties}>
      <button className="book-detail-close" type="button" onClick={requestClose} autoFocus={!preparing}><X size={18} aria-hidden="true" /><span>Return to photobooks</span></button>
      <div className="book-detail-spread">
        <div className="book-detail-plate">
          <p className="book-author font-mono-custom">Nagarjun Mallesh</p>
          <div className="book-title-block"><h2 id={`book-title-${collection.slug}`} className="font-display">{collection.title}</h2><p>{collection.location}{book.year && ` · ${book.year}`}</p></div>
          {book.cover ? <figure className="book-detail-photo"><PortfolioPhoto key={attempt} photo={book.cover} sizes="(min-width: 900px) 40vw, 85vw" loading="eager" />

          </figure> : <div className="book-detail-preparing"><p>Photographs are being prepared.</p></div>}
          <p className="book-plate-footer font-mono-custom">{book.count}</p>
        </div>
        <div className="book-detail-copy">
          <div className="book-story-preview">
            <h3 className="font-display">{personal?.title ?? "About this collection"}</h3>
            <p>{introduction}</p>
          </div>
          <div className="book-detail-actions">
            {personal && <p className="book-story-continuation">The complete story continues in the photobook.</p>}
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
      </div>
    </div>
  </dialog>;
}
