import { useCallback, useEffect, useState } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import type { EventJoin, EventRow } from "@/lib/types";

/* ───────────────────────────── events feed ─────────────────────────── */

export function useEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from(TABLES.events)
      .select("*")
      .order("starts_at", { ascending: true });
    setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("p2:events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.events },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { events, loading, reload: load };
}

/** Admin-only (enforced by RLS): drop a new event pin. */
export async function createEvent(input: {
  title: string;
  description: string;
  venue: string;
  lat: number;
  lng: number;
  starts_at: string;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from(TABLES.events)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

/* ──────────────────── both-agree join flow (per match) ─────────────────
 * A pair attends together: one side suggests the event (creates a `pending`
 * join + drops an event_invite message into their chat), the partner accepts
 * (→ `accepted`, you're both in) or declines. RLS restricts every write to
 * the two members of the match.
 */

export function useEventJoins(eventId: string | null) {
  const [joins, setJoins] = useState<EventJoin[]>([]);

  const load = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from(TABLES.eventJoins)
      .select("*")
      .eq("event_id", eventId);
    setJoins((data ?? []) as EventJoin[]);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setJoins([]);
      return;
    }
    void load();
    // Unique topic per hook instance: several invite bubbles can watch the
    // same event at once, and Supabase allows one live channel per topic.
    const channel = supabase
      .channel(`p2:joins:${eventId}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABLES.eventJoins,
          filter: `event_id=eq.${eventId}`,
        },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, load]);

  return { joins, reload: load };
}

/** Suggest an event to your match: pending join + invite message in the chat. */
export async function suggestEvent(opts: {
  eventId: string;
  matchId: string;
  myId: string;
  eventTitle: string;
}) {
  const { error } = await supabase.from(TABLES.eventJoins).insert({
    event_id: opts.eventId,
    match_id: opts.matchId,
    requested_by: opts.myId,
    status: "pending",
  });
  if (error) throw error;

  // The invite lives in the chat so the partner sees it where they already are.
  await supabase.from(TABLES.messages).insert({
    match_id: opts.matchId,
    sender_id: opts.myId,
    kind: "event_invite",
    event_id: opts.eventId,
    content: opts.eventTitle,
  });
}

export async function respondToEventJoin(joinId: string, accept: boolean) {
  const { error } = await supabase
    .from(TABLES.eventJoins)
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", joinId);
  if (error) throw error;
}

/** After a decline, either side can float the idea again. */
export async function reSuggestEventJoin(opts: {
  joinId: string;
  matchId: string;
  myId: string;
  eventId: string;
  eventTitle: string;
}) {
  const { error } = await supabase
    .from(TABLES.eventJoins)
    .update({ status: "pending", requested_by: opts.myId })
    .eq("id", opts.joinId);
  if (error) throw error;
  await supabase.from(TABLES.messages).insert({
    match_id: opts.matchId,
    sender_id: opts.myId,
    kind: "event_invite",
    event_id: opts.eventId,
    content: opts.eventTitle,
  });
}

/** The join row (if any) between one event and one match. */
export async function fetchJoinFor(eventId: string, matchId: string) {
  const { data } = await supabase
    .from(TABLES.eventJoins)
    .select("*")
    .eq("event_id", eventId)
    .eq("match_id", matchId)
    .maybeSingle();
  return (data as EventJoin | null) ?? null;
}
