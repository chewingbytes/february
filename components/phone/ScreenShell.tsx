/**
 * Shared chrome for every phone mockup. Now themed to match the landing page —
 * warm alabaster screen, deep-forest text, Playfair headings, sage accents — so
 * the product feels like a natural extension of the site. Screens fill the
 * remaining space via `children`.
 */
export default function ScreenShell({
  time = "9:41",
  eyebrow,
  title,
  right,
  children,
  className = "",
}: {
  time?: string;
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-full flex-col text-forest ${className}`}>
      {/* status bar */}
      <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold tracking-wide text-forest/65">
        <span>{time}</span>
        <span className="flex items-center gap-1.5">
          <span className="flex items-end gap-[2px]">
            {[3, 5, 7, 9].map((h) => (
              <span key={h} className="w-[2px] rounded-full bg-forest/55" style={{ height: h }} />
            ))}
          </span>
          <span className="relative ml-0.5 inline-flex h-[9px] w-[16px] items-center rounded-[2px] border border-forest/45 px-[1px]">
            <span className="h-[5px] w-[10px] rounded-[1px] bg-forest/55" />
            <span className="absolute -right-[3px] top-1/2 h-[3px] w-[1.5px] -translate-y-1/2 rounded-r bg-forest/35" />
          </span>
        </span>
      </div>

      {(eyebrow || title) && (
        <div className="flex items-end justify-between gap-2 px-6 pb-3 pt-4">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">{eyebrow}</p>
            )}
            {title && <h4 className="mt-1 font-serif text-[22px] leading-tight text-forest">{title}</h4>}
          </div>
          {right}
        </div>
      )}

      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
