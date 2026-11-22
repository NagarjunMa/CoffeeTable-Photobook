import { ArrowDownRight } from "lucide-react";
import { PortfolioPhoto } from "@/components/portfolio-photo";
import { collections } from "@/data/collections";

export function Hero() {
  const newYork = collections.find((book) => book.slug === "new-york");
  const photograph = newYork?.coverImages[0] ?? collections[0].images[0];
  return <section className="hero hero--film portfolio-hero" data-enter aria-labelledby="portfolio-title">
    <div className="wrap"><div className="hero-text hero__in">
      <div className="hero__media hero__fill">
        <div className="portfolio-hero-photo"><PortfolioPhoto photo={photograph} sizes="100vw" loading="eager" fetchPriority="high" /></div>
        <div className="hero__over"><div className="portfolio-hero-copy">
          <p className="portfolio-byline">Nagarjun Mallesh</p>
          <h1 id="portfolio-title">Travel &amp; wildlife photographs.</h1>
          <p className="hero__lead">Places I’ve visited, wildlife I’ve waited for, and the stories I remember. Collected in {collections.length} photobooks.</p>
          <div className="btn-row"><a className="btn btn--primary" href="#work">See photobooks <ArrowDownRight className="m-arrow" size={20} aria-hidden="true" /></a></div>
        </div></div>
      </div>
    </div></div>
  </section>;
}
