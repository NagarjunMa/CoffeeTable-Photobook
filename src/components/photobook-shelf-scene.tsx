"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import type { ShelfRenderer, ShelfVolume } from "@/lib/bookshelf-renderer";

export function PhotobookShelfScene({ volumes, initialIndex, onSelect, onOpen, onReady, onError, ref }: {
  volumes: ShelfVolume[];
  initialIndex: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onReady: () => void;
  onError: () => void;
  ref: Ref<Pick<ShelfRenderer, "select" | "inspect">>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ShelfRenderer | null>(null);
  const startingIndex = useRef(initialIndex);
  const inspecting = useRef(false);
  useImperativeHandle(ref, () => ({
    select(index) { startingIndex.current = index; renderer.current?.select(index); },
    inspect(open) { inspecting.current = open; renderer.current?.inspect(open); },
  }), []);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    const intersection = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      intersection.disconnect();
      import("@/lib/bookshelf-renderer").then(async ({ createBookshelfRenderer }) => {
        const style = getComputedStyle(document.documentElement);
        const fonts = {
          display: style.getPropertyValue("--font-display").trim() || "Georgia, serif",
          mono: style.getPropertyValue("--font-mono").trim() || "monospace",
        };
        // Load the two used faces explicitly; fonts.ready can wait on images
        // in WebKit, while the fallback covers must remain usable throughout.
        await Promise.all([document.fonts.load(`500 84px ${fonts.display}`), document.fonts.load(`400 18px ${fonts.mono}`)]).catch(() => {});
        if (disposed) return;
        try {
          renderer.current = createBookshelfRenderer(element, volumes, { onSelect, onOpen, onError }, startingIndex.current, fonts);
          renderer.current.inspect(inspecting.current);
          resize = new ResizeObserver(() => renderer.current?.resize());
          resize.observe(element);
          onReady();
        } catch {
          onError();
        }
      }).catch(() => { if (!disposed) onError(); });
    }, { rootMargin: "300px" });
    intersection.observe(element);
    return () => {
      disposed = true;
      intersection.disconnect();
      resize?.disconnect();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [volumes, onSelect, onOpen, onReady, onError]);

  return <canvas ref={canvas} className="photobook-shelf-canvas" aria-hidden="true" />;
}
