import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase, TABLES } from "@/lib/supabase";
import type { Match, MatchWithPartner, Message, Profile } from "@/lib/types";

/* ────────────────────────────── presence ──────────────────────────────
 * One shared "who's online" presence channel for the whole app. Presence
 * only syncs within a single topic, and Supabase allows one live channel
 * per topic — so the channel is a module-level singleton with refcounting,
 * letting any number of screens read it at once.
 */
let onlineChannel: RealtimeChannel | null = null;
let onlineRefs = 0;
let onlineNow = new Set<string>();
const onlineListeners = new Set<(s: Set<string>) => void>();
let appStateSub: { remove: () => void } | null = null;

function stampLastSeen(myId: string) {
  void supabase
    .from(TABLES.profiles)
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", myId)
    .then(() => {});
}

function acquireOnline(myId: string) {
  onlineRefs += 1;
  if (onlineChannel) return;

  const channel = supabase.channel("p2:online", {
    config: { presence: { key: myId } },
  });
  onlineChannel = channel;

  channel
    .on("presence", { event: "sync" }, () => {
      onlineNow = new Set(Object.keys(channel.presenceState()));
      onlineListeners.forEach((cb) => cb(onlineNow));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ online_at: new Date().toISOString() });
      }
    });

  // Keep an honest last_seen_at for the "Last seen …" fallback.
  appStateSub = AppState.addEventListener("change", (s) => {
    if (s !== "active") stampLastSeen(myId);
  });
}

function releaseOnline(myId: string) {
  onlineRefs -= 1;
  if (onlineRefs > 0) return;
  appStateSub?.remove();
  appStateSub = null;
  stampLastSeen(myId);
  if (onlineChannel) void supabase.removeChannel(onlineChannel);
  onlineChannel = null;
  onlineNow = new Set();
}

export function useOnlineUsers(myId: string | undefined) {
  const [online, setOnline] = useState<Set<string>>(onlineNow);

  useEffect(() => {
    if (!myId) return;
    const cb = (s: Set<string>) => setOnline(new Set(s));
    onlineListeners.add(cb);
    acquireOnline(myId);
    setOnline(new Set(onlineNow));
    return () => {
      onlineListeners.delete(cb);
      releaseOnline(myId);
    };
  }, [myId]);

  return online;
}

/* ─────────────────────────────── chat list ─────────────────────────── */

export type ChatPreview = {
  match: MatchWithPartner;
  lastMessage: Message | null;
  unread: number;
};

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: matchRows } = await supabase
      .from(TABLES.matches)
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("created_at", { ascending: false });

    const matches = (matchRows ?? []) as Match[];
    if (!matches.length) {
      setChats([]);
      setLoading(false);
      return;
    }

    const partnerIds = matches.map((m) => (m.user_a === userId ? m.user_b : m.user_a));
    const matchIds = matches.map((m) => m.id);

    const [{ data: partnerRows }, { data: recentRows }, { data: unreadRows }] =
      await Promise.all([
        supabase.from(TABLES.profiles).select("*").in("id", partnerIds),
        // Recent messages across all matches; first-per-match picked below.
        supabase
          .from(TABLES.messages)
          .select("*")
          .in("match_id", matchIds)
          .order("created_at", { ascending: false })
          .limit(120),
        supabase
          .from(TABLES.messages)
          .select("id, match_id")
          .in("match_id", matchIds)
          .neq("sender_id", userId)
          .is("read_at", null),
      ]);

    const partners = new Map(
      ((partnerRows ?? []) as Profile[]).map((p) => [p.id, p])
    );
    const lastByMatch = new Map<string, Message>();
    for (const m of (recentRows ?? []) as Message[]) {
      if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m);
    }
    const unreadByMatch = new Map<string, number>();
    for (const r of (unreadRows ?? []) as { match_id: string }[]) {
      unreadByMatch.set(r.match_id, (unreadByMatch.get(r.match_id) ?? 0) + 1);
    }

    const previews: ChatPreview[] = matches
      .map((m) => {
        const partner = partners.get(m.user_a === userId ? m.user_b : m.user_a);
        if (!partner) return null;
        return {
          match: { ...m, partner },
          lastMessage: lastByMatch.get(m.id) ?? null,
          unread: unreadByMatch.get(m.id) ?? 0,
        };
      })
      .filter((c): c is ChatPreview => !!c)
      .sort((a, b) => {
        const ta = a.lastMessage?.created_at ?? a.match.created_at;
        const tb = b.lastMessage?.created_at ?? b.match.created_at;
        return tb.localeCompare(ta);
      });

    setChats(previews);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Any message insert/update I'm allowed to see (RLS scopes it to my
  // matches) refreshes the list — debounced so bursts collapse to one load.
  useEffect(() => {
    if (!userId) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => void load(), 250);
    };
    // Unique topic per hook instance: the chats tab AND the map screen
    // (useMyMatches) can both run this hook at once, and supabase.channel()
    // returns the EXISTING instance for a repeated topic — calling .on() on
    // an already-subscribed channel throws.
    const channel = supabase
      .channel(`p2:chats:${userId}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.messages },
        bump
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.matches },
        bump
      )
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { chats, loading, reload: load };
}

/* ─────────────────────────────── chat room ─────────────────────────── */

const PAGE = 50;

export function useChatRoom(matchId: string, myId: string) {
  // Newest-first (index 0 = latest) to feed an inverted FlatList.
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  /** Mark every unread partner message as read (fires their receipts). */
  const markRead = useCallback(() => {
    void supabase
      .from(TABLES.messages)
      .update({ read_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .neq("sender_id", myId)
      .is("read_at", null)
      .then(() => {});
  }, [matchId, myId]);

  // Initial page.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from(TABLES.messages)
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (!alive) return;
      const rows = (data ?? []) as Message[];
      setMessages(rows);
      setHasMore(rows.length === PAGE);
      setLoading(false);
      markRead();
    })();
    return () => {
      alive = false;
    };
  }, [matchId, markRead]);

  // Realtime: new messages, read-receipt updates, and typing broadcasts.
  useEffect(() => {
    // Typing broadcasts require BOTH users on this exact topic, so it can't
    // be randomised — instead, clear any stale instance a fast
    // unmount/remount may have left behind before re-creating it.
    const topic = `p2:room:${matchId}`;
    for (const c of supabase.getChannels()) {
      if (c.topic === `realtime:${topic}`) void supabase.removeChannel(c);
    }
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.messages,
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            // Replace the optimistic copy (same sender+content still pending)
            // or dedupe if we already have it.
            if (prev.some((m) => m.id === msg.id)) return prev;
            const optimistic = prev.findIndex(
              (m) => m.pending && m.sender_id === msg.sender_id && m.content === msg.content
            );
            if (optimistic >= 0) {
              const next = [...prev];
              next[optimistic] = msg;
              return next;
            }
            return [msg, ...prev];
          });
          if (msg.sender_id !== myId) {
            setPartnerTyping(false);
            markRead();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: TABLES.messages,
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, ...msg, pending: false } : m))
          );
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.user === myId) return;
        setPartnerTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPartnerTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [matchId, myId, markRead]);

  /** Throttled "I'm typing" broadcast (at most one every 1.2s). */
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < 1200) return;
    lastTypingSent.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user: myId },
    });
  }, [myId]);

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;
      const temp: Message = {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        match_id: matchId,
        sender_id: myId,
        content: text,
        kind: "text",
        event_id: null,
        created_at: new Date().toISOString(),
        read_at: null,
        pending: true,
      };
      setMessages((prev) => [temp, ...prev]);

      const { data, error } = await supabase
        .from(TABLES.messages)
        .insert({ match_id: matchId, sender_id: myId, content: text })
        .select()
        .single();

      setMessages((prev) => {
        if (error) return prev.filter((m) => m.id !== temp.id);
        const real = data as Message;
        // Realtime may have already swapped it in.
        if (prev.some((m) => m.id === real.id)) {
          return prev.filter((m) => m.id !== temp.id);
        }
        return prev.map((m) => (m.id === temp.id ? real : m));
      });
      if (error) throw error;
    },
    [matchId, myId]
  );

  const loadOlder = useCallback(async () => {
    const oldest = messages[messages.length - 1];
    if (!oldest || !hasMore) return;
    const { data } = await supabase
      .from(TABLES.messages)
      .select("*")
      .eq("match_id", matchId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const rows = (data ?? []) as Message[];
    setHasMore(rows.length === PAGE);
    if (rows.length) setMessages((prev) => [...prev, ...rows]);
  }, [messages, hasMore, matchId]);

  return {
    messages,
    loading,
    hasMore,
    partnerTyping,
    send,
    sendTyping,
    loadOlder,
    markRead,
  };
}

/* ─────────────────────── single match lookup (room header) ─────────── */

export function useMatch(matchId: string, myId: string | undefined) {
  const [match, setMatch] = useState<MatchWithPartner | null>(null);

  useEffect(() => {
    if (!myId) return;
    let alive = true;
    (async () => {
      const { data: m } = await supabase
        .from(TABLES.matches)
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      if (!m || !alive) return;
      const partnerId = m.user_a === myId ? m.user_b : m.user_a;
      const { data: p } = await supabase
        .from(TABLES.profiles)
        .select("*")
        .eq("id", partnerId)
        .maybeSingle();
      if (alive && p) setMatch({ ...(m as Match), partner: p as Profile });
    })();
    return () => {
      alive = false;
    };
  }, [matchId, myId]);

  return match;
}

/** Convenience: my matches with partners (event-suggest flow on the map). */
export function useMyMatches(myId: string | undefined) {
  const { chats } = useChats(myId);
  return useMemo(() => chats.map((c) => c.match), [chats]);
}
