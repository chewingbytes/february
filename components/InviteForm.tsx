"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Mode = "phone" | "email";
type Tone = "light" | "onDark";

/**
 * The single request-an-invitation control, shared by the hero (phone / +65,
 * over the dark image) and the footer panel (email, on alabaster). No backend
 * yet — it validates locally and confirms. Swap `submit()` for a real endpoint.
 */
export default function InviteForm({
  mode = "email",
  tone = "light",
  className = "",
}: {
  mode?: Mode;
  tone?: Tone;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const isPhone = mode === "phone";
  const onDark = tone === "onDark";

  function validate(v: string) {
    const t = v.trim();
    if (isPhone) return /^[0-9]{8}$/.test(t.replace(/\s+/g, ""));
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(value)) {
      setError(true);
      return;
    }
    setError(false);
    setDone(true);
  }

  const field = onDark
    ? "border-background/25 bg-background/10 focus-within:border-background/70"
    : "border-stone bg-card-clay focus-within:border-sage";
  const text = onDark ? "text-background placeholder:text-background/50" : "text-forest placeholder:text-forest/40";
  const button = onDark
    ? "bg-background text-forest hover:bg-terracotta hover:text-background"
    : "bg-forest text-background hover:bg-terracotta";
  const helper = onDark ? "text-background/65" : "text-forest/45";

  if (done) {
    return (
      <div
        className={`flex items-center justify-center gap-2.5 rounded-full px-6 py-4 ${
          onDark ? "bg-background/10 text-background" : "bg-sage/12 text-forest"
        } ${className}`}
        role="status"
      >
        <Check strokeWidth={1.5} className={`h-5 w-5 ${onDark ? "" : "text-sage"}`} />
        <span className="text-sm">
          You&rsquo;re on the list — invitations roll out in small waves.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`w-full ${className}`} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div
          className={`flex h-14 flex-1 items-center gap-2 rounded-full border px-6 transition-colors duration-300 ${field} ${text}`}
        >
          {isPhone && (
            <span className="select-none text-base font-medium opacity-70">+65</span>
          )}
          <input
            type={isPhone ? "tel" : "email"}
            inputMode={isPhone ? "tel" : "email"}
            autoComplete={isPhone ? "tel-national" : "email"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(false);
            }}
            placeholder={isPhone ? "Enter your mobile number" : "Enter your email"}
            aria-label={isPhone ? "Mobile number" : "Email address"}
            aria-invalid={error}
            className="w-full bg-transparent text-base outline-none py-2"
          />
        </div>
        <button
          type="submit"
          className={`inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full px-8 text-sm font-medium uppercase tracking-widest transition-all duration-300 ease-botanical ${button}`}
        >
          Request an Invitation
          <ArrowRight strokeWidth={1.75} className="h-4 w-4" />
        </button>
      </div>
      <p className={`mt-4 text-xs tracking-wide transition-colors ${error ? "text-terracotta" : helper}`}>
        {error
          ? isPhone
            ? "Please enter a valid 8-digit Singapore mobile number."
            : "Please enter a valid email address."
          : isPhone
            ? "We text a single invitation link. No spam, no calls."
            : "We email invitations in waves. Unsubscribe anytime."}
      </p>
    </form>
  );
}
