"use client";

import { useLayoutEffect, useRef } from "react";

export function DestinationTitle({ title, as: Tag = "h3" }: { title: string; as?: "h1" | "h2" | "h3" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      element.style.removeProperty("font-size");
      const size = parseFloat(getComputedStyle(element).fontSize);
      const context = document.createElement("canvas").getContext("2d");
      const style = getComputedStyle(element);
      if (!context) return;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const longest = Math.max(...title.split(/\s+/).map((word) => context.measureText(word).width));
      if (longest > element.clientWidth) element.style.fontSize = `${size * element.clientWidth / longest * 0.98}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element.parentElement ?? element);
    document.fonts.ready.then(fit);
    fit();
    return () => { cancelled = true; observer.disconnect(); };
  }, [title]);
  return <Tag ref={ref} className="font-display destination-title">{title.split(/\s+/).map((word, index) => <span key={`${index}-${word}`} className="block">{word}{" "}</span>)}</Tag>;
}
