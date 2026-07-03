"use client";

import { Dice5, Check, MapPin } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 01 — the goal: compatible matches out at a hosted game night.
 * Three couples fill the table one by one, the venue locks, the host confirms.
 */
const SEATS = [
  { x: 50, y: 8, c: 0 },
  { x: 86, y: 30, c: 0 },
  { x: 86, y: 70, c: 1 },
  { x: 50, y: 92, c: 1 },
  { x: 14, y: 70, c: 2 },
  { x: 14, y: 30, c: 2 },
];
const COUPLE = ["from-sage/80 to-sage", "from-terracotta/70 to-terracotta", "from-[#caa791] to-[#b6836a]"];
const STATUS = ["Matching couples…", "2 of 3 locked in…", "Booking your table…", "Table reserved · Host confirmed"];

export default function NightsScreen() {
  const step = useAutoStep(4, 1100, 3);
  const couplesShown = Math.min(step + 1, 3);
  const complete = step >= 2;
  const confirmed = step >= 3;

  return (
    <ScreenShell
      eyebrow="This Sunday · 8PM"
      title="Board-Game Night"
      right={
        <span className="rounded-full bg-sage/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-sage">
          Table of 6
        </span>
      }
    >
      <div className="flex h-full flex-col px-5 pb-5">
        <div className="relative mx-auto mt-2 aspect-square w-[90%]">
          <div className="absolute inset-[18%] rounded-full border border-dashed border-forest/15" />
          <div className="absolute left-1/2 top-1/2 grid h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-background shadow-medium">
            <Dice5 className="h-8 w-8 animate-pulse-soft" strokeWidth={1.5} />
          </div>
          {SEATS.map((s, i) => {
            const on = s.c < couplesShown;
            return (
              <div
                key={i}
                className="absolute -ml-5 -mt-5 h-10 w-10 transition-all duration-500 ease-botanical"
                style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: on ? 1 : 0.12, transform: on ? "scale(1)" : "scale(0.55)" }}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${COUPLE[s.c]} shadow-soft ring-2 ring-background`}>
                  {complete && on && <Check className="h-5 w-5 text-background" strokeWidth={2.5} />}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-forest/65 transition-opacity duration-500"
          style={{ opacity: complete ? 1 : 0 }}
        >
          <MapPin className="h-4 w-4 text-sage" strokeWidth={1.75} />
          Independent Lounge · Dhoby Ghaut
        </div>

        <div className="mt-auto">
          <div
            key={step}
            className={`animate-float-up flex items-center justify-center gap-2 rounded-full px-4 py-3 text-center text-[13px] font-medium ${
              confirmed ? "bg-sage/15 text-forest ring-1 ring-sage/30" : "bg-card text-forest/70 ring-1 ring-stone"
            }`}
          >
            {confirmed ? (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-sage text-background">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            ) : (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
            )}
            {STATUS[step]}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
