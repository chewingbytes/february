"use client";

import { Sparkles, Heart, Check } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 03 — what happens the moment you match: text chat stays locked and
 * you play. Cycles quickly through three live minigames — "This or That",
 * "Guessary" (guess your match's answer to a deep question), and a Guessary
 * spice-tolerance slider — with a draining round timer and synced-answer
 * particles. Rests on the first game under reduced motion.
 */
const PARTICLES = [
  { left: "18%", delay: 0, color: "bg-sage" },
  { left: "38%", delay: 0.45, color: "bg-blush" },
  { left: "58%", delay: 0.2, color: "bg-sage/80" },
  { left: "78%", delay: 0.6, color: "bg-blush" },
];

export default function MatchGameScreen() {
  const game = useAutoStep(3, 3200, 0);

  return (
    <ScreenShell
      eyebrow="It's a match · Chat locked"
      title="Play to break the ice"
      right={
        <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/12 px-2 py-1 text-[10px] font-semibold text-terracotta">
          <Heart className="h-3 w-3 fill-terracotta text-terracotta" strokeWidth={0} />
          {3 + game}
        </span>
      }
    >
      <div className="flex h-full flex-col px-5 pb-5">
        <div className="flex items-center justify-center gap-3 pb-3">
          <Avatar tone="from-sage/80 to-sage" letter="Y" />
          <div className="flex flex-col items-center">
            <Sparkles className="h-4 w-4 animate-pulse-soft text-terracotta" strokeWidth={1.75} />
            <span className="text-[8px] uppercase tracking-widest text-forest/40">You + Jordan</span>
          </div>
          <Avatar tone="from-terracotta/70 to-terracotta" letter="J" />
        </div>

        {/* round timer */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-stone">
          <div key={game} className="animate-deplete h-full origin-left rounded-full bg-terracotta" />
        </div>

        <div key={game} className="animate-float-up mt-4 flex-1">
          {game === 0 && <ThisOrThat />}
          {game === 1 && <Guessary />}
          {game === 2 && <SpiceGuess />}
        </div>
      </div>
    </ScreenShell>
  );
}

function Avatar({ tone, letter }: { tone: string; letter: string }) {
  return (
    <span
      className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${tone} text-[12px] font-semibold text-background ring-2 ring-background`}
    >
      {letter}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold uppercase tracking-widest text-sage">{children}</p>;
}
function Question({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-serif text-[16px] leading-snug text-forest">{children}</p>;
}

/** Celebratory pill with rising particles — a synced/correct moment. */
function Synced({ text, delay }: { text: string; delay: number }) {
  return (
    <div className="relative mt-4">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1 h-6">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`animate-float-particle absolute top-3 h-1.5 w-1.5 rounded-full ${p.color}`}
            style={{ left: p.left, animationDelay: `${delay / 1000 + 0.2 + p.delay}s` }}
          />
        ))}
      </div>
      <div
        className="animate-pop flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sage/20 to-blush/25 py-2 ring-1 ring-sage/30"
        style={{ animationDelay: `${delay}ms` }}
      >
        <Sparkles className="h-3.5 w-3.5 text-sage" strokeWidth={1.75} />
        <span className="text-[11px] font-medium text-forest">{text}</span>
      </div>
    </div>
  );
}

/** Tap game: both quietly pick, then the app reveals they agree. */
const OPTIONS = [
  { label: "Hawker brunch", emoji: "🍜", chosen: true },
  { label: "Beach club", emoji: "🍹", chosen: false },
];
function ThisOrThat() {
  return (
    <div>
      <Eyebrow>This or That · Round 1</Eyebrow>
      <Question>Your ideal Sunday reset?</Question>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <div
            key={o.label}
            className={`relative rounded-xl p-3 pt-5 text-center ring-1 ${
              o.chosen ? "bg-sage/12 ring-sage/40" : "bg-card ring-stone"
            }`}
          >
            {o.chosen && (
              <div
                className="animate-pop absolute -top-3 left-1/2 flex -translate-x-1/2 -space-x-1.5"
                style={{ animationDelay: "550ms" }}
              >
                <Avatar tone="from-sage/80 to-sage" letter="Y" />
                <Avatar tone="from-terracotta/70 to-terracotta" letter="J" />
              </div>
            )}
            <div className="text-2xl">{o.emoji}</div>
            <p className="mt-1 text-[12px] font-medium text-forest">{o.label}</p>
          </div>
        ))}
      </div>
      <Synced text="You both picked hawker brunch" delay={900} />
    </div>
  );
}

/** Guessary: guess your match's answer to a deep personality question. */
const GUESS = [
  { label: "Big night out with the crew", pick: false },
  { label: "A quiet night in", pick: true },
  { label: "A long solo run at dawn", pick: false },
];
function Guessary() {
  return (
    <div>
      <Eyebrow>Guessary · Round 2</Eyebrow>
      <Question>How does Jordan actually recharge after a rough week?</Question>
      <p className="mt-1 text-[9px] text-forest/40">Guess their answer — see how well you read them</p>
      <div className="mt-3 space-y-2">
        {GUESS.map((o) => (
          <div
            key={o.label}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] ring-1 ${
              o.pick ? "bg-sage/12 text-forest ring-sage/40" : "bg-card text-forest/55 ring-stone"
            }`}
          >
            <span>{o.label}</span>
            {o.pick && (
              <span className="flex items-center gap-1.5">
                <span
                  className="animate-pop rounded-full bg-forest px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-background"
                  style={{ animationDelay: "550ms" }}
                >
                  You
                </span>
                <span
                  className="animate-pop grid h-5 w-5 place-items-center rounded-full bg-sage text-background"
                  style={{ animationDelay: "1050ms" }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
      <Synced text="Spot on — you really get Jordan" delay={1200} />
    </div>
  );
}

/** Guessary slider: guess how much spice your match can handle. */
function SpiceGuess() {
  return (
    <div>
      <Eyebrow>Guessary · Round 3</Eyebrow>
      <Question>How much spice can Jordan really handle?</Question>
      <p className="mt-1 text-[9px] text-forest/40">Slide to guess their heat threshold</p>

      <div className="mt-10 px-1">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-clay via-terracotta/60 to-terracotta">
          <span
            className="animate-pop absolute top-1/2 -ml-3 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border-2 border-forest bg-background text-[8px] font-bold text-forest shadow-soft"
            style={{ left: "54%", animationDelay: "600ms" }}
          >
            Y
          </span>
          <span
            className="animate-pop absolute top-1/2 -ml-3 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border-2 border-terracotta bg-terracotta text-[8px] font-bold text-background shadow-soft"
            style={{ left: "80%", animationDelay: "1150ms" }}
          >
            J
          </span>
        </div>
        <div className="mt-3 flex justify-between text-[9px] text-forest/40">
          <span>🥛 Mild</span>
          <span>Extra spicy 🌶️🌶️🌶️</span>
        </div>
      </div>

      <div
        className="animate-pop mt-6 flex items-center justify-center gap-1.5 rounded-full bg-terracotta/12 py-2 text-center ring-1 ring-terracotta/30"
        style={{ animationDelay: "1350ms" }}
      >
        <span className="text-[11px] font-medium text-forest">Off by one chilli — Jordan runs hot 🌶️</span>
      </div>
    </div>
  );
}
