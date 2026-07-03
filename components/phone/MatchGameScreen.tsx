"use client";

import { Sparkles, Heart, Check } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 03 — the moment you match: chat stays locked, you play. Cycles
 * quickly through three big, glanceable minigames — This or That, Guessary
 * (guess your match's answer), and a Guessary spice-tolerance slider.
 */
const PARTICLES = [
  { left: "18%", delay: 0, color: "bg-sage" },
  { left: "40%", delay: 0.35, color: "bg-blush" },
  { left: "60%", delay: 0.15, color: "bg-sage/80" },
  { left: "82%", delay: 0.5, color: "bg-blush" },
];

export default function MatchGameScreen() {
  const game = useAutoStep(3, 2200, 0);

  return (
    <ScreenShell
      eyebrow="It's a match · Chat locked"
      title="Play to break the ice"
      right={
        <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/12 px-2 py-1 text-[11px] font-semibold text-terracotta">
          <Heart className="h-3 w-3 fill-terracotta text-terracotta" strokeWidth={0} />
          {3 + game}
        </span>
      }
    >
      <div className="flex h-full flex-col px-5 pb-5">
        <div className="flex items-center justify-center gap-3 pb-3">
          <Avatar tone="from-sage/80 to-sage" letter="Y" />
          <div className="flex flex-col items-center">
            <Sparkles className="h-5 w-5 animate-pulse-soft text-terracotta" strokeWidth={1.75} />
            <span className="text-[9px] uppercase tracking-widest text-forest/40">You + Jordan</span>
          </div>
          <Avatar tone="from-terracotta/70 to-terracotta" letter="J" />
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone">
          <div key={game} className="animate-deplete h-full origin-left rounded-full bg-terracotta" />
        </div>

        <div key={game} className="animate-float-up mt-5 flex-1">
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
      className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${tone} text-[13px] font-semibold text-background ring-2 ring-background`}
    >
      {letter}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-sage">{children}</p>;
}
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-serif text-[22px] leading-tight text-forest">{children}</p>;
}

function Synced({ text, delay }: { text: string; delay: number }) {
  return (
    <div className="relative mt-5">
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
        className="animate-pop flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sage/20 to-blush/25 py-2.5 ring-1 ring-sage/30"
        style={{ animationDelay: `${delay}ms` }}
      >
        <Sparkles className="h-4 w-4 text-sage" strokeWidth={1.75} />
        <span className="text-[13px] font-medium text-forest">{text}</span>
      </div>
    </div>
  );
}

const OPTIONS = [
  { label: "Hawker brunch", emoji: "🍜", chosen: true },
  { label: "Beach club", emoji: "🍹", chosen: false },
];
function ThisOrThat() {
  return (
    <div>
      <Eyebrow>This or That · R1</Eyebrow>
      <Prompt>Ideal Sunday reset?</Prompt>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <div
            key={o.label}
            className={`relative rounded-2xl p-4 pt-6 text-center ring-1 ${
              o.chosen ? "bg-sage/12 ring-sage/40" : "bg-card ring-stone"
            }`}
          >
            {o.chosen && (
              <div
                className="animate-pop absolute -top-3.5 left-1/2 flex -translate-x-1/2 -space-x-2"
                style={{ animationDelay: "450ms" }}
              >
                <Avatar tone="from-sage/80 to-sage" letter="Y" />
                <Avatar tone="from-terracotta/70 to-terracotta" letter="J" />
              </div>
            )}
            <div className="text-4xl">{o.emoji}</div>
            <p className="mt-2 text-[14px] font-medium text-forest">{o.label}</p>
          </div>
        ))}
      </div>
      <Synced text="You both picked hawker" delay={750} />
    </div>
  );
}

const GUESS = [
  { label: "Big night out", pick: false },
  { label: "Quiet night in", pick: true },
  { label: "Solo dawn run", pick: false },
];
function Guessary() {
  return (
    <div>
      <Eyebrow>Guessary · R2</Eyebrow>
      <Prompt>How does Jordan recharge?</Prompt>
      <div className="mt-4 space-y-2.5">
        {GUESS.map((o) => (
          <div
            key={o.label}
            className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-[14px] ring-1 ${
              o.pick ? "bg-sage/12 text-forest ring-sage/40" : "bg-card text-forest/55 ring-stone"
            }`}
          >
            <span>{o.label}</span>
            {o.pick && (
              <span className="flex items-center gap-1.5">
                <span
                  className="animate-pop rounded-full bg-forest px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-background"
                  style={{ animationDelay: "450ms" }}
                >
                  You
                </span>
                <span
                  className="animate-pop grid h-6 w-6 place-items-center rounded-full bg-sage text-background"
                  style={{ animationDelay: "850ms" }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
      <Synced text="Spot on — same brain" delay={1000} />
    </div>
  );
}

function SpiceGuess() {
  return (
    <div>
      <Eyebrow>Guessary · R3</Eyebrow>
      <Prompt>Jordan&rsquo;s spice tolerance?</Prompt>
      <div className="mt-12 px-1">
        <div className="relative h-2.5 rounded-full bg-gradient-to-r from-clay via-terracotta/60 to-terracotta">
          <span
            className="animate-pop absolute top-1/2 -ml-4 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-2 border-forest bg-background text-[11px] font-bold text-forest shadow-soft"
            style={{ left: "54%", animationDelay: "450ms" }}
          >
            Y
          </span>
          <span
            className="animate-pop absolute top-1/2 -ml-4 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-2 border-terracotta bg-terracotta text-[11px] font-bold text-background shadow-soft"
            style={{ left: "80%", animationDelay: "950ms" }}
          >
            J
          </span>
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-forest/45">
          <span>🥛 Mild</span>
          <span>Extra 🌶️</span>
        </div>
      </div>
      <div
        className="animate-pop mt-8 flex items-center justify-center rounded-full bg-terracotta/12 py-2.5 text-center ring-1 ring-terracotta/30"
        style={{ animationDelay: "1150ms" }}
      >
        <span className="text-[13px] font-medium text-forest">Off by one — Jordan runs hot 🌶️</span>
      </div>
    </div>
  );
}
