import { Fragment } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import GameNightScene from "@/components/sections/GameNightScene";

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
 * Desktop: a full-height photograph with the logo centered over it and the
 * positioning line bottom-left.
 * Mobile: a tall photo with the logo composited on top — the transparent PNG's
 * whitespace shows the photo, so the square never reads as a boxy block — fading
 * into alabaster where a short tagline + CTA sit.
 */
export default function Hero() {
  return (
    <section id="top" className="relative flex flex-col overflow-hidden">
      {/* photo — tall on mobile, full-height on desktop (single shared image) */}
      <div className="relative h-[60svh] min-h-[440px] w-full md:h-[100svh]">
        <Image
          src="/hero.jpg"
          alt="A live host keeping the energy up at a February hosted game night in Singapore"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* readability tint */}
        <div aria-hidden className="absolute inset-0 bg-forest/60" />
        {/* desktop: darken toward the bottom-left copy */}
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-gradient-to-t from-[#141210]/75 via-transparent to-transparent md:block"
        />
        {/* mobile: fade the photo down into the alabaster copy below it */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background md:hidden"
        />

        {/* mobile: logo composited over the photo */}
        <div className="absolute inset-0 z-10 grid place-items-center px-8 md:hidden">
          <h1 className="animate-float-up w-full">
            <Image
              src="/transparent-background-logo.png"
              alt="february.place"
              width={2000}
              height={2000}
              priority
              className="mx-auto h-auto w-full max-w-[512px] drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            />
          </h1>
        </div>

        {/* desktop overlay copy */}
        <div className="absolute inset-0 hidden flex-col md:flex">
          <div className="flex flex-1 items-center justify-center px-4">
            <h1 className="animate-float-up">
              <Image
                src="/transparent-background-logo.png"
                alt="february.place"
                width={2000}
                height={2000}
                priority
                className="h-auto w-[50vw] max-w-9xl drop-shadow-[0_2px_26px_rgba(0,0,0,0.5)]"
              />
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

      {/* mobile copy — on alabaster, directly under the fading photo */}
      <div className="px-6 pb-2 pt-5 text-center md:hidden">
        <p
          className="animate-float-up mx-auto max-w-sm text-[15px] leading-relaxed text-forest/70"
          style={{ animationDelay: "120ms" }}
        >
          {LEDE}
        </p>
        <a
          href="#request"
          className="animate-float-up btn-primary mt-6 inline-flex h-12 items-center gap-2 px-7"
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

      {/* An illustrated beat that gives the quote a picture: couples gathered
          around a table, playing together — "looking outward in the same direction." */}
      <GameNightScene />
    </section>
  );
}
