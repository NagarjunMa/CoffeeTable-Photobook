"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import type { LightboxOrigin } from "@/components/collection-gallery";
import type { PortfolioImage } from "@/data/collections";

gsap.registerPlugin(useGSAP);

type PhotoLightboxProps = {
  photo: PortfolioImage;
  current: number;
  total: number;
  origin: LightboxOrigin | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function PhotoLightbox({
  photo,
  current,
  total,
  origin,
  onClose,
  onNext,
  onPrevious,
}: PhotoLightboxProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const imageStage = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const hasEntered = useRef(false);

  useGSAP(
    () => {
      gsap.fromTo(
        overlay.current,
        { autoAlpha: 0, backdropFilter: "blur(0px)" },
        {
          autoAlpha: 1,
          backdropFilter: "blur(10px)",
          duration: 0.38,
          ease: "power2.out",
        },
      );
    },
    { scope: overlay },
  );

  useGSAP(
    () => {
      const imageElement = imageStage.current?.querySelector<HTMLElement>(
        "[data-lightbox-image]",
      );

      if (!imageElement) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const targetRect = imageElement.getBoundingClientRect();
      const canUseOrigin = origin && !hasEntered.current && !reduceMotion;

      if (canUseOrigin) {
        const originCenterX = origin.left + origin.width / 2;
        const originCenterY = origin.top + origin.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        gsap.fromTo(
          imageElement,
          {
            autoAlpha: 0.72,
            x: originCenterX - targetCenterX,
            y: originCenterY - targetCenterY,
            scaleX: origin.width / targetRect.width,
            scaleY: origin.height / targetRect.height,
            transformOrigin: "center center",
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 0.58,
            ease: "power3.inOut",
          },
        );
      } else {
        gsap.fromTo(
          imageElement,
          { autoAlpha: 0, scale: reduceMotion ? 1 : 0.975 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: reduceMotion ? 0.01 : 0.38,
            ease: "power3.out",
          },
        );
      }

      hasEntered.current = true;
    },
    {
      dependencies: [photo.id],
      scope: imageStage,
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollPosition = window.scrollY;

    window.dispatchEvent(new Event("portfolio:scroll-lock"));
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeButton.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "Tab" && overlay.current) {
        const controls = Array.from(
          overlay.current.querySelectorAll<HTMLElement>("button"),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollPosition);
      window.dispatchEvent(new Event("portfolio:scroll-unlock"));
      previouslyFocused?.focus();
    };
  }, [onClose, onNext, onPrevious]);

  return createPortal(
    <div
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.alt}, image ${current + 1} of ${total}`}
      className="fixed inset-0 z-[140] flex cursor-zoom-out items-center justify-center bg-[rgb(10_10_10_/_0.84)] p-5 opacity-0 md:p-10"
      data-lenis-prevent
      style={{ WebkitBackdropFilter: "blur(10px)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={imageStage}
        className="flex max-h-[88dvh] max-w-[88vw] touch-pan-y items-center justify-center"
        onPointerDown={(event) => {
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;

          if (!start) {
            return;
          }

          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;

          if (Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              onNext();
            } else {
              onPrevious();
            }
          }
        }}
      >
        <PortfolioPhoto
          key={photo.id}
          data-lightbox-image
          photo={photo}
          enlarged
          sizes="88vw"
          className="h-auto max-h-[88dvh] w-auto max-w-[88vw] select-none object-contain opacity-0 shadow-[0_1.5rem_5rem_rgb(0_0_0_/_0.24)]"
          draggable={false}
          loading="eager"
          fetchPriority="high"
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>

      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        className="font-mono-custom absolute right-5 top-5 cursor-pointer border-0 bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white md:right-8 md:top-7"
      >
        Close
      </button>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={onPrevious}
            className="font-mono-custom absolute bottom-5 left-5 cursor-pointer border-0 bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white md:bottom-auto md:left-7 md:top-1/2 md:-translate-y-1/2"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="font-mono-custom absolute bottom-5 right-5 cursor-pointer border-0 bg-transparent px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white md:bottom-auto md:right-7 md:top-1/2 md:-translate-y-1/2"
          >
            Next
          </button>
        </>
      ) : null}

      <p className="font-mono-custom pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.18em] text-white/55">
        {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
    </div>,
    document.body,
  );
}
