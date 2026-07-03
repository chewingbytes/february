import Reveal from "@/components/Reveal";
import PhoneFrame from "@/components/PhoneFrame";

/** Per-element reveal delay, for staggering `.rise` children. */
const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/**
 * The shared 2-column "phone demo" layout used by sections 03/04/05. Copy on
 * one side, a live phone mockup on the other, alternating sides for rhythm
 * (`reversed`). On mobile the copy always leads, then the device. Each copy
 * block rises in on its own delay for a natural, cascading entrance.
 */
export default function PhoneDemo({
  id,
  index,
  title,
  tagline,
  body,
  children,
  phone,
  reversed = false,
  staticOnMobile = false,
}: {
  id: string;
  index: string;
  title: React.ReactNode;
  tagline: React.ReactNode;
  body: React.ReactNode;
  children: React.ReactNode; // feature bullets
  phone: React.ReactNode;
  reversed?: boolean;
  staticOnMobile?: boolean; // show immediately on mobile (no scroll reveal)
}) {
  return (
    <section id={id} className="mx-auto max-w-content px-6 py-24 md:px-10 md:py-32">
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
        <Reveal asTrigger staticOnMobile={staticOnMobile} className={reversed ? "md:order-2" : ""}>
          <p className="rise font-serif text-2xl italic text-sage" style={rd(0)}>
            {index}
          </p>
          <h2
            className="rise mt-3 font-serif text-4xl font-semibold leading-[1.05] text-forest md:text-5xl"
            style={rd(90)}
          >
            {title}
          </h2>
          <p className="rise mt-5 font-serif text-xl italic leading-snug text-forest/80 md:text-2xl" style={rd(180)}>
            {tagline}
          </p>
          <p className="rise mt-5 max-w-md text-[15px] leading-relaxed text-forest/65" style={rd(260)}>
            {body}
          </p>
          <dl className="mt-8 space-y-5">{children}</dl>
        </Reveal>

        <Reveal delay={140} staticOnMobile={staticOnMobile} className={reversed ? "md:order-1" : ""}>
          <PhoneFrame>{phone}</PhoneFrame>
        </Reveal>
      </div>
    </section>
  );
}

/** A single labelled feature point with a floating sage icon. Rises in on `delay`. */
export function Bullet({
  icon,
  term,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  term: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="rise flex gap-4" style={rd(delay)}>
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage/12 text-sage">
        {icon}
      </span>
      <div>
        <dt className="font-medium text-forest">{term}</dt>
        <dd className="mt-1 text-[14px] leading-relaxed text-forest/60">{children}</dd>
      </div>
    </div>
  );
}
