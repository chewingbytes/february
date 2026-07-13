/** Row shapes for the p2_* tables (see supabase/p2_schema.sql + p2_update_2.sql). */

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  /** The short "about my day" line shown in a speech bubble on home cards. */
  status_bubble: string;
  /** Ordered photo wall — public URLs; index 0 is the main photo. */
  photos: string[];
  /** Telegram handle ("@name") — links this account to its website quiz. */
  telegram: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  compatibility: number; // 0–100
  created_at: string;
};

/** A match joined with the *other* person's profile, from my point of view. */
export type MatchWithPartner = Match & { partner: Profile };

export type MessageKind = "text" | "event_invite" | "game_result";

/** Structured payload carried by kind='game_result' messages. */
export type GameResultMeta = {
  game_id: string;
  game_kind: GameKind;
  game_title: string;
  emoji: string;
  score: number;
  total: number;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  kind: MessageKind;
  event_id: string | null;
  meta: GameResultMeta | null;
  created_at: string;
  read_at: string | null;
  /** Local-only flag while an optimistic send is in flight. */
  pending?: boolean;
};

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  lat: number;
  lng: number;
  starts_at: string;
  created_by: string | null;
  created_at: string;
};

export type JoinStatus = "pending" | "accepted" | "declined";

export type EventJoin = {
  id: string;
  event_id: string;
  match_id: string;
  requested_by: string;
  status: JoinStatus;
  created_at: string;
};

/* ── minigames ─────────────────────────────────────────────────────────── */

export type GameKind = "this_or_that" | "two_truths" | "guess_me";

/**
 * One prompt inside a game. `answer` indexes into `options` and means the
 * OWNER's side (this_or_that), the lie (two_truths) or the truth (guess_me).
 */
export type GameItem = {
  prompt?: string;
  options: string[];
  answer: number;
};

export type Game = {
  id: string;
  owner_id: string;
  kind: GameKind;
  title: string;
  items: GameItem[];
  is_active: boolean;
  created_at: string;
};

export type GamePlay = {
  id: string;
  game_id: string;
  match_id: string;
  player_id: string;
  answers: number[];
  score: number;
  total: number;
  created_at: string;
};

/* ── website questionnaire (admin matchmaker reads it) ─────────────────── */

export type QuizMatchAnswer = { self: string; accept: string[]; weight: string };

export type QuizRow = {
  id: string | number;
  created_at: string;
  status: string | null;
  age: number | null;
  gender_pref: string | null;
  available_saturday: boolean | null;
  looking_for: string | null;
  top_value: string | null;
  energy_level: string | null;
  competitiveness: string | null;
  dealbreaker: string | null;
  accepts_younger: boolean | null;
  accepts_older: boolean | null;
  max_years_younger: number | null;
  max_years_older: number | null;
  telegram: string | null;
  match_answers: Record<string, QuizMatchAnswer> | null;
};
