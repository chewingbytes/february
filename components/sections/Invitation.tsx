import Image from "next/image";
import InviteForm from "@/components/InviteForm";
import Reveal from "@/components/Reveal";

const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/** Section 7 — the gated invitation panel + site footer. */
export default function Invitation() {
  return (
    <section id="request" className="mx-auto max-w-content px-6 pb-16 pt-24 md:px-10 md:pt-32">
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
            <path d="M2 38 C 60 2, 140 2, 198 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <p className="rise eyebrow" style={rd(80)}>
            By Invitation Only
          </p>
          <h2
            className="rise mx-auto mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.03] text-forest md:text-6xl"
            style={rd(160)}
          >
            Ready to lock in your <span className="italic text-terracotta"> Player 2</span>?
          </h2>
          <p className="rise mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-forest/60 md:text-lg" style={rd(240)}>
            No endless swiping. No awkward first dates. Just smart matches and hosted game nights.
          </p>

          <div className="rise mx-auto mt-10 max-w-lg text-left" style={rd(340)}>
            <InviteForm mode="email" tone="light" />
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-stone pt-8 text-center sm:flex-row sm:text-left">
          <Image src="/actuallogo.png" alt="february.place" width={44} height={44} className="h-11 w-11" />
          <p className="max-w-md text-xs leading-relaxed text-forest/45">
            Built for authentic human connection.
          </p>
        </footer>
      </Reveal>
    </section>
  );
}
