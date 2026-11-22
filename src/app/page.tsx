import { Hero } from "@/components/hero";
import { PhotographerNote } from "@/components/photographer-note";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WorkIndex } from "@/components/work-index";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="page-shell">
        <Hero />
        <WorkIndex />
        <PhotographerNote />
      </main>
      <SiteFooter />
    </>
  );
}
