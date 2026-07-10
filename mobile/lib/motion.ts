import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from "react-native-reanimated";

/**
 * Motion presets — calm, quick, no bounce. Entrances are short timing curves
 * rather than springs, staggers are tight, and sheets slide fast. Tune the
 * whole app's feel from this one file.
 */
export const M = {
  /** Standard entrance: small rise + fade. */
  fadeDown: (delay = 0) => FadeInDown.duration(220).delay(delay),
  /** Rise-from-below entrance (CTAs, bars). */
  fadeUp: (delay = 0) => FadeInUp.duration(220).delay(delay),
  /** Plain fade (backdrops, labels). */
  fadeIn: (delay = 0) => FadeIn.duration(150).delay(delay),
  fadeOut: FadeOut.duration(130),
  /** Small controls popping in (send button). */
  zoomIn: ZoomIn.duration(140),
  /** Bottom sheets. */
  sheetIn: SlideInDown.duration(300),
  sheetOut: SlideOutDown.duration(200),
  /** Layout shifts (tab capsule). */
  layout: LinearTransition.duration(180),
} as const;
