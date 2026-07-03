"use client";

import { Check } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 02 — the comprehensive compatibility quiz that feeds the matching
 * engine. Cycles through the real question types: how much an answer matters,
 * which answers you'd accept in a partner, personality prompts that score the
 * Big Five, and the resulting blueprint of traits + interests.
 */
const META = [
  { count: "Question 8 of 40", progress: 0.2 },
  { count: "Question 19 of 40", progress: 0.48 },
  { count: "Question 27 of 40", progress: 0.7 },
  { count: "Profile 96% complete", progress: 0.96 },
];

export default function QuizScreen() {
  const step = useAutoStep(4, 2800, 3);

  return (
    <ScreenShell
      eyebrow="Compatibility Quiz"
      title="Build your blueprint"
      right={<span className="text-[9px] font-medium text-forest/45">{META[step].count}</span>}
    >
      <div className="flex h-full flex-col px-5 pb-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone">
          <div
            className="h-full rounded-full bg-sage transition-all duration-700 ease-botanical"
            style={{ width: `${META[step].progress * 100}%` }}
          />
        </div>

        <div key={step} className="animate-float-up mt-5 flex-1">
          {step === 0 && <ImportanceQ />}
          {step === 1 && <AcceptQ />}
          {step === 2 && <PersonalityQ />}
          {step === 3 && <ResultCard />}
        </div>
      </div>
    </ScreenShell>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold uppercase tracking-widest text-sage">{children}</p>;
}
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 font-serif text-[17px] leading-snug text-forest">{children}</p>;
}

/** "How much does this matter to you" — a 1–5 importance scale. */
function ImportanceQ() {
  return (
    <div>
      <Eyebrow>What you value</Eyebrow>
      <Prompt>How much does it matter that your partner wants children?</Prompt>
      <div className="mt-9 flex items-center justify-between px-1">
        {[0, 1, 2, 3, 4].map((i) => {
          const selected = i === 3;
          return selected ? (
            <span
              key={i}
              className="animate-pop grid h-8 w-8 place-items-center rounded-full bg-sage text-background shadow-soft"
              style={{ animationDelay: "550ms" }}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          ) : (
            <span key={i} className="h-3.5 w-3.5 rounded-full border border-stone bg-card" />
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[9px] text-forest/40">
        <span>Not at all</span>
        <span>Dealbreaker</span>
      </div>
    </div>
  );
}

/** "Which answers could you accept" — multi-select lifestyle chips. */
const CHIPS = [
  { label: "Non-smoker", sel: true },
  { label: "Social drinker", sel: true },
  { label: "Gym regular", sel: false },
  { label: "Night owl", sel: false },
  { label: "Loves to travel", sel: true },
  { label: "Homebody", sel: true },
];
function AcceptQ() {
  return (
    <div>
      <Eyebrow>What you&rsquo;ll accept</Eyebrow>
      <Prompt>Which lifestyles could you happily live with?</Prompt>
      <div className="mt-5 flex flex-wrap gap-2">
        {CHIPS.map((c, i) => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] ring-1 ${
              c.sel
                ? "animate-pop bg-sage/15 text-forest ring-sage/40"
                : "bg-card text-forest/45 ring-stone"
            }`}
            style={c.sel ? { animationDelay: `${350 + i * 110}ms` } : undefined}
          >
            {c.sel && <Check className="h-3 w-3 text-sage" strokeWidth={3} />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Personality prompt on an agree–disagree slider (scores the Big Five). */
function PersonalityQ() {
  return (
    <div>
      <Eyebrow>Personality · Openness</Eyebrow>
      <Prompt>“I love trying things I&rsquo;ve never done before.”</Prompt>
      <div className="mt-9">
        <div className="relative h-1.5 rounded-full bg-stone">
          <div
            className="animate-grow-x absolute inset-y-0 left-1/2 origin-left rounded-full bg-sage"
            style={{ width: "42%", animationDelay: "500ms" }}
          />
          <span
            className="animate-pop absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-sage bg-card shadow-soft"
            style={{ left: "92%", marginLeft: "-12px", animationDelay: "650ms" }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[9px] text-forest/40">
          <span>Strongly disagree</span>
          <span>Strongly agree</span>
        </div>
      </div>
      <p className="mt-6 text-center text-[10px] text-sage">Feeds directly into your match algorithm</p>
    </div>
  );
}

/** The resulting blueprint — Big Five bars + interests. */
const TRAITS = [
  { label: "Openness", v: 88 },
  { label: "Conscientiousness", v: 74 },
  { label: "Extraversion", v: 61 },
  { label: "Agreeableness", v: 83 },
  { label: "Neuroticism", v: 29 },
];
function ResultCard() {
  return (
    <div>
      <Eyebrow>Your blueprint</Eyebrow>
      <Prompt>You&rsquo;re 96% match-ready.</Prompt>
      <div className="mt-4 space-y-2">
        {TRAITS.map((t, i) => (
          <div key={t.label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[10px] text-forest/60">{t.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone">
              <span
                className="animate-grow-x block h-full origin-left rounded-full bg-sage"
                style={{ width: `${t.v}%`, animationDelay: `${250 + i * 110}ms` }}
              />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-forest/40">Interests</p>
        <div className="flex flex-wrap gap-1.5">
          {["Live music", "Hawker crawls", "Board games", "Bouldering"].map((x) => (
            <span key={x} className="rounded-full bg-clay/40 px-2.5 py-1 text-[10px] text-forest/70">
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
