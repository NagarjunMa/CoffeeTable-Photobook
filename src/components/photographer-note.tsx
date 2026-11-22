import Link from "next/link";
import { collections } from "@/data/collections";
import { PortfolioPhoto } from "@/components/portfolio-photo";

export function PhotographerNote() {
  const tigers = collections.find((book) => book.slug === "tigers")!;
  const photograph = tigers.images[3] ?? tigers.coverImages[0];
  return <section className="section photographer-note" aria-labelledby="behind-photographs">
    <div className="wrap photographer-note-spread">
      <div className="photographer-note-copy">
        <p className="section-label">Behind the photographs</p>
        <h2 id="behind-photographs">My first visit to Kanha</h2>
        <p>{tigers.experience?.paragraphs[0] ?? tigers.note}</p>
        <Link className="btn btn--secondary" href="/series/tigers#experience-tigers">Read my first forest story</Link>
      </div>
      <figure className="photographer-note-image" data-moment="picture-develops" data-moment-opts='{"look":"film"}'>
        <PortfolioPhoto photo={photograph} sizes="(min-width: 1024px) 48vw, 90vw" />
      </figure>
    </div>
  </section>;
}
