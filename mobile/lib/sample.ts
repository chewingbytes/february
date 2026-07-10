/**
 * SAMPLE DATA — home-screen rails only, purely for UI while the real matching
 * pipeline (Thursday hand-pairing from the website questionnaire) isn't wired
 * into the app yet. Swap for a Supabase query over p2_profiles later.
 */

export type SamplePerson = {
  id: string;
  name: string;
  age: number;
  photo: string;
  compatibility: number; // 0–100, shown as the top-right badge
  bubble: string; // "about my day" — the profile speech bubble
  tag: string; // small trait chip
};

export type SampleRail = {
  id: string;
  title: string;
  subtitle: string;
  people: SamplePerson[];
};

const P = (n: number, women = true) =>
  `https://randomuser.me/api/portraits/${women ? "women" : "men"}/${n}.jpg`;

export const SAMPLE_RAILS: SampleRail[] = [
  {
    id: "meet",
    title: "We think you should meet",
    subtitle: "Curated from your quiz answers",
    people: [
      {
        id: "m1",
        name: "Rachel",
        age: 26,
        photo: P(65),
        compatibility: 94,
        bubble: "Post-gym laksa hunt. Zero regrets 🍜",
        tag: "🎲 Plays to win",
      },
      {
        id: "m2",
        name: "Wei Lin",
        age: 27,
        photo: P(44),
        compatibility: 91,
        bubble: "Reading at TBP until the sun goes down",
        tag: "🌿 Balanced energy",
      },
      {
        id: "m3",
        name: "Amanda",
        age: 25,
        photo: P(32),
        compatibility: 89,
        bubble: "Deadline week — send memes, not texts",
        tag: "💬 Deep talker",
      },
      {
        id: "m4",
        name: "Jia Yi",
        age: 28,
        photo: P(58),
        compatibility: 87,
        bubble: "Learning mahjong from my grandma 🀄",
        tag: "🎲 Plays for laughs",
      },
      {
        id: "m5",
        name: "Sarah",
        age: 26,
        photo: P(21),
        compatibility: 86,
        bubble: "Marina run then kaya toast, always",
        tag: "⚡ The hype",
      },
    ],
  },
  {
    id: "competitive",
    title: "Shares your competitiveness",
    subtitle: "They optimise every turn too",
    people: [
      {
        id: "c1",
        name: "Marcus",
        age: 28,
        photo: P(32, false),
        compatibility: 88,
        bubble: "Catan rematch pending. I want my port back",
        tag: "🎲 Plays to win",
      },
      {
        id: "c2",
        name: "Daniel",
        age: 27,
        photo: P(45, false),
        compatibility: 85,
        bubble: "Chess puzzle streak: day 41 ♟️",
        tag: "🧠 Strategist",
      },
      {
        id: "c3",
        name: "Ethan",
        age: 29,
        photo: P(18, false),
        compatibility: 83,
        bubble: "Bouldering till my arms give up",
        tag: "🎲 Plays to win",
      },
      {
        id: "c4",
        name: "Isaac",
        age: 26,
        photo: P(61, false),
        compatibility: 82,
        bubble: "Ranked my 7 favourite hawker stalls today",
        tag: "📈 Ambitious",
      },
    ],
  },
  {
    id: "energy",
    title: "Matches your energy",
    subtitle: "Same wavelength in a room",
    people: [
      {
        id: "e1",
        name: "Chloe",
        age: 25,
        photo: P(12),
        compatibility: 84,
        bubble: "Hosting trivia tonight — come lose 😌",
        tag: "⚡ The hype",
      },
      {
        id: "e2",
        name: "Nathan",
        age: 28,
        photo: P(23, false),
        compatibility: 82,
        bubble: "Quiet cafe, loud playlist",
        tag: "🍃 Chill observer",
      },
      {
        id: "e3",
        name: "Grace",
        age: 27,
        photo: P(47),
        compatibility: 81,
        bubble: "Plant mum duties: 14 watered, 0 lost 🌱",
        tag: "🌿 Balanced energy",
      },
      {
        id: "e4",
        name: "Ryan",
        age: 27,
        photo: P(52, false),
        compatibility: 80,
        bubble: "Sunset cycle @ East Coast after work",
        tag: "🌿 Balanced energy",
      },
    ],
  },
];
