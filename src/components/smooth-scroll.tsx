"use client";

import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const lockScroll = () => lenis.stop();
    const unlockScroll = () => {
      lenis.scrollTo(window.scrollY, { immediate: true });
      lenis.start();
    };

    window.addEventListener("portfolio:scroll-lock", lockScroll);
    window.addEventListener("portfolio:scroll-unlock", unlockScroll);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("portfolio:scroll-lock", lockScroll);
      window.removeEventListener("portfolio:scroll-unlock", unlockScroll);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
  }, []);

  return null;
}
