import Link from "next/link";

export function SiteHeader({
  theme = "light",
  position = "fixed",
}: {
  theme?: "light" | "dark";
  position?: "fixed" | "absolute";
}) {
  const isDark = theme === "dark";

  return (
    <header
      className={`font-mono-custom ${position} left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-[clamp(1.4rem,3.6vw,4.25rem)] text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white mix-blend-difference" : "text-[#5f5c56]"}`}
    >
      <Link
        href="/"
        className={`editorial-link font-medium ${isDark ? "text-white" : "text-[#191919]"}`}
      >
        NM
      </Link>
      <nav className="flex items-center gap-[clamp(1rem,2vw,2.25rem)]">
        <Link href="/#work" className="editorial-link">
          Work
        </Link>
        <Link href="/about" className="editorial-link">
          About
        </Link>
        <Link href="mailto:nagarjunmallesh@gmail.com" className="editorial-link">
          Contact
        </Link>
      </nav>
    </header>
  );
}
