import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const rd = (ms: number) =>
  ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

// Opens Google Maps (the app on mobile, web on desktop) at the venue.
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("King and the Pawn, 17 Purvis Street, Singapore 188596");

type Detail = {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
};

// The itinerary rows for the ticket card.
const DETAILS: Detail[] = [
  {
    icon: <CalendarDays strokeWidth={1.5} className="h-5 w-5" />,
    label: "When",
    value: "Saturday, July 18",
  },
  {
    icon: <Clock strokeWidth={1.5} className="h-5 w-5" />,
    label: "Time",
    value: "Evening · 6pm-8pm",
  },
  {
    icon: <MapPin strokeWidth={1.5} className="h-5 w-5" />,
    label: "Where",
    value: "King and the Pawn - 17 Purvis St, #01-01, Singapore 188596",
    href: MAPS_URL,
  },
  {
    icon: <Users strokeWidth={1.5} className="h-5 w-5" />,
    label: "Who",
    value: "Four matched pairs + host",
  },
  {
    icon: <DollarSign strokeWidth={1.5} className="h-5 w-5" />,
    label: "Price",
    value: "It's our first event, so we are sponsoring your spot and a free drink!",
  },
];

/**
 * Section — the launch of the pilot game night (Sat, July 11). Sits directly
 * below the host (you've just met Chloe → here's the night she's running).
 * A warm, terracotta-tinted panel: copy + CTA on one side, a ticket-style
 * itinerary on the other. Drives to the /apply questionnaire.
 */
export default function PilotEvent() {
  return (
    <section id="pilot" className="bg-background py-24 text-black md:py-32">
      <Reveal
        asTrigger
        className="mx-auto max-w-content gap-14 px-6 md:grid-cols-2 md:gap-16 md:px-10"
      >
        <div className="relative overflow-hidden">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* copy + CTA */}
            <div>
              <p
                className="rise inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-terracotta"
                style={rd(0)}
              >
                {/* <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-terracotta/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
                </span> */}
                Ready to find your Player 2?
              </p>
              <h2
                className="rise mt-5 font-serif text-4xl font-semibold leading-[1.03] text-forest md:text-5xl"
                style={rd(100)}
              >
                Upcoming{" "}
                <span className="italic text-terracotta">this Saturday.</span>
              </h2>
              <p
                className="rise mt-6 max-w-md text-[15px] leading-relaxed text-forest/65 md:text-base"
                style={rd(200)}
              >
                We&rsquo;re opening our very first hosted game night! 
                <br /><br />Completely Free. Four matched pairs, one table, and a live host running the
                room. <br /><br />Answer a few quick questions and, if you&rsquo;re a fit,
                we&rsquo;ll pair you with your match for the night. Worst case?
                You enjoy a great night out. Best case? You have found your 
                <span className="text-terracotta italic"> Player 2</span>.
              </p>

              <div
                className="rise mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
                style={rd(320)}
              >
                <Link
                  href="/apply"
                  className="group inline-flex h-14 items-center gap-2 rounded-full bg-terracotta px-8 text-sm font-medium uppercase tracking-widest text-background shadow-medium transition-colors duration-300 hover:bg-forest"
                >
                  Apply Here
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

            {/* ticket-style itinerary */}
            <div className="rise" style={rd(240)}>
              <div className="relative rounded-3xl border border-stone bg-card/80 p-7 shadow-large backdrop-blur-sm md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-sage">
                  Details
                </p>
                <dl className="mt-5 space-y-5">
                  {DETAILS.map((d) => (
                    <div key={d.label} className="flex items-start gap-4">
                      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage/12 text-sage">
                        {d.icon}
                      </span>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-widest text-forest/40">
                          {d.label}
                        </dt>
                        <dd className="mt-0.5 text-[15px] font-medium text-forest">
                          {d.href ? (
                            <a
                              href={d.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline decoration-stone underline-offset-4 transition-colors hover:text-terracotta hover:decoration-terracotta"
                            >
                              {d.value}
                            </a>
                          ) : (
                            d.value
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
                {/* perforated divider */}
                <div className="my-6 border-t border-dashed border-stone" />
                <p className="text-center text-[13px] font-medium text-terracotta">
                  Seats are limited. Sign up now, free!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
