import { Schibsted_Grotesk } from "next/font/google";

export const portfolioFont = Schibsted_Grotesk({
  subsets: ["latin"], weight: ["400", "500"],
  variable: "--font-portfolio", display: "swap",
});
