import Link from "next/link";
import { collections } from "@/data/collections";
import { PortfolioPhoto } from "@/components/portfolio-photo";

export function SiteFooter() {
  const maine = collections.find(book => book.slug === "maine")!;
  const photograph = maine.images[3] ?? maine.coverImages[0];
  return <footer className="closing portfolio-footer">
    <div className="wrap">
      <div className="footer-top">
        <div className="footer-heading"><h2>Photographs by<br />Nagarjun Mallesh</h2><Link className="btn btn--primary" href="/#work">See photobooks</Link></div>
        <figure className="footer-image"><PortfolioPhoto photo={photograph} sizes="(min-width: 1440px) 1280px, 90vw" /></figure>
      </div>
      <div className="footer-bottom"><Link href="/" aria-label="Nagarjun Mallesh home">Nagarjun Mallesh</Link><Link href="/about">About the photographer</Link><Link href="mailto:nagarjunmallesh@gmail.com">Get in touch</Link></div>
    </div>
  </footer>;
}
