"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set("[data-reveal]", { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.from("[data-reveal]", {
        autoAlpha: 0,
        y: 28,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
      });
    },
    { scope },
  );

  return (
    <main ref={scope} className="page-shell">
      {children}
    </main>
  );
}
