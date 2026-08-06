import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const paragraphs = [
  "Ever since I was young, there was a camera in our house. My father photographed my childhood with the patience of someone composing more than a record. He would place my sister and me carefully against a background, balancing us inside the canvas he had already imagined.",
  "At the time, those instructions felt endless. Years later, while going through family albums, I saw what he was really doing. The photographs did not need an explanation. The place, the people, the innocence, and the background were already in conversation.",
  "One image from Badami stayed with me. It was made on film, at the right moment, with the family held perfectly inside the frame. That photograph became the quiet push behind my own work.",
  "I photograph because a still image can freeze a moment without adding noise. It gives the viewer room to enter the place, imagine the air, and feel the story forming silently in their own mind.",
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-gutter page-shell pt-24">
        <section className="grid min-h-screen gap-12 border-t hairline pb-24 pt-8 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono-custom text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
              About
            </p>
          </div>

          <div>
            <h1 className="font-display max-w-[10ch] text-[clamp(4.5rem,12vw,12rem)] font-medium leading-[0.82]">
              Why Still Images
            </h1>

            <div className="mt-14 max-w-3xl space-y-8 text-[clamp(1.25rem,2.3vw,2.15rem)] leading-[1.25] text-[#25231f]">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <Link
              href="/#work"
              className="editorial-link mt-16 inline-flex font-mono-custom text-[11px] uppercase tracking-[0.18em]"
            >
              Selected Work
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
