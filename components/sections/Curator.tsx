import { PartyPopper, Users, ShieldCheck } from "lucide-react";
import Reveal from "@/components/Reveal";

const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

/**
 * Section 6 — social proof. A full-width, high-contrast forest block: a
 * lifestyle photo collage on one side, the host's credentials on the other.
 *
 * TODO(content): replace HOST, the STATS numbers, and the placeholder photo
 * tiles below with the real launch curator's name, figures, and event images.
 */
const HOST = "[ Host Name ]";

const STATS = [
  {
    icon: <PartyPopper strokeWidth={1.5} className="h-5 w-5" />,
    value: "150+",
    label: "Live events hosted",
    body: "Pool parties to bar meetups across Singapore.",
  },
  {
    icon: <Users strokeWidth={1.5} className="h-5 w-5" />,
    value: "4,000+",
    label: "Social connections facilitated",
    body: "Zero awkwardness — guaranteed.",
  },
  {
    icon: <ShieldCheck strokeWidth={1.5} className="h-5 w-5" />,
    value: "100%",
    label: "Vetted venues only",
    body: "Hand-picked for safety, comfort, and vibe.",
  },
];

// Placeholder lifestyle tiles — swap the gradient divs for real <img> elements.
const TILES = [
  { caption: "Rooftop pool party · Sentosa", gradient: "from-terracotta/70 to-blush/60", arch: true, className: "row-span-2" },
  { caption: "Bar meetup · Keong Saik", gradient: "from-sage/70 to-forest/40", arch: false, className: "" },
  { caption: "Board-game night · Dhoby Ghaut", gradient: "from-clay to-sage/50", arch: false, className: "" },
];

export default function Curator() {
  return (
    <section id="host" className="bg-forest py-24 text-background md:py-32">
      <div className="mx-auto grid max-w-content items-center gap-14 px-6 md:grid-cols-2 md:gap-16 md:px-10">
        {/* photo collage */}
        <Reveal asTrigger>
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            {TILES.map((t, i) => (
              <div
                key={t.caption}
                style={rd(i * 120)}
                className={`rise group relative overflow-hidden ${t.className} ${
                  t.arch ? "rounded-b-3xl rounded-t-[120px]" : "rounded-3xl"
                }`}
              >
                <div className={`h-full min-h-[150px] w-full bg-gradient-to-br ${t.gradient}`} />
                {/* subtle grain-friendly overlay + caption */}
                <div className="absolute inset-0 bg-forest/10" />
                <span className="absolute bottom-3 left-3 rounded-full bg-forest/45 px-3 py-1 text-[10px] font-medium tracking-wide text-background/90 backdrop-blur-sm">
                  {t.caption}
                </span>
                {i === 0 && (
                  <span className="absolute right-3 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-forest">
                    Live host
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* credentials */}
        <Reveal asTrigger>
          <p className="rise text-xs font-semibold uppercase tracking-widest text-blush" style={rd(0)}>
            The Experience Curator
          </p>
          <h2 className="rise mt-4 font-serif text-4xl font-semibold leading-[1.05] md:text-5xl" style={rd(100)}>
            Vetted rooms. Powered by <span className="italic text-blush">elite hosts</span>.
          </h2>
          <p className="rise mt-5 text-[15px] leading-relaxed text-background/70" style={rd(200)}>
            Meet your launch curator, <span className="text-background">{HOST}</span>. A machine
            can&rsquo;t run a room — our certified hosts can.
          </p>

          <dl className="mt-10 space-y-6">
            {STATS.map((s, i) => (
              <div key={s.label} className="rise flex gap-4 border-t border-background/10 pt-6" style={rd(300 + i * 110)}>
                <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background/10 text-blush">
                  {s.icon}
                </span>
                <div>
                  <dt className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-semibold text-background">{s.value}</span>
                    <span className="text-sm font-medium text-background/80">{s.label}</span>
                  </dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-background/55">{s.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
