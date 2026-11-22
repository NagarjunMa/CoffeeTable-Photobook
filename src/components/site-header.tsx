"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  return <header className="site-header nav">
    <div className="wrap portfolio-nav">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Link href="/" aria-label="Nagarjun Mallesh home" className="portfolio-wordmark">NM<span>Nagarjun Mallesh</span></Link>
      <nav aria-label="Main navigation">
        {/* Full navigation preserves the existing book deep-link behavior. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/#work" className="editorial-link">Photobooks</a>
        <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} className="editorial-link">About</Link>
        <Link href="mailto:nagarjunmallesh@gmail.com" className="editorial-link">Contact</Link>
      </nav>
    </div>
  </header>;
}
