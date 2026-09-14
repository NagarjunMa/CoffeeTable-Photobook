import type { Metadata } from "next";
import { display, mono, sans } from "./fonts";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";

export const metadata: Metadata = {
  title: { default: "Nagarjun Mallesh | Travel & Wildlife Photography", template: "%s | Nagarjun Mallesh" },
  description:
    "Travel and wildlife photographs by Nagarjun Mallesh. Explore individual collections of places, people, and moments held in still images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
