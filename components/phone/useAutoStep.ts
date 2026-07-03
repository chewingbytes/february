"use client";

import { useEffect, useState } from "react";

/**
 * Cycles 0,1,…,count-1 on a fixed interval so a phone mockup can play itself
 * like a live app. Under prefers-reduced-motion it stops and rests on
 * `restStep`, showing a single representative frame instead of looping.
 */
export function useAutoStep(count: number, interval = 2400, restStep = 0) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(restStep);
      return;
    }
    const id = window.setInterval(() => setStep((s) => (s + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, interval, restStep]);

  return step;
}
