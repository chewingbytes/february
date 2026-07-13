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
  /** Full photo wall, in the order "they" arranged it (index 0 = main). */
  photos: string[];
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

/** Unsplash lifestyle shots (stable classics) for the preview photo walls. */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const LAKSA = U("photo-1555126634-323283e090fa");
const GYM = U("photo-1571019613454-1cb2f99b2d8b");
const BOOKS = U("photo-1512820790803-83ca734da794");
const LIBRARY = U("photo-1481627834876-b7833e8f5570");
const COFFEE = U("photo-1495474472287-4d71bcdd2085");
const WRITING = U("photo-1455390582262-044cdead277a");
const BOARDGAME = U("photo-1610890716171-6b1bb98ffd09");
const FOOD = U("photo-1504674900247-0877df9cc836");
const RUN = U("photo-1476480862126-209bfaa8edc8");
const TOAST = U("photo-1484723091739-30a097e8f929");
const CHESS = U("photo-1528819622765-d6bcf132f793");
const CLIMB = U("photo-1522163182402-834f871fd851");
const PEAKS = U("photo-1506905925346-21bda4d32df4");
const HAWKER = U("photo-1555939594-58d7cb561ad1");
const PARTY = U("photo-1530103862676-de8c9debad1d");
const CAFE = U("photo-1453614512568-c4024d13c247");
const PLANTS = U("photo-1416879595882-3373a0480b5b");
const LEAVES = U("photo-1463320726281-696a485928c7");
const CYCLE = U("photo-1517649763962-0c623066013b");
const COAST = U("photo-1507525428034-b723cf961d3e");

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
        photos: [P(65), LAKSA, GYM],
        compatibility: 94,
        bubble: "Post-gym laksa hunt. Zero regrets 🍜",
        tag: "🎲 Plays to win",
      },
      {
        id: "m2",
        name: "Wei Lin",
        age: 27,
        photo: P(44),
        photos: [P(44), BOOKS, LIBRARY],
        compatibility: 91,
        bubble: "Reading at TBP until the sun goes down",
        tag: "🌿 Balanced energy",
      },
      {
        id: "m3",
        name: "Amanda",
        age: 25,
        photo: P(32),
        photos: [P(32), COFFEE, WRITING],
        compatibility: 89,
        bubble: "Deadline week — send memes, not texts",
        tag: "💬 Deep talker",
      },
      {
        id: "m4",
        name: "Jia Yi",
        age: 28,
        photo: P(58),
        photos: [P(58), BOARDGAME, FOOD],
        compatibility: 87,
        bubble: "Learning mahjong from my grandma 🀄",
        tag: "🎲 Plays for laughs",
      },
      {
        id: "m5",
        name: "Sarah",
        age: 26,
        photo: P(21),
        photos: [P(21), RUN, TOAST],
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
        photos: [P(32, false), BOARDGAME, FOOD],
        compatibility: 88,
        bubble: "Catan rematch pending. I want my port back",
        tag: "🎲 Plays to win",
      },
      {
        id: "c2",
        name: "Daniel",
        age: 27,
        photo: P(45, false),
        photos: [P(45, false), CHESS, COFFEE],
        compatibility: 85,
        bubble: "Chess puzzle streak: day 41 ♟️",
        tag: "🧠 Strategist",
      },
      {
        id: "c3",
        name: "Ethan",
        age: 29,
        photo: P(18, false),
        photos: [P(18, false), CLIMB, PEAKS],
        compatibility: 83,
        bubble: "Bouldering till my arms give up",
        tag: "🎲 Plays to win",
      },
      {
        id: "c4",
        name: "Isaac",
        age: 26,
        photo: P(61, false),
        photos: [P(61, false), HAWKER, FOOD],
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
        photos: [P(12), PARTY, COFFEE],
        compatibility: 84,
        bubble: "Hosting trivia tonight — come lose 😌",
        tag: "⚡ The hype",
      },
      {
        id: "e2",
        name: "Nathan",
        age: 28,
        photo: P(23, false),
        photos: [P(23, false), CAFE, BOOKS],
        compatibility: 82,
        bubble: "Quiet cafe, loud playlist",
        tag: "🍃 Chill observer",
      },
      {
        id: "e3",
        name: "Grace",
        age: 27,
        photo: P(47),
        photos: [P(47), PLANTS, LEAVES],
        compatibility: 81,
        bubble: "Plant mum duties: 14 watered, 0 lost 🌱",
        tag: "🌿 Balanced energy",
      },
      {
        id: "e4",
        name: "Ryan",
        age: 27,
        photo: P(52, false),
        photos: [P(52, false), CYCLE, COAST],
        compatibility: 80,
        bubble: "Sunset cycle @ East Coast after work",
        tag: "🌿 Balanced energy",
      },
    ],
  },
];

/** Find a preview person (and the rail explaining why they're shown). */
export function findSamplePerson(
  id: string
): { person: SamplePerson; rail: SampleRail } | null {
  for (const rail of SAMPLE_RAILS) {
    const person = rail.people.find((p) => p.id === id);
    if (person) return { person, rail };
  }
  return null;
}
