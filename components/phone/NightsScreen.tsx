"use client";

import { Dice5, Check, MapPin } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 01 — the goal: highly compatible matches, out together at a hosted
 * game night. Plays like a live app: three couples fill the table one by one,
 * a venue locks in, and the host confirms. Rests on the finished frame under
 * reduced motion.
 */

// six seats evenly around the table; paired into three couples (c: 0|1|2)
const SEATS = [
  { x: 50, y: 9, c: 0 },
  { x: 85, y: 30, c: 0 },
  { x: 85, y: 70, c: 1 },
  { x: 50, y: 91, c: 1 },
  { x: 15, y: 70, c: 2 },
  { x: 15, y: 30, c: 2 },
];
const COUPLE = ["from-sage/80 to-sage", "from-terracotta/70 to-terracotta", "from-[#caa791] to-[#b6836a]"];
const STATUS = [
  "Matching 3 compatible couples…",
  "2 of 3 couples locked in…",
  "Group complete — securing a table…",
  "Table reserved · Host confirmed",
];

export default function NightsScreen() {
  const step = useAutoStep(4, 1400, 3);
  const couplesShown = Math.min(step + 1, 3);
  const complete = step >= 2;
  const confirmed = step >= 3;

  return (
    <ScreenShell
      eyebrow="This Sunday · 8:00 PM"
      title="Board-Game Night"
      right={
        <span className="rounded-full bg-sage/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-sage">
          Table of 6
        </span>
      }
    >
      <div className="flex h-full flex-col px-5 pb-5">
        {/* the table scene */}
        <div className="relative mx-auto mt-1 aspect-square w-[84%]">
          <div className="absolute inset-[18%] rounded-full border border-dashed border-forest/15" />
          <div className="absolute left-1/2 top-1/2 grid h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-background shadow-medium">
            <Dice5 className="h-6 w-6 animate-pulse-soft" strokeWidth={1.5} />
          </div>
          {SEATS.map((s, i) => {
            const on = s.c < couplesShown;
            return (
              <div
                key={i}
                className="absolute -ml-4 -mt-4 h-8 w-8 transition-all duration-500 ease-botanical"
                style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: on ? 1 : 0.12, transform: on ? "scale(1)" : "scale(0.6)" }}
              >
                <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${COUPLE[s.c]} shadow-soft ring-2 ring-background`}>
                  {complete && on && <Check className="h-3.5 w-3.5 text-background" strokeWidth={2.5} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* venue fades in once the group completes */}
        <div
          className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-forest/60 transition-opacity duration-500"
          style={{ opacity: complete ? 1 : 0 }}
        >
          <MapPin className="h-3 w-3 text-sage" strokeWidth={1.75} />
          Independent Lounge · Dhoby Ghaut
        </div>

        {/* live status */}
        <div className="mt-auto">
          <div
            key={step}
            className={`animate-float-up flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-[11px] font-medium ${
              confirmed ? "bg-sage/15 text-forest ring-1 ring-sage/30" : "bg-card text-forest/70 ring-1 ring-stone"
            }`}
          >
            {confirmed ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-sage text-background">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-sage/30 border-t-sage" />
            )}
            {STATUS[step]}
          </div>
          <div
            className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-forest/50 transition-opacity duration-500"
            style={{ opacity: confirmed ? 1 : 0 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-terracotta" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
            </span>
            Live host confirmed — just show up &amp; play
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
