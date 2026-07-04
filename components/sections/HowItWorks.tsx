"use client";

import { useState } from "react";
import { SlidersHorizontal, Gamepad2, PartyPopper } from "lucide-react";
import Reveal from "@/components/Reveal";
import {
  CardPhone,
  QuizMini,
  SparkMini,
  NightMini,
} from "@/components/sections/CardPhone";

/** Per-element reveal delay, for staggering `.rise` children. */
const rd = (ms: number) =>
  ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

type Step = {
  num: string;
  step: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  phone: React.ReactNode;
  /** rotation + fan offset, applied per breakpoint */
  card: string;
  wrap: string;
};

const STEPS: Step[] = [
  {
    num: "01",
    step: "The Quiz",
    title: "Match by compatibility.",
    body: "Rate what matters, set your dealbreakers, reveal your Big Five personality traits, and we bring you your best possible match backed by science.",
    icon: <SlidersHorizontal strokeWidth={1.5} className="h-6 w-6" />,
    phone: <QuizMini />,
    card: "-rotate-2 md:-rotate-[6deg]",
    wrap: "z-10 md:mr-[-26px] md:mt-8",
  },
  {
    num: "02",
    step: "The Spark",
    title: "Skip the small talk.",
    body: "Play quick minigames with your match on the app, a spark before you even meet.",
    icon: <Gamepad2 strokeWidth={1.5} className="h-6 w-6" />,
    phone: <SparkMini />,
    card: "rotate-2 md:rotate-[3deg]",
    wrap: "z-20 md:mr-[-26px]",
  },
  {
    num: "03",
    step: "The Night",
    title: "Show up and play",
    body: "We book the venue, and bring a live host. 3 or more matches including you and your match just show up and get ready for battle.",
    icon: <PartyPopper strokeWidth={1.5} className="h-6 w-6" />,
    phone: <NightMini />,
    card: "-rotate-2 md:-rotate-[5deg]",
    wrap: "z-10 md:mt-10",
  },
];

/**
 * How it works — the three-move story, told as a fan of rounded, slanted cards
 * that overlap like a hand dealt on the table. Each card carries a 3D-tilted
 * phone in its background, quietly playing the step it describes; on hover the
 * card straightens and lifts and its phone turns toward you.
 */
export default function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto max-w-content px-6 py-24 md:px-10 md:py-32"
    >
      <Reveal asTrigger className="mx-auto max-w-2xl text-center">
        <h2
          className="rise mt-4 font-serif text-4xl font-semibold leading-[1.05] text-forest md:text-5xl"
          style={rd(90)}
        >
          How it works
        </h2>
        <p
          className="rise mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-forest/60"
          style={rd(180)}
        >
          We book the venue, and bring a live host. 3 or more matches including
          you and your match just show up and get ready for battle.
        </p>
      </Reveal>

      <div className="mt-16 flex flex-col items-center gap-7 md:mt-24 md:flex-row md:items-start md:justify-center md:gap-0">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.num}
            delay={i * 120}
            className={`w-full max-w-sm md:w-[19rem] ${s.wrap}`}
          >
            <Card step={s} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * A single step card. The "raised" look is driven by both `:hover` (desktop) and
 * a tap-toggled `data-active` flag (mobile) — so a tap flips it and a second tap
 * flips it back. `hoverOnlyWhenSupported` (tailwind config) keeps `:hover` from
 * sticking on touch screens, so the two never fight.
 */
function Card({ step: s }: { step: Step }) {
  const [active, setActive] = useState(false);
  return (
    <article
      data-active={active ? "true" : "false"}
      onClick={() => setActive((a) => !a)}
      className={`group/card relative flex min-h-[25rem] cursor-pointer select-none flex-col overflow-hidden rounded-[2rem] bg-card shadow-large ring-1 ring-stone/70 transition-all duration-500 ease-botanical hover:-translate-y-2 hover:rotate-0 hover:shadow-bloom hover:ring-sage/40 data-[active=true]:-translate-y-2 data-[active=true]:rotate-0 data-[active=true]:shadow-bloom data-[active=true]:ring-sage/40 md:min-h-[27rem] ${s.card}`}
    >
      {/* the tilted phone, playing this step, in the background */}
      <CardPhone>{s.phone}</CardPhone>

      {/* fade so the copy stays crisp over the screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-card via-card/80 to-transparent"
      />

      {/* floating icon chip */}
      <span className="absolute left-6 top-6 z-10 grid h-11 w-11 place-items-center rounded-full bg-card text-sage shadow-soft ring-1 ring-sage/20">
        {s.icon}
      </span>
      {/* editorial step numeral */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-3 z-10 font-serif text-6xl font-semibold text-forest/[0.06]"
      >
        {s.num}
      </span>

      {/* copy, anchored to the bottom over the fade */}
      <div className="relative z-10 mt-auto p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-sage">
          Step {s.num} · {s.step}
        </p>
        <h3 className="mt-2 font-serif text-[24px] font-semibold leading-tight text-forest">
          {s.title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-forest/65">
          {s.body}
        </p>
      </div>
    </article>
  );
}
