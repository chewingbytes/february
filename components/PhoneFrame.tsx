/**
 * A sleek, minimal smartphone shell. Pure CSS — a forest bezel, a dynamic-island
 * pill, and a dark inset screen that renders whatever mockup UI you pass as
 * children. Kept dumb on purpose: each screen owns its own chrome and motion.
 */
export default function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[300px] ${className}`}>
      {/* soft grounding glow so the device doesn't float on the alabaster */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[3.5rem] bg-sage/10 blur-2xl"
      />
      <div className="rounded-[2.75rem] border border-forest/15 bg-forest p-2.5 shadow-xl ring-1 ring-black/5">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-background to-card-clay">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-30 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-forest" />
          {/* screen */}
          <div className="absolute inset-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
