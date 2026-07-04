import { SlidersHorizontal, Gamepad2, PartyPopper } from "lucide-react";
import Reveal from "@/components/Reveal";

/** Per-element reveal delay, for staggering `.rise` children. */
const rd = (ms: number) =>
  ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

type Step = {
  num: string;
  step: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  /** rotation + fan offset, applied per breakpoint */
  card: string;
  wrap: string;
};

const STEPS: Step[] = [
  {
    num: "01",
    step: "The Quiz",
    title: "A quiz that gets you",
    body: "Rate what matters, set your dealbreakers, reveal your Big Five personality traits.",
    icon: <SlidersHorizontal strokeWidth={1.5} className="h-6 w-6" />,
    card: "-rotate-2 md:-rotate-[6deg]",
    wrap: "z-10 md:mr-[-26px] md:mt-8",
  },
  {
    num: "02",
    step: "The Spark",
    title: "Match, then play",
    body: "Chat stays locked. Quick minigames reveal the real them — a spark before you ever meet.",
    icon: <Gamepad2 strokeWidth={1.5} className="h-6 w-6" />,
    card: "rotate-2 md:rotate-[3deg]",
    wrap: "z-20 md:mr-[-26px]",
  },
  {
    num: "03",
    step: "The Night",
    title: "Show up and play",
    body: "We match compatible couples, book the venue, and bring a live host. You just show up.",
    icon: <PartyPopper strokeWidth={1.5} className="h-6 w-6" />,
    card: "-rotate-2 md:-rotate-[5deg]",
    wrap: "z-10 md:mt-10",
  },
];

/**
 * How it works — the three-move story, told as a fan of rounded, slanted cards
 * that overlap like a hand dealt on the table. Each straightens and lifts on
 * hover; the whole set rises in on scroll.
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
          No endless swiping. No dry chats. Just smart matches and a great night
          out.
        </p>
      </Reveal>

      <div className="mt-16 flex flex-col items-center gap-7 md:mt-24 md:flex-row md:items-start md:justify-center md:gap-0">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.num}
            delay={i * 120}
            className={`w-full max-w-sm md:w-[19rem] ${s.wrap}`}
          >
            <article
              className={`group/card relative flex min-h-[20rem] flex-col rounded-[2rem] bg-card p-8 shadow-large ring-1 ring-stone/70 transition-all duration-500 ease-botanical hover:rotate-0 hover:-translate-y-2 hover:shadow-bloom hover:ring-sage/40 md:min-h-[22rem] ${s.card}`}
            >
              {/* faint step numeral, editorial watermark */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-3 font-serif text-7xl font-semibold text-forest/[0.05]"
              >
                {s.num}
              </span>

              <span className="grid h-12 w-12 place-items-center rounded-full bg-sage/12 text-sage transition-colors duration-500 group-hover/card:bg-sage/20">
                {s.icon}
              </span>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-sage">
                Step {s.num} · {s.step}
              </p>
              <h3 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-forest">
                {s.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-forest/65">
                {s.body}
              </p>

            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
