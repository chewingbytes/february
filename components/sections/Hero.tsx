import { Fragment } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

const LEDE =
  "Team up with your perfect match and battle against other matches in hosted game nights.";

// The hero quote, split into words so each can rise in on its own beat.
const QUOTE_WORDS =
  "“Love does not consist of gazing at each other, but in looking outward together in the same direction.”".split(
    " "
  );
const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/**
 * Section 1 — the hero.
 * Desktop: a full-height photograph (public/hero.jpg) with a giant "February"
 * centered over it and the positioning line bottom-left. A light tint keeps
 * text legible while letting the photo stay prominent.
 * Mobile: the photo keeps its natural landscape shape as a top banner (shrinks
 * with the device), and the copy sits below on warm alabaster.
 */
export default function Hero() {
  return (
    <section id="top" className="relative flex flex-col overflow-hidden">
      {/* image: banner on mobile (natural 16:9), full-screen on desktop */}
      <div className="relative aspect-[16/9] w-full md:aspect-auto md:h-[100svh]">
        <Image
          src="/hero.jpg"
          alt="A live host keeping the energy up at a February hosted game night in Singapore"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* light readability tint — desktop only (mobile copy sits below the photo) */}
        <div aria-hidden className="absolute inset-0 bg-forest/60 block" />
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-gradient-to-t from-[#141210]/75 via-transparent to-transparent md:block"
        />
        {/* soft fade blending the mobile banner into the alabaster page */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background md:hidden"
        />

        {/* desktop overlay copy */}
        <div className="absolute inset-0 hidden flex-col md:flex">
          <div className="flex flex-1 items-center justify-center px-4">
            <h1 className="animate-float-up select-none text-center font-serif text-[19vw] font-semibold leading-[0.9] tracking-tight text-background drop-shadow-[0_2px_24px_rgba(0,0,0,0.4)]">
              February
            </h1>
          </div>
          <div className="w-full px-12 pb-14">
            <div className="flex items-end justify-between gap-8">
              <p
                className="animate-float-up max-w-md text-left text-base leading-relaxed text-background/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]"
                style={{ animationDelay: "120ms" }}
              >
                {LEDE}
              </p>
              <a
                href="#request"
                className="animate-float-up group inline-flex shrink-0 items-center gap-2 rounded-full border border-background/50 px-6 py-3 text-xs font-medium uppercase tracking-widest text-background transition-colors duration-300 hover:border-background hover:bg-background hover:text-forest"
                style={{ animationDelay: "200ms" }}
              >
                Request an invitation
                <ArrowRight strokeWidth={1.75} className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* mobile copy — below the photo, on alabaster */}
      <div className="px-6 pb-4 pt-8 text-center md:hidden">
        <h1 className="animate-float-up select-none font-serif text-[19vw] font-semibold leading-[0.9] tracking-tight text-forest">
          February
        </h1>
        <p
          className="animate-float-up mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-forest/70"
          style={{ animationDelay: "120ms" }}
        >
          {LEDE}
        </p>
        <a
          href="#request"
          className="animate-float-up btn-primary mt-7 inline-flex h-12 items-center gap-2 px-7"
          style={{ animationDelay: "220ms" }}
        >
          Request an invitation
          <ArrowRight strokeWidth={1.75} className="h-4 w-4" />
        </a>
      </div>

      {/* Famous quote — a band below the full-height hero on desktop; sits below
          the CTA on mobile. Unveils itself smoothly left-to-right on scroll. */}
      <Reveal
        asTrigger
        rootMargin="0px 0px -22% 0px"
        className="px-6 py-14 text-center md:mt-[20vh] md:px-10 md:py-16"
      >
        <blockquote className="mx-auto max-w-4xl font-serif text-xl italic leading-snug text-forest md:text-4xl md:leading-tight">
          {QUOTE_WORDS.map((w, i) => (
            <Fragment key={i}>
              <span className="rise inline-block" style={rd(i * 30)}>
                {w}
              </span>{" "}
            </Fragment>
          ))}
        </blockquote>
        <cite
          className="rise mt-5 block text-xs font-medium uppercase not-italic tracking-widest text-sage md:text-sm"
          style={rd(QUOTE_WORDS.length * 30 + 200)}
        >
          — Antoine de Saint-Exupéry
        </cite>
      </Reveal>
    </section>
  );
}
