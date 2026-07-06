import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";

const rd = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

const NEXAPOD_URL = "https://nexapod.events/";

/**
 * Section 6 — the launch host. A full-width forest block: a collage of Chloe's
 * event photography on one side, her introduction on the other.
 *
 * Chloe (our launch partner, who runs the Nexapod events agency) will supply her
 * own fuller bio later — until then we keep the copy to the essentials and avoid
 * inventing figures. Event tiles: two.jpg / three.jpg are square, one.jpg is 4:3.
 */

// Photos from Chloe's past nights, paired with the tile they fill in the collage.
const EVENTS = [
  { src: "/two.jpg", delay: 120 },
  { src: "/three.jpg", delay: 200 },
];

export default function Curator() {
  return (
    <section id="host" className="bg-forest py-24 text-background md:py-32">
      <div className="mx-auto grid max-w-content items-center gap-14 px-6 md:grid-cols-2 md:gap-16 md:px-10">
        {/* photo collage — Chloe's portrait + a few of her events */}
        <Reveal asTrigger>
          <div className="grid grid-cols-2 gap-4">
            {/* Chloe — the hero tile, a tall arch spanning two rows */}
            <div
              style={rd(0)}
              className="rise group relative row-span-2 overflow-hidden rounded-b-3xl rounded-t-[120px]"
            >
              <Image
                src="/chloe_image.jpg"
                alt="Chloe, February's launch host"
                fill
                sizes="(max-width: 768px) 45vw, 22vw"
                className="object-cover transition-transform duration-700 ease-botanical group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-serif text-xl leading-none text-background">Chloe</p>
              </div>
            </div>

            {/* two square event photos, stacked in the second column */}
            {EVENTS.map((e) => (
              <div
                key={e.src}
                style={rd(e.delay)}
                className="rise group relative h-[150px] overflow-hidden rounded-3xl"
              >
                <Image
                  src={e.src}
                  alt="A live event hosted by Chloe with Nexapod in Singapore"
                  fill
                  sizes="(max-width: 768px) 45vw, 22vw"
                  className="object-cover transition-transform duration-700 ease-botanical group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-forest/10" />
              </div>
            ))}

            {/* wide landscape event photo across the full width */}
            <div
              style={rd(280)}
              className="rise group relative col-span-2 h-[160px] overflow-hidden rounded-3xl"
            >
              <Image
                src="/one.jpg"
                alt="Guests mingling at a night hosted by Chloe with Nexapod"
                fill
                sizes="(max-width: 768px) 92vw, 40vw"
                className="object-cover transition-transform duration-700 ease-botanical group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
            </div>
          </div>
        </Reveal>

        {/* introduction */}
        <Reveal asTrigger>
          <p className="rise text-xs font-semibold uppercase tracking-widest text-blush" style={rd(0)}>
            Meet your host
          </p>
          <h2 className="rise mt-4 font-serif text-4xl font-semibold leading-[1.05] md:text-5xl" style={rd(100)}>
            Meet <span className="italic text-blush">Chloe</span>, your professional wingwoman.
          </h2>
          <p className="rise mt-6 text-[15px] leading-relaxed text-background/70" style={rd(200)}>
            Chloe runs{" "}
            <a
              href={NEXAPOD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blush underline decoration-blush/40 underline-offset-4 transition-colors hover:text-background hover:decoration-background/60"
            >
              Nexapod
            </a>
            , a full-service event management agency in Singapore.
          </p>
          {/* <p className="rise mt-4 text-sm italic leading-relaxed text-background/45" style={rd(280)}>
            A fuller introduction from Chloe is on the way.
          </p> */}
          <a
            href={NEXAPOD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rise group mt-9 inline-flex items-center gap-2 rounded-full border border-background/50 px-6 py-3 text-xs font-medium uppercase tracking-widest text-background transition-colors duration-300 hover:border-background hover:bg-background hover:text-forest"
            style={rd(360)}
          >
            Visit Nexapod
            <ArrowUpRight strokeWidth={1.75} className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
