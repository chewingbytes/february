"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CalendarClock,
  Loader2,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";

/**
 * The pilot-event application — a one-question-at-a-time wizard that writes a
 * row to the Supabase `questionnaire` table. Two hard filters short-circuit to a
 * terminal screen instead of finishing:
 *   • Q3 "not available Saturday"  → the "next event" screen (captures Telegram).
 *   • Q4 "just casual / networking" → a polite decline.
 * Everything else collects a Telegram username and submits as a qualified lead.
 *
 * The founder does the actual pairing by hand on Thursday (age gaps, matched
 * values, energy balance) — this only collects clean, structured answers.
 */

type HardFail = "unavailable" | "casual";
type Choice = { value: string; label: string; sub?: string; hardFail?: HardFail };
type MatchOption = { value: string; label: string };
type Question = {
  id: string;
  part: string;
  q: string;
  help?: string;
} & (
  | { kind: "choice"; options: Choice[] }
  | { kind: "match"; options: MatchOption[] }
  | { kind: "age_pref" }
  | { kind: "number" | "text" | "telegram"; placeholder: string }
);

// OkCupid-style importance weights for the matching questions.
const IMPORTANCE = [
  { value: "irrelevant", label: "Irrelevant" },
  { value: "a_little", label: "A Little" },
  { value: "somewhat", label: "Somewhat" },
  { value: "very", label: "Very" },
] as const;
type Importance = (typeof IMPORTANCE)[number]["value"];

// Compatibility questions — each shown on a single page with three parts: your
// own answer, the answers you'd accept from a partner, and how much it matters.
// Value keys drive the UI; buildMatchAnswers() serialises them to the literal
// question + answer text for the `match_answers` jsonb column.
const MATCH_QUESTIONS: Question[] = [
  {
    id: "abstract",
    part: "Mind & Soul",
    kind: "match",
    q: "Do you enjoy discussing abstract concepts, philosophy, or “what if” scenarios that have no real-world application?",
    options: [
      { value: "yes", label: "Yes, I find those conversations fascinating." },
      { value: "no", label: "No, I prefer talking about concrete reality and practical matters." },
    ],
  },
  {
    id: "art_moved",
    part: "Mind & Soul",
    kind: "match",
    q: "How often do you find yourself deeply moved by a piece of art, music, literature, or a beautiful view?",
    options: [
      { value: "often", label: "Often. I am very sensitive to art and beauty." },
      { value: "rarely", label: "Rarely or never. I appreciate them, but they don't move me deeply." },
    ],
  },
  {
    id: "tidiness",
    part: "Daily Life",
    kind: "match",
    q: "How neat and organized is your current living space?",
    options: [
      { value: "immaculate", label: "Immaculate. Everything has a proper place." },
      { value: "average", label: "Average. There is some clutter, but it's generally clean." },
      { value: "messy", label: "Messy. I clean only when I absolutely have to." },
    ],
  },
  {
    id: "punctuality",
    part: "Daily Life",
    kind: "match",
    q: "If you make casual plans with a friend to meet at 7:00 PM, what time do you usually show up?",
    options: [
      { value: "on_time", label: "Early or exactly on time (6:50 - 7:00)." },
      { value: "slightly_late", label: "Slightly late (7:05 - 7:15)." },
      { value: "late", label: "Fashionably late / when I get there (7:20 or later)." },
    ],
  },
  {
    id: "solo_social",
    part: "Social Style",
    kind: "match",
    q: "Would you attend a large social event, party, or networking mixer completely by yourself?",
    options: [
      { value: "sure", label: "Sure, I enjoy meeting new people on my own." },
      { value: "reluctant", label: "Only if I absolutely had to, but I'd hate it." },
      { value: "no", label: "No way. I need a wingman or a friend with me." },
    ],
  },
  {
    id: "leadership",
    part: "Social Style",
    kind: "match",
    q: "In a group setting where a decision needs to be made, do you naturally take charge and speak up first?",
    options: [
      { value: "lead", label: "Yes, I tend to lead or express my opinion loudly." },
      { value: "listen", label: "No, I prefer to listen first and follow the group consensus." },
    ],
  },
  {
    id: "trust",
    part: "Connection",
    kind: "match",
    q: "When you meet someone new, what is your default assumption about their intentions?",
    options: [
      { value: "trusting", label: "I trust them automatically until they give me a reason not to." },
      { value: "skeptical", label: "I am skeptical and cautious until they prove they are trustworthy." },
    ],
  },
  {
    id: "conflict",
    part: "Connection",
    kind: "match",
    q: "During a minor disagreement with a partner, what is your primary goal?",
    options: [
      { value: "peace", label: "To keep the peace and find a compromise quickly, even if I give in a bit." },
      { value: "debate", label: "To debate the point thoroughly and make sure the correct logic wins out." },
    ],
  },
  {
    id: "overthinking",
    part: "Inner World",
    kind: "match",
    q: "How often do you find yourself overthinking past conversations or worrying about things that might go wrong in the future?",
    options: [
      { value: "constantly", label: "Constantly. My mind is always racing with worries." },
      { value: "occasionally", label: "Occasionally, but I can shake it off." },
      { value: "rarely", label: "Rarely. I live in the moment and rarely worry." },
    ],
  },
  {
    id: "mood",
    part: "Inner World",
    kind: "match",
    q: "Does your mood fluctuate wildly throughout the day based on small events, or do you stay mostly even-keeled?",
    options: [
      { value: "fluctuates", label: "My mood changes a lot; I feel highs and lows intensely." },
      { value: "steady", label: "I am very steady; my mood rarely changes drastically." },
    ],
  },
];

const QUESTIONS: Question[] = [
  {
    id: "age",
    part: "Logistics",
    kind: "number",
    q: "How old are you?",
    help: "We pair matches within a couple of years of each other.",
    placeholder: "Your age",
  },
  {
    id: "age_pref",
    part: "Logistics",
    kind: "age_pref",
    q: "Open to an age gap?",
    help: "We pair within a few years by default — tell us how far you'd stretch, in either direction.",
  },
  {
    id: "gender_pref",
    part: "Logistics",
    kind: "choice",
    q: "Who are you hoping to meet?",
    options: [
      { value: "man_seeking_woman", label: "I'm a man", sub: "looking to meet a woman" },
      { value: "woman_seeking_man", label: "I'm a woman", sub: "looking to meet a man" },
    ],
  },
  {
    id: "available",
    part: "Logistics",
    kind: "choice",
    q: "Are you free this Saturday evening, July 18, in central Singapore?",
    help: "The event night is a fixed date — you'll need to be there in person.",
    options: [
      { value: "yes", label: "Yes — lock me in.", sub: "I'm free Saturday evening." },
      {
        value: "no",
        label: "No, or I'm not sure.",
        sub: "Another date would be better.",
        hardFail: "unavailable",
      },
    ],
  },
  {
    id: "looking_for",
    part: "Intent",
    kind: "choice",
    q: "What are you actually looking for right now?",
    options: [
      { value: "serious", label: "A serious relationship", sub: "A long-term partner." },
      { value: "open", label: "Open to dating", sub: "Seeing where it goes." },
      {
        value: "casual",
        label: "Casual fun / networking",
        sub: "Nothing serious for now.",
        hardFail: "casual",
      },
    ],
  },
  {
    id: "top_value",
    part: "Intent",
    kind: "choice",
    q: "In a relationship, which of these matters to you the most?",
    help: "Pick the one that matters most — we match people who choose the same.",
    options: [
      { value: "ambition", label: "Ambition & Drive", sub: "Growth mindset, career and personal goals." },
      { value: "empathy", label: "Empathy & Communication", sub: "Emotional intelligence, deep talks." },
      { value: "lifestyle", label: "Shared Lifestyle & Fun", sub: "Activities, travel, humour, chilling." },
    ],
  },
  {
    id: "energy_level",
    part: "The Vibe",
    kind: "choice",
    q: "What's your energy in a group setting?",
    options: [
      { value: "hype", label: "The Hype", sub: "Outgoing, keeps the energy high." },
      { value: "chill", label: "The Chill Observer", sub: "Calm, low-key, speaks when spoken to." },
      { value: "balanced", label: "The Balanced Contributor", sub: "Adaptable, comfortable, no spotlight needed." },
    ],
  },
  {
    id: "competitiveness",
    part: "The Vibe",
    kind: "choice",
    q: "How competitive are you at board games?",
    options: [
      { value: "win", label: "Play to win", sub: "I optimise every turn." },
      { value: "laughs", label: "Play for laughs", sub: "Don't care who wins, as long as it's fun." },
    ],
  },
  {
    id: "dealbreaker",
    part: "The Vibe",
    kind: "text",
    q: "One non-negotiable dealbreaker when you're dating?",
    help: "Keep it brief — e.g. smoking, values, anything you can't look past.",
    placeholder: "Your one dealbreaker",
  },
  ...MATCH_QUESTIONS,
  {
    id: "telegram",
    part: "Almost there",
    kind: "telegram",
    q: "What's your Telegram?",
    help: "If it's a match, we'll message you the details before Saturday.",
    placeholder: "username",
  },
];

const TOTAL = QUESTIONS.length;

// Telegram usernames: 5–32 chars, letters, numbers and underscores.
const TG_HANDLE = /^[a-zA-Z0-9_]{5,32}$/;

// Normalise whatever the applicant types into a clean "@username" — also copes
// with a pasted t.me link or a leading @ — or null when empty.
function normalizeHandle(raw?: string): string | null {
  if (!raw) return null;
  const h = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/\/+$/, "")
    .replace(/^@+/, "")
    .replace(/\s+/g, "");
  return h ? `@${h}` : null;
}

type SaveState = "idle" | "saving" | "error" | "done";

export default function QuestionnaireForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [terminal, setTerminal] = useState<HardFail | "qualified" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // OkCupid-style matching answers: per question id → your own pick, the
  // answers you'd accept from a partner, and how much it matters.
  const [matchAnswers, setMatchAnswers] = useState<
    Record<string, { self?: string; accept: string[]; weight?: Importance }>
  >({});
  // Age-gap preference: whether they'd date younger/older and, for each
  // direction they'd accept, how many years they'd stretch.
  const [agePref, setAgePref] = useState<{
    younger: boolean;
    older: boolean;
    maxYounger: number;
    maxOlder: number;
  }>({ younger: false, older: false, maxYounger: 5, maxOlder: 5 });
  const casualSaved = useRef(false);

  const question = QUESTIONS[step];
  const value = answers[question.id] ?? "";
  const match = matchAnswers[question.id];

  function set(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }));
    if (error) setError(null);
  }

  // Set your own answer or the importance weight on a matching question.
  function updateMatch(
    id: string,
    patch: Partial<{ self: string; weight: Importance }>
  ) {
    setMatchAnswers((m) => {
      const cur = m[id] ?? { accept: [] };
      return { ...m, [id]: { ...cur, ...patch } };
    });
    if (error) setError(null);
  }

  // Toggle one accepted-from-partner answer on a matching question.
  function toggleAccept(id: string, val: string) {
    setMatchAnswers((m) => {
      const cur = m[id] ?? { accept: [] };
      const accept = cur.accept.includes(val)
        ? cur.accept.filter((x) => x !== val)
        : [...cur.accept, val];
      return { ...m, [id]: { ...cur, accept } };
    });
    if (error) setError(null);
  }

  // Convert the internal value-keyed match answers into a legible object —
  // keyed by the literal question, with the literal answer + importance text —
  // so the DB row reads without needing a legend.
  function buildMatchAnswers() {
    const out: Record<
      string,
      { self: string; accept: string[]; weight: string }
    > = {};
    for (const q of MATCH_QUESTIONS) {
      if (q.kind !== "match") continue;
      const a = matchAnswers[q.id];
      if (!a?.self) continue;
      const label = (v: string) =>
        q.options.find((o) => o.value === v)?.label ?? v;
      out[q.q] = {
        self: label(a.self),
        accept: a.accept.map(label),
        weight: IMPORTANCE.find((w) => w.value === a.weight)?.label ?? "",
      };
    }
    return out;
  }

  // Assemble the DB row from whatever we've collected so far.
  function buildRow(status: string) {
    const matches = buildMatchAnswers();
    return {
      status,
      age: answers.age ? parseInt(answers.age, 10) : null,
      gender_pref: answers.gender_pref ?? null,
      available_saturday:
        answers.available != null ? answers.available === "yes" : null,
      looking_for: answers.looking_for ?? null,
      top_value: answers.top_value ?? null,
      energy_level: answers.energy_level ?? null,
      competitiveness: answers.competitiveness ?? null,
      dealbreaker: answers.dealbreaker?.trim() || null,
      accepts_younger: agePref.younger,
      accepts_older: agePref.older,
      max_years_younger: agePref.younger ? agePref.maxYounger : null,
      max_years_older: agePref.older ? agePref.maxOlder : null,
      telegram: normalizeHandle(answers.telegram),
      match_answers: Object.keys(matches).length ? matches : null,
    };
  }

  async function save(status: string) {
    setSaveState("saving");
    const { error: dbError } = await supabase
      .from("questionnaire")
      .insert(buildRow(status));
    if (dbError) {
      setSaveState("error");
      return false;
    }
    setSaveState("done");
    return true;
  }

  // Advance, or run a hard-filter branch, from a single-choice answer.
  function chooseAndAdvance(choice: Choice) {
    set(question.id, choice.value);
    if (choice.hardFail) {
      window.setTimeout(() => setTerminal(choice.hardFail!), 180);
      return;
    }
    window.setTimeout(() => setStep((s) => Math.min(s + 1, TOTAL - 1)), 200);
  }

  // Validate + advance from a typed answer (age / dealbreaker / telegram).
  function next() {
    const v = value.trim();
    if (question.kind === "number") {
      const n = parseInt(v, 10);
      if (!v || Number.isNaN(n)) return setError("Please enter your age.");
      if (n < 18) return setError("You must be 18 or older to join.");
      if (n > 99) return setError("Please enter a valid age.");
    }
    if (question.kind === "text" && v.length < 2) {
      return setError("A word or two is plenty — just fill this in.");
    }
    if (question.kind === "telegram") {
      if (!v) return setError("Please enter your Telegram username.");
      const handle = (normalizeHandle(v) ?? "").replace(/^@/, "");
      if (!TG_HANDLE.test(handle)) {
        return setError("Please enter a valid Telegram username.");
      }
    }
    if (question.kind === "match") {
      if (!match?.self) return setError("Pick your own answer first.");
      if (!match.accept.length)
        return setError("Choose at least one answer you'd accept from a partner.");
      if (!match.weight)
        return setError("Let us know how important this is to you.");
    }

    if (step === TOTAL - 1) {
      // Final question answered → submit as a qualified applicant.
      setTerminal("qualified");
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  // Terminal-screen side effects: qualified + casual submit once on arrival.
  useEffect(() => {
    if (terminal === "qualified" && saveState === "idle") {
      void save("qualified");
    }
    if (terminal === "casual" && !casualSaved.current) {
      casualSaved.current = true;
      void save("casual"); // best-effort analytics; screen shows regardless
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminal]);

  if (terminal) {
    return (
      <Terminal
        kind={terminal}
        saveState={saveState}
        onRetry={() => save("qualified")}
        answers={answers}
        setTelegram={(v) => set("telegram", v)}
        onWaitlist={() => save("waitlist_next")}
      />
    );
  }

  const progress = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <div className="w-full">
      {/* progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-sage">
          <span>{question.part}</span>
          <span className="text-forest/40">
            {step + 1} / {TOTAL}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone">
          <div
            className="h-full rounded-full bg-sage transition-all duration-500 ease-botanical"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="font-serif text-2xl font-semibold leading-tight text-forest md:text-3xl">
        {question.q}
      </h2>
      {question.help && (
        <p className="mt-3 text-sm leading-relaxed text-forest/55">{question.help}</p>
      )}

      <div className="mt-7">
        {question.kind === "choice" ? (
          <div className="space-y-3">
            {question.options.map((o) => {
              const selected = value === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => chooseAndAdvance(o)}
                  className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300 ease-botanical ${
                    selected
                      ? "border-sage bg-sage/10 ring-1 ring-sage"
                      : "border-stone bg-card-clay hover:border-sage/60 hover:bg-sage/5"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
                      selected ? "border-sage bg-sage text-background" : "border-stone text-transparent"
                    }`}
                  >
                    <Check strokeWidth={2.5} className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium text-forest">{o.label}</span>
                    {o.sub && <span className="mt-0.5 block text-[13px] text-forest/50">{o.sub}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : question.kind === "match" ? (
          <div className="space-y-7">
            {/* Part 1 — your own answer (single select) */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-sage">
                Your answer
              </p>
              <div className="space-y-2.5">
                {question.options.map((o) => {
                  const selected = match?.self === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => updateMatch(question.id, { self: o.value })}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ease-botanical ${
                        selected
                          ? "border-sage bg-sage/10 ring-1 ring-sage"
                          : "border-stone bg-card-clay hover:border-sage/60 hover:bg-sage/5"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                          selected ? "border-sage bg-sage text-background" : "border-stone text-transparent"
                        }`}
                      >
                        <Check strokeWidth={3} className="h-3 w-3" />
                      </span>
                      <span className="text-[14px] font-medium text-forest">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part 2 — answers you'd accept from a partner (multi-select) */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-sage">
                Answers you&rsquo;d accept from a partner
              </p>
              <p className="mb-3 mt-1 text-[13px] text-forest/45">
                Choose all that work for you.
              </p>
              <div className="space-y-2.5">
                {question.options.map((o) => {
                  const on = match?.accept.includes(o.value) ?? false;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleAccept(question.id, o.value)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ease-botanical ${
                        on
                          ? "border-terracotta bg-terracotta/10 ring-1 ring-terracotta"
                          : "border-stone bg-card-clay hover:border-terracotta/50 hover:bg-terracotta/5"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                          on ? "border-terracotta bg-terracotta text-background" : "border-stone text-transparent"
                        }`}
                      >
                        <Check strokeWidth={3} className="h-3 w-3" />
                      </span>
                      <span className="text-[14px] font-medium text-forest">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part 3 — how important is this to you */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-sage">
                How important is this to you?
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {IMPORTANCE.map((w) => {
                  const on = match?.weight === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => updateMatch(question.id, { weight: w.value })}
                      className={`rounded-xl border px-3 py-2.5 text-center text-[13px] font-medium transition-all duration-200 ease-botanical ${
                        on
                          ? "border-forest bg-forest text-background"
                          : "border-stone bg-card-clay text-forest/70 hover:border-forest/40"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : question.kind === "age_pref" ? (
          <div className="space-y-4">
            {(
              [
                {
                  key: "younger",
                  maxKey: "maxYounger",
                  label: "Someone younger than me",
                  dir: "younger",
                },
                {
                  key: "older",
                  maxKey: "maxOlder",
                  label: "Someone older than me",
                  dir: "older",
                },
              ] as const
            ).map((opt) => {
              const on = agePref[opt.key];
              const maxVal = agePref[opt.maxKey];
              return (
                <div
                  key={opt.key}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ease-botanical ${
                    on
                      ? "border-sage bg-sage/10 ring-1 ring-sage"
                      : "border-stone bg-card-clay hover:border-sage/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setAgePref((p) => ({ ...p, [opt.key]: !p[opt.key] }))
                    }
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                        on
                          ? "border-sage bg-sage text-background"
                          : "border-stone text-transparent"
                      }`}
                    >
                      <Check strokeWidth={3} className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[15px] font-medium text-forest">
                      {opt.label}
                    </span>
                  </button>

                  {on && (
                    <div className="flex items-center justify-between gap-3 border-t border-sage/25 px-4 py-3">
                      <span className="text-[13.5px] text-forest/70">
                        Up to{" "}
                        <span className="font-semibold text-forest">{maxVal}</span>{" "}
                        {maxVal === 1 ? "year" : "years"} {opt.dir}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Fewer years ${opt.dir}`}
                          disabled={maxVal <= 1}
                          onClick={() =>
                            setAgePref((p) => ({
                              ...p,
                              [opt.maxKey]: Math.max(1, p[opt.maxKey] - 1),
                            }))
                          }
                          className="grid h-9 w-9 place-items-center rounded-full border border-stone bg-background text-forest transition-colors hover:border-forest/40 disabled:opacity-40"
                        >
                          <Minus strokeWidth={2.5} className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-[15px] font-semibold text-forest">
                          {maxVal}
                        </span>
                        <button
                          type="button"
                          aria-label={`More years ${opt.dir}`}
                          disabled={maxVal >= 20}
                          onClick={() =>
                            setAgePref((p) => ({
                              ...p,
                              [opt.maxKey]: Math.min(20, p[opt.maxKey] + 1),
                            }))
                          }
                          className="grid h-9 w-9 place-items-center rounded-full border border-stone bg-background text-forest transition-colors hover:border-forest/40 disabled:opacity-40"
                        >
                          <Plus strokeWidth={2.5} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-[13px] leading-relaxed text-forest/45">
              Leave both off if you&rsquo;d rather only meet people right around
              your own age.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <div className="flex h-14 items-center gap-2 rounded-2xl border border-stone bg-card-clay px-5 transition-colors focus-within:border-sage">
              {question.kind === "telegram" && (
                <span className="select-none text-base font-medium text-forest/60">@</span>
              )}
              <input
                autoFocus
                type={question.kind === "number" ? "number" : "text"}
                inputMode={question.kind === "number" ? "numeric" : "text"}
                autoCapitalize={question.kind === "telegram" ? "none" : undefined}
                autoCorrect={question.kind === "telegram" ? "off" : undefined}
                spellCheck={question.kind === "telegram" ? false : undefined}
                value={value}
                onChange={(e) => set(question.id, e.target.value)}
                placeholder={question.placeholder}
                aria-label={question.q}
                maxLength={question.kind === "text" ? 80 : question.kind === "telegram" ? 32 : 3}
                className="w-full bg-transparent text-base text-forest outline-none placeholder:text-forest/35"
              />
            </div>
          </form>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {/* nav row */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest/50 transition-colors hover:text-forest"
          >
            <ArrowLeft strokeWidth={1.75} className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {question.kind !== "choice" && (
          <button
            type="button"
            onClick={next}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-sm font-medium uppercase tracking-widest text-background transition-colors duration-300 hover:bg-terracotta"
          >
            {step === TOTAL - 1 ? "Submit" : "Continue"}
            <ArrowRight strokeWidth={1.75} className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------- terminal screens --------------------------- */

function Terminal({
  kind,
  saveState,
  onRetry,
  answers,
  setTelegram,
  onWaitlist,
}: {
  kind: HardFail | "qualified";
  saveState: SaveState;
  onRetry: () => void;
  answers: Record<string, string>;
  setTelegram: (v: string) => void;
  onWaitlist: () => void;
}) {
  if (kind === "qualified") {
    return (
      <Shell
        icon={<Sparkles strokeWidth={1.5} className="h-7 w-7" />}
        tone="sage"
        title="You're in the running."
      >
        {saveState === "error" ? (
          <>
            <p className="text-[15px] leading-relaxed text-forest/60">
              Something went wrong saving your answers. Give it another tap.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-sm font-medium uppercase tracking-widest text-background transition-colors hover:bg-terracotta"
            >
              Try again
              <ArrowRight strokeWidth={1.75} className="h-4 w-4" />
            </button>
          </>
        ) : saveState === "saving" ? (
          <p className="inline-flex items-center gap-2 text-[15px] text-forest/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Sending your answers…
          </p>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-forest/60">
              We review every application by hand and pair matches on Thursday. If it&rsquo;s a fit, we&rsquo;ll message you on
              <span className="font-medium text-forest"> Telegram</span> before Saturday.
            </p>
            <HomeLink />
          </>
        )}
      </Shell>
    );
  }

  if (kind === "casual") {
    return (
      <Shell
        icon={<span className="text-2xl">🫶</span>}
        tone="clay"
        title="Maybe not this one."
      >
        <p className="text-[15px] leading-relaxed text-forest/60">
          Player 2 &rsquo;s first night is built for people chasing something real. No hard
          feelings at all — if that changes, we&rsquo;d love to have you at a future event.
        </p>
        <HomeLink />
      </Shell>
    );
  }

  // unavailable → capture a username for the next night
  const tg = answers.telegram ?? "";
  const valid = TG_HANDLE.test((normalizeHandle(tg) ?? "").replace(/^@/, ""));
  return (
    <Shell
      icon={<CalendarClock strokeWidth={1.5} className="h-7 w-7" />}
      tone="terracotta"
      title="Let's catch the next one."
    >
      {saveState === "done" ? (
        <>
          <p className="text-[15px] leading-relaxed text-forest/60">
            Got it — you&rsquo;re on the list for the next Player 2 game night. We&rsquo;ll reach
            out on Telegram with the date.
          </p>
          <HomeLink />
        </>
      ) : (
        <>
          <p className="text-[15px] leading-relaxed text-forest/60">
            No worries — this Saturday won&rsquo;t work, but we run these regularly. Drop your
            Telegram and we&rsquo;ll invite you to the next one.
          </p>
          <div className="mt-6 flex h-14 items-center gap-2 rounded-2xl border border-stone bg-card-clay px-5 transition-colors focus-within:border-sage">
            <span className="select-none text-base font-medium text-forest/60">@</span>
            <input
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={tg}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="username"
              aria-label="Telegram username"
              maxLength={32}
              className="w-full bg-transparent text-base text-forest outline-none placeholder:text-forest/35"
            />
          </div>
          <button
            type="button"
            disabled={!valid || saveState === "saving"}
            onClick={onWaitlist}
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-sm font-medium uppercase tracking-widest text-background transition-colors duration-300 hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                Notify me
                <ArrowRight strokeWidth={1.75} className="h-4 w-4" />
              </>
            )}
          </button>
          {saveState === "error" && (
            <p className="mt-4 text-sm text-terracotta">
              Couldn&rsquo;t save that — please try once more.
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({
  icon,
  tone,
  title,
  children,
}: {
  icon: React.ReactNode;
  tone: "sage" | "clay" | "terracotta";
  title: string;
  children: React.ReactNode;
}) {
  const ring = {
    sage: "bg-sage/12 text-sage",
    clay: "bg-clay/50 text-forest/70",
    terracotta: "bg-terracotta/12 text-terracotta",
  }[tone];
  return (
    <div className="text-center">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${ring}`}>
        {icon}
      </span>
      <h2 className="mt-6 font-serif text-3xl font-semibold leading-tight text-forest md:text-4xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function HomeLink() {
  return (
    <Link
      href="/"
      className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-terracotta"
    >
      <ArrowLeft strokeWidth={1.75} className="h-4 w-4" />
      Back to playertwo.place
    </Link>
  );
}
