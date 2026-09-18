import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "About",
  description: "Nagarjun Mallesh on family photographs, a childhood image from Badami, and why he makes still images.",
};

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
      <main id="main-content" tabIndex={-1} className="site-gutter page-shell pt-24">
        <section className="grid gap-10 border-t hairline pb-24 pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16 md:pt-16">
          <div>
            <h1 className="font-display text-3xl leading-tight md:text-4xl">Nagarjun Mallesh</h1>
            <p className="mt-3 text-base text-[#5f5c56]">Travel and wildlife photography</p>
          </div>

          <div>
            <h2 className="font-display text-4xl font-medium leading-tight md:text-5xl">
              Why Still Images
            </h2>

            <div className="mt-8 max-w-[65ch] space-y-6 text-base leading-relaxed text-[#25231f] md:text-xl">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {/* Full navigation lets the scroll controller initialize with the destination hash. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/#work"
              className="editorial-link mt-10 inline-flex text-base underline underline-offset-4"
            >
              Explore Photobooks
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
