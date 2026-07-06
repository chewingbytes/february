import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { ArrowRight } from "lucide-react";

const rd = (ms: number) =>
  ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/** Section 7 — the gated invitation panel + site footer. */
export default function Invitation() {
  return (
    <section
      id="request"
      className="mx-auto max-w-content px-6 pb-16 pt-24 md:px-10 md:pt-32"
    >
      <Reveal asTrigger>
        <div className="relative overflow-hidden rounded-[40px] border border-stone bg-card-clay px-6 py-16 text-center shadow-soft md:px-20 md:py-24">
          {/* faint editorial ornament — a calm arc, no botany required */}
          <svg
            aria-hidden
            viewBox="0 0 200 40"
            style={rd(0)}
            className="rise mx-auto mb-8 h-6 w-40 text-sage/50"
            fill="none"
          >
            <path
              d="M2 38 C 60 2, 140 2, 198 38"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <p className="rise eyebrow" style={rd(80)}>
            Join us this Saturday!
          </p>
          <h2
            className="rise mx-auto mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.03] text-forest md:text-6xl"
            style={rd(160)}
          >
            Ready to lock in your{" "}
            <span className="italic text-terracotta"> Player 2</span>?
          </h2>
          <p
            className="rise mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-forest/60 md:text-lg"
            style={rd(240)}
          >
            No endless swiping. No awkward first dates. Just smart matches and
            hosted game nights.
          </p>

          <div
            className="rise mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
            style={rd(320)}
          >
            <Link
              href="/apply"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-terracotta px-8 text-sm font-medium uppercase tracking-widest text-background shadow-medium transition-colors duration-300 hover:bg-forest"
            >
              Apply Now
              <ArrowRight
                strokeWidth={1.75}
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <span className="text-xs font-medium uppercase tracking-widest text-forest/45">
              Applications close Thursday
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-stone pt-8 text-center sm:flex-row sm:text-left">
          <Image
            src="/actuallogo.png"
            alt="playertwo.place"
            width={44}
            height={44}
            className="h-11 w-11"
          />
          <p className="max-w-md text-xs leading-relaxed text-forest/45">
            Built for authentic human connection.
          </p>
        </footer>
      </Reveal>
    </section>
  );
}
