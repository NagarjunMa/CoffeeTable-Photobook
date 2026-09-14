"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({
  theme = "light",
  position = "fixed",
}: {
  theme?: "light" | "dark";
  position?: "fixed" | "absolute";
}) {
  const isDark = theme === "dark";
  const pathname = usePathname();

  return (
    <header
      className={`site-header font-mono-custom ${position} left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-[clamp(1rem,3.6vw,4.25rem)] text-xs uppercase ${isDark ? "text-[var(--gallery-ink)] bg-[var(--gallery-wall)]" : "text-[var(--foreground)] bg-[var(--background)]"}`}
    >
      <Link
        href="/"
        aria-label="Nagarjun Mallesh home"
        className={`editorial-link font-medium ${isDark ? "text-white" : "text-[#191919]"}`}
      >
        NM
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-5">
        <Link href="/#work" className="editorial-link">
          Work
        </Link>
        <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} className="editorial-link">
          About
        </Link>
        <Link href="mailto:nagarjunmallesh@gmail.com" className="editorial-link">
          Contact
        </Link>
      </nav>
    </header>
  );
}
