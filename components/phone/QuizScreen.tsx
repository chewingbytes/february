"use client";

import { Check } from "lucide-react";
import ScreenShell from "./ScreenShell";
import { useAutoStep } from "./useAutoStep";

/**
 * Phone Demo 02 — the compatibility quiz. Cycles through the question types that
 * feed the matching engine: how much an answer matters, what you'd accept, a
 * Big Five personality prompt, and the resulting blueprint. Big, glanceable,
 * few words.
 */
const META = [
  { count: "Q8 / 40", progress: 0.2 },
  { count: "Q19 / 40", progress: 0.48 },
  { count: "Q27 / 40", progress: 0.7 },
  { count: "96% done", progress: 0.96 },
];

export default function QuizScreen() {
  const step = useAutoStep(4, 1900, 3);

  return (
    <ScreenShell
      eyebrow="Compatibility Quiz"
      title="Build your blueprint"
      right={<span className="text-[10px] font-semibold text-forest/45">{META[step].count}</span>}
    >
      <div className="flex h-full flex-col px-5 pb-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone">
          <div
            className="h-full rounded-full bg-sage transition-all duration-700 ease-botanical"
            style={{ width: `${META[step].progress * 100}%` }}
          />
        </div>

        <div key={step} className="animate-float-up mt-6 flex-1">
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
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-sage">{children}</p>;
}
function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 font-serif text-[23px] leading-tight text-forest">{children}</p>;
}

/** How much does this matter — a 1–5 importance scale. */
function ImportanceQ() {
  return (
    <div>
      <Eyebrow>What matters</Eyebrow>
      <Prompt>Must they want kids?</Prompt>
      <div className="mt-11 flex items-center justify-between px-1">
        {[0, 1, 2, 3, 4].map((i) =>
          i === 3 ? (
            <span
              key={i}
              className="animate-pop grid h-11 w-11 place-items-center rounded-full bg-sage text-background shadow-soft"
              style={{ animationDelay: "350ms" }}
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </span>
          ) : (
            <span key={i} className="h-4 w-4 rounded-full border border-stone bg-card" />
          )
        )}
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-forest/45">
        <span>Not at all</span>
        <span>Dealbreaker</span>
      </div>
    </div>
  );
}

/** What you'd accept — multi-select lifestyle chips. */
const CHIPS = [
  { label: "Non-smoker", sel: true },
  { label: "Social drinker", sel: true },
  { label: "Night owl", sel: false },
  { label: "Loves travel", sel: true },
  { label: "Homebody", sel: true },
];
function AcceptQ() {
  return (
    <div>
      <Eyebrow>You&rsquo;d accept</Eyebrow>
      <Prompt>Which lifestyles work?</Prompt>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {CHIPS.map((c, i) => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] ring-1 ${
              c.sel ? "animate-pop bg-sage/15 text-forest ring-sage/40" : "bg-card text-forest/45 ring-stone"
            }`}
            style={c.sel ? { animationDelay: `${250 + i * 90}ms` } : undefined}
          >
            {c.sel && <Check className="h-3.5 w-3.5 text-sage" strokeWidth={3} />}
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
      <Prompt>“I love trying new things.”</Prompt>
      <div className="mt-11">
        <div className="relative h-2.5 rounded-full bg-stone">
          <div
            className="animate-grow-x absolute inset-y-0 left-1/2 origin-left rounded-full bg-sage"
            style={{ width: "42%", animationDelay: "350ms" }}
          />
          <span
            className="animate-pop absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-sage bg-card shadow-soft"
            style={{ left: "92%", marginLeft: "-16px", animationDelay: "450ms" }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-forest/45">
          <span>Disagree</span>
          <span>Agree</span>
        </div>
      </div>
    </div>
  );
}

/** The resulting blueprint — Big Five bars. */
const TRAITS = [
  { label: "Openness", v: 88 },
  { label: "Conscientious", v: 74 },
  { label: "Extraversion", v: 61 },
  { label: "Agreeable", v: 83 },
  { label: "Neuroticism", v: 29 },
];
function ResultCard() {
  return (
    <div>
      <Eyebrow>Your blueprint</Eyebrow>
      <Prompt>96% match-ready.</Prompt>
      <div className="mt-6 space-y-3">
        {TRAITS.map((t, i) => (
          <div key={t.label} className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[11px] text-forest/60">{t.label}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone">
              <span
                className="animate-grow-x block h-full origin-left rounded-full bg-sage"
                style={{ width: `${t.v}%`, animationDelay: `${200 + i * 90}ms` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
