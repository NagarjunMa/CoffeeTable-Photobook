import { Hero } from "@/components/hero";
import { IntroLoader } from "@/components/intro-loader";
import { SiteHeader } from "@/components/site-header";
import { WorkIndex } from "@/components/work-index";

export default function Home() {
  return (
    <>
      <IntroLoader />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="page-shell">
        <Hero />
        <WorkIndex />
      </main>
    </>
  );
}
