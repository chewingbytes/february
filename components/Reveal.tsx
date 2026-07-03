"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Gently fades + floats its children into place the first time they scroll into
 * view. A thin IntersectionObserver wrapper over the `.reveal` / `.is-visible`
 * CSS in globals.css — no animation library required.
 *
 * Group several Reveals with increasing `delay` to get an organic, staggered
 * cascade. Fully disabled under `prefers-reduced-motion`.
 *
 * `staticOnMobile` opts out of the hide-until-scroll behavior below `md`, so the
 * content is present immediately on small screens (used where a stacked section
 * would otherwise leave an empty gap until you scroll it into view).
 *
 * `asTrigger` renders no fade of its own — it only toggles `is-visible`, letting
 * `.rise` children cascade in for a natural, staggered entrance.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  staticOnMobile = false,
  asTrigger = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string; // shrink the bottom to trigger later (more in view)
  staticOnMobile?: boolean;
  asTrigger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect(); // reveal once, then stop watching
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  const classes = [
    asTrigger ? "" : "reveal",
    staticOnMobile ? "reveal-static-mobile" : "",
    visible ? "is-visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}
