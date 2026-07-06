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
  Sparkles,
} from "lucide-react";

/**
 * The pilot-event application — a one-question-at-a-time wizard that writes a
 * row to the Supabase `questionnaire` table. Two hard filters short-circuit to a
 * terminal screen instead of finishing:
 *   • Q3 "not available Saturday"  → the "next event" screen (captures WhatsApp).
 *   • Q4 "just casual / networking" → a polite decline.
 * Everything else flows through to WhatsApp and submits as a qualified lead.
 *
 * The founder does the actual pairing by hand on Thursday (age gaps, matched
 * values, energy balance) — this only collects clean, structured answers.
 */

type HardFail = "unavailable" | "casual";
type Choice = { value: string; label: string; sub?: string; hardFail?: HardFail };
type Question = {
  id: string;
  part: string;
  q: string;
  help?: string;
} & (
  | { kind: "choice"; options: Choice[] }
  | { kind: "number" | "text" | "phone"; placeholder: string }
);

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
    q: "Are you free this Saturday evening, July 11, in central Singapore?",
    help: "The pilot night is a fixed date — you'll need to be there in person.",
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
  {
    id: "whatsapp",
    part: "Almost there",
    kind: "phone",
    q: "Drop your WhatsApp number.",
    help: "If you're in, we will drop you a message. Singapore numbers only.",
    placeholder: "mobile number",
  },
];

const TOTAL = QUESTIONS.length;

type SaveState = "idle" | "saving" | "error" | "done";

export default function QuestionnaireForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [terminal, setTerminal] = useState<HardFail | "qualified" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const casualSaved = useRef(false);

  const question = QUESTIONS[step];
  const value = answers[question.id] ?? "";

  function set(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }));
    if (error) setError(null);
  }

  // Assemble the DB row from whatever we've collected so far.
  function buildRow(status: string) {
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
      whatsapp: answers.whatsapp?.trim() ? `+65 ${answers.whatsapp.trim()}` : null,
    };
  }

  async function save(status: string) {
    setSaveState("saving");
    const { error: dbError } = await supabase.from("questionnaire").insert(buildRow(status));
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

  // Validate + advance from a typed answer (age / dealbreaker / whatsapp).
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
    if (question.kind === "phone" && !/^[0-9]{8}$/.test(v.replace(/\s+/g, ""))) {
      return setError("Please enter a valid Singapore number.");
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
        setWhatsApp={(v) => set("whatsapp", v)}
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
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <div className="flex h-14 items-center gap-2 rounded-2xl border border-stone bg-card-clay px-5 transition-colors focus-within:border-sage">
              {question.kind === "phone" && (
                <span className="select-none text-base font-medium text-forest/60">+65</span>
              )}
              <input
                autoFocus
                type={question.kind === "number" ? "number" : question.kind === "phone" ? "tel" : "text"}
                inputMode={
                  question.kind === "number" ? "numeric" : question.kind === "phone" ? "tel" : "text"
                }
                value={value}
                onChange={(e) => set(question.id, e.target.value)}
                placeholder={question.placeholder}
                aria-label={question.q}
                maxLength={question.kind === "text" ? 80 : question.kind === "phone" ? 11 : 3}
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
  setWhatsApp,
  onWaitlist,
}: {
  kind: HardFail | "qualified";
  saveState: SaveState;
  onRetry: () => void;
  answers: Record<string, string>;
  setWhatsApp: (v: string) => void;
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
              We review every application by hand and pair matches on Thursday. If it&rsquo;s a
              fit, your PayNow confirmation lands on{" "}
              <span className="font-medium text-forest">WhatsApp</span> before Saturday. Keep an
              eye on it.
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

  // unavailable → capture a number for the next night
  const wa = answers.whatsapp ?? "";
  const valid = /^[0-9]{8}$/.test(wa.replace(/\s+/g, ""));
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
            out on WhatsApp with the date.
          </p>
          <HomeLink />
        </>
      ) : (
        <>
          <p className="text-[15px] leading-relaxed text-forest/60">
            No worries — this Saturday won&rsquo;t work, but we run these regularly. Drop your
            WhatsApp and we&rsquo;ll invite you to the next one.
          </p>
          <div className="mt-6 flex h-14 items-center gap-2 rounded-2xl border border-stone bg-card-clay px-5 transition-colors focus-within:border-sage">
            <span className="select-none text-base font-medium text-forest/60">+65</span>
            <input
              type="tel"
              inputMode="tel"
              value={wa}
              onChange={(e) => setWhatsApp(e.target.value)}
              placeholder="mobile number"
              aria-label="WhatsApp number"
              maxLength={11}
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
