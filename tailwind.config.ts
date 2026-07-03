import type { Config } from "tailwindcss";

/**
 * Botanical / Organic Serif design tokens.
 * Everything derives from nature — no artificial brights. The palette is the
 * quiet, grounded backdrop; typography and generous whitespace do the talking.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F9F8F4", // warm alabaster / rice paper
        forest: "#2D3A31", // deep forest green — primary text
        sage: "#8C9A84", // sage — buttons, highlights, icons
        clay: "#DCCFC2", // soft clay / mushroom — secondary surfaces
        stone: "#E6E2DA", // stone — subtle borders
        terracotta: "#C27B66", // interactive / CTA pop
        card: "#FFFFFF",
        "card-clay": "#F2F0EB",
        // a single warm bloom for "spark" moments (match synced, hosted nights)
        blush: "#E8C9BC",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-source)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        blob: "40px",
        arch: "200px",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(45, 58, 49, 0.05)",
        medium: "0 10px 15px -3px rgba(45, 58, 49, 0.05)",
        large: "0 20px 40px -10px rgba(45, 58, 49, 0.05)",
        xl: "0 25px 50px -12px rgba(45, 58, 49, 0.15)",
        bloom: "0 30px 60px -15px rgba(45, 58, 49, 0.18)",
      },
      letterSpacing: {
        widest: "0.25em",
      },
      maxWidth: {
        content: "80rem", // max-w-7xl airiness
      },
      transitionTimingFunction: {
        botanical: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "float-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        // Slow ambient light drift behind the hero — like lamps in a lounge
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -2%, 0) scale(1.06)" },
        },
        // Gentle breathing for the phone-screen personality nodes
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        // Particles rising after a "match synced" moment
        "float-particle": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.6)" },
          "35%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-22px) scale(1)" },
        },
        // The board-game ticket bobbing as if suspended
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        // An answer / chip popping into place as the app "responds"
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // A meter or trait bar growing from empty to its value
        "grow-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        // A minigame countdown timer draining away
        deplete: {
          "0%": { transform: "scaleX(1)" },
          "100%": { transform: "scaleX(0)" },
        },
      },
      animation: {
        "float-up": "float-up 0.9s cubic-bezier(0.22,1,0.36,1) both",
        sway: "sway 8s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "float-particle": "float-particle 2.4s ease-out infinite",
        bob: "bob 6s ease-in-out infinite",
        pop: "pop 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "grow-x": "grow-x 0.7s cubic-bezier(0.22,1,0.36,1) both",
        deplete: "deplete 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
