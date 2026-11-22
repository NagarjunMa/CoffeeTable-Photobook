/* eslint-disable @next/next/no-css-tags -- Serve the unmodified Taste styles as plain public assets. */
import type { Metadata } from "next";
import { preconnect } from "react-dom";
import { portfolioFont } from "./fonts";
import "./globals.css";
import { DesignMotion } from "@/components/design-motion";

export const metadata: Metadata = {
  title: { default: "Nagarjun Mallesh | Travel & Wildlife Photography", template: "%s | Nagarjun Mallesh" },
  description:
    "Travel and wildlife photographs by Nagarjun Mallesh. Explore individual collections of places, people, and moments held in still images.",
  other: { "page-type": "service", "site-kind": "other" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://imagedelivery.net");
  return (
    <html
      lang="en"
      className={portfolioFont.variable}
      data-type="service" data-radius="soft" data-buttons="solid"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)" }} />
      </head>
      <body suppressHydrationWarning>
        <DesignMotion />
        {children}
      </body>
    </html>
  );
}
