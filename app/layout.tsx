import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import PaperGrain from "@/components/PaperGrain";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const source = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: "February — Hosted group dates in Singapore",
  description:
    "February pairs highly compatible people on deep psychology, skips the small talk with in-app minigames, and routes you into hosted group game nights with a live host. Private beta across Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${source.variable}`}>
      <body className="antialiased">
        <PaperGrain />
        {children}
      </body>
    </html>
  );
}
