"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import { imageSources } from "@/lib/image-variants";
import type { LightboxOrigin } from "@/components/collection-gallery";
import type { PortfolioImage } from "@/data/collections";

type Props = { photo: PortfolioImage; current: number; total: number; origin: LightboxOrigin | null; onClose: () => void; onNext: () => void; onPrevious: () => void };

export function PhotoLightbox({ photo, current, total, origin, onClose, onNext, onPrevious }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const entered = useRef(false);
  const [displayed, setDisplayed] = useState(photo);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pending = displayed.id !== photo.id;

  useEffect(() => {
    if (photo.id === displayed.id) return;
    let cancelled = false;
    const next = new window.Image();
    const sources = imageSources(photo, true);
    next.sizes = "88vw";
    if (sources.srcSet) next.srcset = sources.srcSet;
    next.src = sources.src;
    next.decode().then(() => {
      if (!cancelled) { setDisplayed(photo); setFailedId(null); }
    }).catch(() => { if (!cancelled) setFailedId(photo.id); });
    return () => { cancelled = true; };
  }, [photo, displayed.id, attempt]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    const scrollY = window.scrollY;
    element.showModal();
    close.current?.focus({ preventScroll: true });
    window.dispatchEvent(new Event("portfolio:scroll-lock"));
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollY);
      window.dispatchEvent(new Event("portfolio:scroll-unlock"));
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useGSAP(() => {
    const image = stage.current?.querySelector("img");
    if (!image || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = image.getBoundingClientRect();
    if (origin && !entered.current && rect.width && rect.height) {
      gsap.from(image, { x: origin.left + origin.width / 2 - rect.left - rect.width / 2, y: origin.top + origin.height / 2 - rect.top - rect.height / 2, scaleX: origin.width / rect.width, scaleY: origin.height / rect.height, duration: 0.58, ease: "power3.inOut" });
    } else { gsap.from(image, { opacity: 0.5, duration: 0.25 }); }
    entered.current = true;
  }, { scope: stage, dependencies: [displayed.id], revertOnUpdate: true });

  return createPortal(
    <dialog ref={dialog} className="photo-dialog" aria-label={`${photo.alt}, image ${current + 1} of ${total}`} data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
        if (event.key === "ArrowRight") { event.preventDefault(); onNext(); }
        if (event.key === "ArrowLeft") { event.preventDefault(); onPrevious(); }
      }}>
      <button ref={close} autoFocus type="button" className="lightbox-close" onClick={onClose}>Close</button>
      <div ref={stage} className="lightbox-stage" aria-busy={pending}
        onPointerDown={(event) => { swipe.current = { x: event.clientX, y: event.clientY }; }}
        onPointerCancel={() => { swipe.current = null; }}
        onPointerUp={(event) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const x = event.clientX - start.x;
          const y = event.clientY - start.y;
          if (Math.abs(x) > 56 && Math.abs(x) > Math.abs(y)) { if (x < 0) onNext(); else onPrevious(); }
        }}>
        <PortfolioPhoto key={displayed.id} photo={displayed} enlarged sizes="88vw" className="lightbox-photo" loading="eager" fetchPriority="high" />
      </div>
      {pending && <div className="lightbox-status" role="status">{failedId === photo.id ? <>Image unavailable. <button type="button" onClick={() => { setFailedId(null); setAttempt((value) => value + 1); }}>Retry</button></> : "Loading photograph..."}</div>}
      {total > 1 && <><button className="lightbox-previous" type="button" onClick={onPrevious}>Previous</button><button className="lightbox-next" type="button" onClick={onNext}>Next</button></>}
      <p className="lightbox-count" aria-live="polite">{String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</p>
    </dialog>, document.body,
  );
}
