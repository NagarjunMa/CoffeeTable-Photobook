"use client";

import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let teardown = () => {};
    const setup = () => {
      teardown();
      if (preference.matches) return;
      const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const lockScroll = () => lenis.stop();
    const navigate = (event: Event) => {
      const top = (event as CustomEvent<{ top: number }>).detail?.top;
      if (Number.isFinite(top)) lenis.scrollTo(top, { immediate: true, force: true });
    };
    const unlockScroll = () => {
      lenis.scrollTo(window.scrollY, { immediate: true });
      lenis.start();
    };

    window.addEventListener("portfolio:scroll-lock", lockScroll);
    window.addEventListener("portfolio:scroll-unlock", unlockScroll);
    window.addEventListener("portfolio:navigate", navigate);

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    teardown = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("portfolio:scroll-lock", lockScroll);
      window.removeEventListener("portfolio:scroll-unlock", unlockScroll);
      window.removeEventListener("portfolio:navigate", navigate);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
    };
    setup();
    preference.addEventListener("change", setup);
    return () => { teardown(); preference.removeEventListener("change", setup); };
  }, []);

  return null;
}
