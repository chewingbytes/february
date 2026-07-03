"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const links = [
  { label: "How It Works", href: "#how" },
  { label: "The Host", href: "#host" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Transparent (light text) over the hero; solid alabaster (dark text) once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:pt-4">
      <nav
        className={`mx-auto flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 ease-botanical md:w-3/4 md:px-6 ${
          scrolled
            ? "border border-stone bg-background/85 text-forest shadow-soft backdrop-blur-md"
            : "border border-transparent bg-transparent text-background"
        }`}
      >
        <a href="#top" className="flex items-center" aria-label="february.place home">
          <Image
            src="/actuallogo.png"
            alt="february.place"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-sm"
          />
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors duration-300 ${
                scrolled ? "text-forest/70 hover:text-terracotta" : "text-background/80 hover:text-background"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#request"
            className={`inline-flex h-10 items-center rounded-full px-5 text-xs font-medium uppercase tracking-widest transition-all duration-300 ${
              scrolled
                ? "bg-forest text-background hover:bg-terracotta"
                : "border border-background/60 text-background hover:bg-background hover:text-forest"
            }`}
          >
            Request Invitation
          </a>
        </div>

        {/* Mobile trigger — inherits the nav's current text color */}
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="md:hidden">
          <Menu strokeWidth={1.5} className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div
        className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-sm transition-all duration-500 ease-botanical md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2 px-6 pt-12">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-stone py-5 font-serif text-3xl italic text-forest transition-colors duration-300 hover:text-sage"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {l.label}
            </a>
          ))}
          <a href="#request" onClick={() => setOpen(false)} className="btn-primary mt-8 w-full">
            Request Invitation
          </a>
        </div>
      </div>
    </header>
  );
}
