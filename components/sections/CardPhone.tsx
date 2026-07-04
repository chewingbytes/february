/**
 * A phone mockup tilted in 3D that floats in a card's background and plays a
 * looping "mini-app" of the step it illustrates. Everything is CSS-only (no JS,
 * no state) so it can live in a server component; each loop's *resting* frame is
 * its natural, un-animated state, so it degrades to a sensible still under
 * `prefers-reduced-motion`. Decorative — the whole thing is aria-hidden.
 */
export function CardPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-0 flex animate-bob justify-center" aria-hidden>
      <div className="[perspective:1000px]">
        {/* the tilt — gently straightens toward the viewer when the card is hovered */}
        <div className="mt-2 [transform-style:preserve-3d] [transform:rotateX(7deg)_rotateY(-13deg)_rotateZ(-5deg)] transition-transform duration-700 ease-botanical group-hover/card:[transform:rotateX(3deg)_rotateY(-7deg)_rotateZ(-2deg)]">
          <PhoneShell>{children}</PhoneShell>
        </div>
      </div>
    </div>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[290px] w-[145px] rounded-[30px] bg-forest p-[5px] shadow-[0_28px_50px_-14px_rgba(45,58,49,0.5)] ring-1 ring-forest/50">
      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-background">
        <span className="absolute left-1/2 top-2 z-20 h-1.5 w-11 -translate-x-1/2 rounded-full bg-forest/15" />
        {children}
      </div>
    </div>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-sage">{eyebrow}</p>
      <p className="mt-0.5 font-serif text-[14px] leading-tight text-forest">{title}</p>
    </>
  );
}

/* ------------------------------- Step 01 ------------------------------- */
/** The compatibility blueprint building itself — Big-Five bars filling on a loop. */
const TRAITS = [
  { label: "Openness", v: 86 },
  { label: "Warmth", v: 72 },
  { label: "Energy", v: 60 },
  { label: "Calm", v: 80 },
];
export function QuizMini() {
  return (
    <div className="flex h-full flex-col px-3.5 pt-7">
      <Header eyebrow="Compatibility" title="Your blueprint" />
      <div className="mt-3 space-y-2.5">
        {TRAITS.map((t, i) => (
          <div key={t.label}>
            <p className="text-[7px] font-medium text-forest/50">{t.label}</p>
            <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-stone">
              <span
                className="animate-bar-fill block h-full origin-left rounded-full bg-sage"
                style={{ width: `${t.v}%`, animationDelay: `${i * 260}ms` }}
              />
            </span>
          </div>
        ))}
      </div>
      <div className="mb-4 mt-auto flex justify-center">
        <span
          className="animate-pop-loop rounded-full bg-sage/15 px-2.5 py-1 text-[8px] font-semibold text-forest ring-1 ring-sage/30"
          style={{ animationDelay: "1200ms" }}
        >
          96% match-ready
        </span>
      </div>
    </div>
  );
}

/* ------------------------------- Step 02 ------------------------------- */
/** A minigame in play — This or That, resolving to a shared pick with rising hearts. */
export function SparkMini() {
  return (
    <div className="flex h-full flex-col px-3.5 pt-7">
      <Header eyebrow="This or That" title="Ideal Sunday?" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Tile emoji="🍜" label="Brunch" active />
        <Tile emoji="🏖️" label="Beach" />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="animate-pop-loop inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sage/20 to-blush/30 px-2.5 py-1 text-[8px] font-medium text-forest ring-1 ring-sage/30">
          ✨ You both picked brunch
        </span>
      </div>
      <div className="relative mb-2 mt-auto h-8">
        <MiniHeart left="26%" delay={0} />
        <MiniHeart left="50%" delay={520} />
        <MiniHeart left="70%" delay={260} />
      </div>
    </div>
  );
}

function Tile({ emoji, label, active = false }: { emoji: string; label: string; active?: boolean }) {
  return (
    <div
      className={`relative rounded-xl px-1 py-2.5 text-center ring-1 ${
        active ? "bg-sage/12 ring-sage/40" : "bg-card ring-stone"
      }`}
    >
      <div className="text-[18px] leading-none">{emoji}</div>
      <div className="mt-1 text-[8px] font-medium text-forest/70">{label}</div>
      {active && (
        <span
          className="animate-pop-loop absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-sage text-[8px] font-bold text-background"
          style={{ animationDelay: "500ms" }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

function MiniHeart({ left, delay }: { left: string; delay: number }) {
  return (
    <span
      className="animate-float-particle absolute bottom-0 text-[11px] leading-none text-terracotta"
      style={{ left, animationDelay: `${delay}ms` }}
    >
      ♥
    </span>
  );
}

/* ------------------------------- Step 03 ------------------------------- */
/** The hosted night coming together — six seats filling by couple, table booked. */
const SEATS = [
  { x: 46, y: 6, c: "bg-sage" },
  { x: 81, y: 26, c: "bg-sage" },
  { x: 81, y: 66, c: "bg-terracotta" },
  { x: 46, y: 86, c: "bg-terracotta" },
  { x: 11, y: 66, c: "bg-blush" },
  { x: 11, y: 26, c: "bg-blush" },
];
export function NightMini() {
  return (
    <div className="flex h-full flex-col px-3.5 pt-7">
      <Header eyebrow="Tonight · Game Night" title="Table for six" />
      <div className="relative mx-auto mt-4 h-[92px] w-[92px]">
        <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-clay text-[13px] ring-1 ring-stone">
          🎲
        </div>
        {SEATS.map((s, i) => (
          <span
            key={i}
            className={`animate-pop-loop absolute h-4 w-4 rounded-full ring-2 ring-background ${s.c}`}
            style={{ left: s.x - 8, top: s.y - 8, animationDelay: `${i * 220}ms` }}
          />
        ))}
      </div>
      <div className="mb-4 mt-auto flex justify-center">
        <span
          className="animate-pop-loop inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-[8px] font-semibold text-background"
          style={{ animationDelay: "1500ms" }}
        >
          ✓ Table booked
        </span>
      </div>
    </div>
  );
}
