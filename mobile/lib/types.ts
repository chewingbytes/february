/** Row shapes for the p2_* tables (see supabase/p2_schema.sql). */

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  /** The short "about my day" line shown in a speech bubble on home cards. */
  status_bubble: string;
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

export type MessageKind = "text" | "event_invite";

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  kind: MessageKind;
  event_id: string | null;
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
