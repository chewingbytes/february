import { Platform } from "react-native";

/**
 * Botanical / Organic Serif design tokens — a 1:1 port of the website's
 * tailwind.config.ts. Everything derives from nature: warm alabaster paper,
 * deep forest ink, sage + clay accents, and a single terracotta pop for CTAs.
 */
export const T = {
  colors: {
    background: "#F9F8F4", // warm alabaster / rice paper
    forest: "#2D3A31", // deep forest green — primary text
    sage: "#8C9A84", // sage — buttons, highlights, icons
    clay: "#DCCFC2", // soft clay / mushroom — secondary surfaces
    stone: "#E6E2DA", // stone — subtle borders
    terracotta: "#C27B66", // interactive / CTA pop
    blush: "#E8C9BC", // warm bloom for "spark" moments
    card: "#FFFFFF",
    cardClay: "#F2F0EB",
    white: "#FFFFFF",
  },

  /** rgba() helper over the forest ink — the palette's universal tint. */
  forestA: (a: number) => `rgba(45, 58, 49, ${a})`,
  terracottaA: (a: number) => `rgba(194, 123, 102, ${a})`,
  sageA: (a: number) => `rgba(140, 154, 132, ${a})`,
  whiteA: (a: number) => `rgba(255, 255, 255, ${a})`,

  fonts: {
    serif: "PlayfairDisplay_600SemiBold",
    serifBold: "PlayfairDisplay_700Bold",
    serifItalic: "PlayfairDisplay_600SemiBold_Italic",
    sans: "SourceSans3_400Regular",
    sansMedium: "SourceSans3_500Medium",
    sansSemiBold: "SourceSans3_600SemiBold",
    sansBold: "SourceSans3_700Bold",
  },

  radii: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 999,
    /** The website's signature arch — used on hero portrait tiles. */
    arch: 120,
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 40,
  },

  /** Soft forest-tinted shadows, matching the site's shadow-soft/medium/large. */
  shadow: {
    soft: Platform.select({
      ios: {
        shadowColor: "#2D3A31",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    })!,
    medium: Platform.select({
      ios: {
        shadowColor: "#2D3A31",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: { elevation: 5 },
    })!,
    large: Platform.select({
      ios: {
        shadowColor: "#2D3A31",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 9 },
    })!,
  },
} as const;

/** Eyebrow label style fragments (uppercase, wide tracking) used everywhere. */
export const eyebrow = {
  fontFamily: T.fonts.sansSemiBold,
  fontSize: 11,
  letterSpacing: 2.4,
  textTransform: "uppercase" as const,
};
