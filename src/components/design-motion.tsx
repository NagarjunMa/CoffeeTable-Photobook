"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Moment = { destroy?: () => void };
type Moments = { mount: (root: Element) => Promise<Moment> };

/** Keep the unmodified Taste modules outside React's bundle, with route cleanup. */
export function DesignMotion() {
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    let mounted: Moment[] = [];
    const root = document.querySelector("main");
    if (!root) return;
    (window as Window & { __momentsManual?: boolean }).__momentsManual = true;
    const motionEntry = "/assets/motion/motion.js";
    const momentsEntry = "/assets/moments/moments.js";
    const start = async () => {
      const motion = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ motionEntry);
      if (!active) return;
      motion.init();
      const runtime: Moments = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ momentsEntry);
      if (!active) return;
      const hosts = [...root.querySelectorAll("[data-moment]")];
      const ready = await Promise.all(hosts.map(host => runtime.mount(host)));
      if (!active) ready.forEach(moment => moment.destroy?.());
      else {
        mounted = ready;
        document.documentElement.dataset.momentsReady = String(ready.length);
      }
    };
    void start().catch(() => {
      document.documentElement.classList.add("m-enter-done", "mo-safe");
    });
    return () => { active = false; mounted.forEach(moment => moment.destroy?.()); };
  }, [pathname]);
  return null;
}
