"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

const introSessionKey = "nm-portfolio-intro-played";

export function IntroLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const overlay = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
      if (!isVisible) {
        return;
      }

      let played = false;
      try { played = window.sessionStorage.getItem(introSessionKey) === "true"; } catch { /* Storage is optional. */ }
      if (played || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const frame = requestAnimationFrame(() => setIsVisible(false));
        return () => cancelAnimationFrame(frame);
      }

      const overlayElement = overlay.current;
      const nameElement = name.current;
      const heroName = document.querySelector<HTMLElement>("[data-hero-name]");

      if (!overlayElement || !nameElement || !heroName) {
        setIsVisible(false);
        return;
      }

      const previousBodyOverflow = document.body.style.overflow;
      overlayElement.style.display = "block";
      const previousHtmlOverflow = document.documentElement.style.overflow;
      let cancelled = false;
      let finished = false;
      let introStarted = false;
      let timeline: gsap.core.Timeline | null = null;
      let fontFallbackTimer: number | null = null;
      let finishTimer: number | null = null;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      gsap.set(heroName, { autoAlpha: 0 });

      const finish = () => {
        if (cancelled || finished) {
          return;
        }
        finished = true;

        if (fontFallbackTimer !== null) {
          window.clearTimeout(fontFallbackTimer);
        }
        if (finishTimer !== null) {
          window.clearTimeout(finishTimer);
        }
        try { window.sessionStorage.setItem(introSessionKey, "true"); } catch { /* Storage must not interrupt teardown. */ }
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
        gsap.set(heroName, { clearProps: "opacity,visibility" });
        setIsVisible(false);
      };

      const runIntro = () => {
        if (cancelled || finished || introStarted) {
          return;
        }

        introStarted = true;
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        if (reduceMotion) {
          gsap.set(heroName, { autoAlpha: 1 });
          gsap.to(overlayElement, {
            autoAlpha: 0,
            duration: 0.25,
            onComplete: finish,
          });
          return;
        }

        const initialWidth = nameElement.getBoundingClientRect().width;
        if (initialWidth > window.innerWidth - 40) {
          nameElement.style.fontSize = `${parseFloat(getComputedStyle(nameElement).fontSize) * (window.innerWidth - 40) / initialWidth}px`;
        }
        const sourceRect = nameElement.getBoundingClientRect();
        const targetRect = heroName.getBoundingClientRect();
        const targetScale = targetRect.width / sourceRect.width;

        gsap.set(nameElement, {
          x: window.innerWidth / 2 - sourceRect.width / 2,
          y: window.innerHeight / 2 - sourceRect.height / 2,
          transformOrigin: "top left",
        });

        timeline = gsap
          .timeline({ onComplete: finish })
          .fromTo(
            nameElement,
            { autoAlpha: 0, scale: 0.94 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.65,
              ease: "power3.out",
            },
          )
          .to(nameElement, {
            x: targetRect.left,
            y: targetRect.top,
            scale: targetScale,
            color: "#191919",
            duration: 1.15,
            ease: "power4.inOut",
          }, "+=0.45")
          .to(
            overlayElement,
            {
              backgroundColor: "rgba(0, 0, 0, 0)",
              duration: 0.78,
              ease: "power2.inOut",
            },
            "-=0.78",
          )
          .set(heroName, { autoAlpha: 1 }, "-=0.1")
          .to(nameElement, { autoAlpha: 0, duration: 0.12 }, "<")
          .to(overlayElement, { autoAlpha: 0, duration: 0.12 }, "<");
      };

      const scheduleIntro = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try { runIntro(); } catch { finish(); }
          });
        });
      };

      document.fonts.ready.then(scheduleIntro);
      const skip = () => { timeline?.kill(); finish(); };
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("pointerdown", skip, { once: true });
      fontFallbackTimer = window.setTimeout(scheduleIntro, 1200);
      finishTimer = window.setTimeout(finish, 5500);

      return () => {
        cancelled = true;
        window.removeEventListener("keydown", skip);
        window.removeEventListener("pointerdown", skip);
        if (fontFallbackTimer !== null) {
          window.clearTimeout(fontFallbackTimer);
        }
        if (finishTimer !== null) {
          window.clearTimeout(finishTimer);
        }
        timeline?.kill();
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
        gsap.set(heroName, { clearProps: "opacity,visibility" });
      };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={overlay}
      aria-hidden="true"
      style={{ display: "none" }}
      className="fixed inset-0 z-[150] overflow-hidden bg-black"
    >
      <div
        ref={name}
        className="font-display fixed left-0 top-0 whitespace-nowrap text-[136px] font-semibold uppercase leading-[0.72] tracking-normal text-[#f7f3ea] opacity-0"
      >
        Nagarjun Mallesh
      </div>
    </div>
  );
}
