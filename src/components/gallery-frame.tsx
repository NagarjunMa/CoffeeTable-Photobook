"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ThinkingOrb } from "thinking-orbs";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** The figure reserves its full size; only its prepared photograph moves. */
export function GalleryFrame({ children, style, index }: {
  children: ReactNode;
  style: CSSProperties;
  index: number;
}) {
  const scope = useRef<HTMLElement>(null);
  const revealed = useRef(false);
  const [waiting, setWaiting] = useState(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const figure = scope.current!;
      const group = figure.querySelector<HTMLElement>(".exhibition-frame-group")!;
      if (revealed.current) return;
      let active = true;
      let ready = false;
      let entered = false;
      let request = 0;
      const tween = gsap.fromTo(group, {
        opacity: 0, y: 24, scale: 0.99,
        rotationX: 0, rotationZ: 0,
        transformPerspective: 1200, transformOrigin: "50% 70%",
      }, {
        opacity: 1, y: 0, scale: 1, rotationX: 0, rotationZ: 0,
        duration: 0.7, ease: "power3.out", paused: true,
        clearProps: "transform,transformOrigin,opacity,willChange",
      });
      group.style.pointerEvents = "none";

      const reveal = (instant = false) => {
        if (!active || !entered || !ready) return;
        if (revealed.current) {
          if (instant) tween.progress(1);
          return;
        }
        revealed.current = true;
        setWaiting(false);
        group.style.removeProperty("pointer-events");
        group.style.willChange = "transform, opacity";
        if (instant) tween.progress(1);
        else tween.play();
      };
      const prepare = async (image: HTMLImageElement) => {
        const currentRequest = ++request;
        // Decode cached responses too. A failed decode must not hide Retry/content.
        if (image.naturalWidth > 0) await image.decode().catch(() => {});
        if (!active || currentRequest !== request || figure.querySelector("img") !== image) return;
        ready = true;
        reveal();
      };
      const settle = (event: Event) => {
        if (event.target instanceof HTMLImageElement) void prepare(event.target);
      };
      const focus = () => {
        // Keyboard navigation must never land on an invisible photo control.
        entered = ready = true;
        reveal(true);
      };
      figure.addEventListener("load", settle, true);
      figure.addEventListener("error", settle, true);
      figure.addEventListener("focusin", focus);
      const image = figure.querySelector("img");
      if (image?.complete) void prepare(image);
      const trigger = ScrollTrigger.create({
        trigger: figure, start: "top 94%", once: true,
        onEnter: () => {
          entered = true;
          setWaiting(!ready);
          reveal();
        },
      });
      return () => {
        active = false;
        trigger.kill();
        figure.removeEventListener("load", settle, true);
        figure.removeEventListener("error", settle, true);
        figure.removeEventListener("focusin", focus);
        group.style.removeProperty("pointer-events");
        setWaiting(false);
      };
    });
    return () => media.revert();
  }, { scope, dependencies: [index], revertOnUpdate: true });

  return <figure ref={scope} className="exhibition-item group relative min-h-0 min-w-0" style={style}>
    {waiting && <span className="gallery-frame-wait" aria-hidden="true">
      <ThinkingOrb state="searching" size={32} theme="light" />
      <span>Preparing photograph</span>
    </span>}
    <div className="exhibition-frame-group mx-auto max-w-full">{children}</div>
  </figure>;
}
