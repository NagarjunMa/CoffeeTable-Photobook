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
      className="relative z-10 flex min-h-svh flex-col justify-end overflow-visible bg-[#fbfbfa] px-[clamp(1.4rem,3.6vw,4.25rem)] pb-[clamp(1.5rem,3.2vh,2.5rem)] pt-24 text-[#191919]"
    >
      <div
        data-hero-copy
        className="mb-[clamp(1.35rem,3.2vh,2.6rem)] max-w-[40rem]"
      >
        <p className="font-display text-balance text-[clamp(1rem,1.08vw,1.35rem)] font-medium leading-[1.25]">
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
          className="font-display block w-full pb-[0.06em] text-[clamp(4.25rem,11.4vw,14.5rem)] font-semibold uppercase leading-[0.74] tracking-normal md:w-max md:whitespace-nowrap md:leading-[0.78]"
        >
          <span className="block md:inline">Nagarjun</span>{" "}
          <span className="block md:inline">Mallesh</span>
        </h1>
      </div>
    </section>
  );
}
