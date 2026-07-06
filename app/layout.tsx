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
  title: "Player 2 — Hosted group dates in Singapore",
  description:
    "Player 2 pairs highly compatible people on deep psychology, skips the small talk with in-app minigames, and routes you into hosted group game nights with a live host. Private beta across Singapore.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
