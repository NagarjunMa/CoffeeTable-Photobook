"use client";

import { useLayoutEffect, useRef } from "react";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const titleShell = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const titleElement = title.current;
    const shellElement = titleShell.current;

    if (!titleElement || !shellElement) {
      return;
    }

    const fitTitle = () => {
      titleElement.dataset.titleReady = "true";
      titleElement.style.removeProperty("font-size");
      const naturalSize = Number.parseFloat(
        window.getComputedStyle(titleElement).fontSize,
      );
      const availableWidth = shellElement.clientWidth;
      const naturalWidth = titleElement.scrollWidth;

      if (naturalWidth > availableWidth) {
        titleElement.style.fontSize = `${naturalSize * (availableWidth / naturalWidth) * 0.985}px`;
      }

      titleElement.dataset.titleReady = "true";
    };

    const resizeObserver = new ResizeObserver(fitTitle);
    resizeObserver.observe(shellElement);
    document.fonts.ready.then(fitTitle);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <section
      ref={section}
      className="portfolio-hero relative z-10 flex flex-col justify-end overflow-visible bg-[var(--background)] px-[clamp(1.4rem,3.6vw,4.25rem)] pb-[clamp(1.5rem,3.2vh,2.5rem)] pt-24 text-[var(--foreground)]"
    >
      <div
        data-hero-copy
        className="mb-[clamp(1.35rem,3.2vh,2.6rem)] max-w-[40rem]"
      >
        <p className="font-display text-balance text-lg md:text-xl font-medium leading-[1.25]">
          Reexamining memory, place, and wilderness through still photographs.
          A quiet visual archive centered on travel and wildlife.
        </p>
      </div>

      <div
        ref={titleShell}
        data-hero-name-shell
        className="w-full overflow-visible"
      >
        <h1
          ref={title}
          data-hero-name
          className="hero-title font-display block w-full pb-[0.06em] font-semibold uppercase leading-[0.8]"
        >
          <span>Nagarjun</span>{" "}
          <span>Mallesh</span>
        </h1>
      </div>
      <p className="font-display mt-6 max-w-2xl text-lg font-medium leading-relaxed md:text-xl">
        Only photography can freeze time and let us return to a moment.
      </p>
    </section>
  );
}
