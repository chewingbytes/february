import { useCallback, useEffect, useState } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import type {
  Game,
  GameItem,
  GameKind,
  GamePlay,
  GameResultMeta,
} from "@/lib/types";

/**
 * Minigames — little get-to-know-you games a user curates on their profile.
 * A match partner plays them from the chat; the result lands in the thread
 * as a kind='game_result' message card.
 *
 * Scoring semantics per kind (answer = the OWNER's pick per item):
 *   • this_or_that → score = prompts where you landed on the same side
 *   • two_truths   → score 1/1 if you caught the lie, else 0/1
 *   • guess_me     → score = questions you answered correctly about them
 */

export const GAME_KINDS: Record<
  GameKind,
  {
    emoji: string;
    title: string;
    tagline: string;
    /** Short "what happens" line shown on the play card. */
    playHint: string;
  }
> = {
  this_or_that: {
    emoji: "⚖️",
    title: "This or That",
    tagline: "Quickfire picks — find out how often you land on the same side.",
    playHint: "Pick a side for every prompt",
  },
  two_truths: {
    emoji: "🎭",
    title: "Two Truths & a Lie",
    tagline: "Three statements about them. One is a lie — can you catch it?",
    playHint: "Spot the lie",
  },
  guess_me: {
    emoji: "🔮",
    title: "Guess About Me",
    tagline: "A tiny quiz about them — how well do you read people?",
    playHint: "Guess the true answer",
  },
};

/** Singapore-flavoured starter pairs for the This-or-That editor. */
export const SUGGESTED_PAIRS: [string, string][] = [
  ["Kopi", "Teh"],
  ["Beach day", "Mountain hike"],
  ["Night out", "Night in"],
  ["Sweet", "Savoury"],
  ["Early bird", "Night owl"],
  ["Texts", "Calls"],
  ["Hawker feast", "Cafe brunch"],
  ["Plan it all", "Wing it"],
  ["Dogs", "Cats"],
  ["Karaoke", "Board games"],
  ["Window seat", "Aisle seat"],
  ["Spicy", "Not spicy"],
];

/** Result copy for the game_result chat card + results screen. */
export function resultLine(kind: GameKind, score: number, total: number): string {
  if (kind === "two_truths") {
    return score > 0 ? "Caught the lie 🎯" : "Fooled them 😏";
  }
  if (kind === "this_or_that") return `Same side on ${score}/${total}`;
  return `Guessed ${score}/${total} right`;
}

export function scorePlay(game: Game, picks: number[]): { score: number; total: number } {
  const total = game.items.length;
  let score = 0;
  game.items.forEach((item, i) => {
    if (picks[i] === item.answer) score += 1;
  });
  return { score, total };
}

/* ── CRUD ─────────────────────────────────────────────────────────────── */

export async function createGame(
  ownerId: string,
  kind: GameKind,
  title: string,
  items: GameItem[]
): Promise<Game> {
  const { data, error } = await supabase
    .from(TABLES.games)
    .insert({ owner_id: ownerId, kind, title, items })
    .select()
    .single();
  if (error) throw error;
  return data as Game;
}

export async function updateGame(
  gameId: string,
  patch: Partial<Pick<Game, "title" | "items" | "is_active">>
): Promise<Game> {
  const { data, error } = await supabase
    .from(TABLES.games)
    .update(patch)
    .eq("id", gameId)
    .select()
    .single();
  if (error) throw error;
  return data as Game;
}

export async function deleteGame(gameId: string): Promise<void> {
  const { error } = await supabase.from(TABLES.games).delete().eq("id", gameId);
  if (error) throw error;
}

export async function fetchGame(gameId: string): Promise<Game | null> {
  const { data } = await supabase
    .from(TABLES.games)
    .select("*")
    .eq("id", gameId)
    .maybeSingle();
  return (data as Game) ?? null;
}

/** My own games (profile "Your games" section). Reload on demand. */
export function useMyGames(myId: string | undefined) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!myId) return;
    const { data } = await supabase
      .from(TABLES.games)
      .select("*")
      .eq("owner_id", myId)
      .order("created_at", { ascending: false });
    setGames((data ?? []) as Game[]);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { games, loading, reload };
}

/** A partner's ACTIVE games + my previous plays within this match. */
export function usePartnerGames(
  partnerId: string | undefined,
  matchId: string,
  myId: string | undefined
) {
  const [games, setGames] = useState<Game[]>([]);
  const [plays, setPlays] = useState<GamePlay[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!partnerId || !myId) return;
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase
        .from(TABLES.games)
        .select("*")
        .eq("owner_id", partnerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.gamePlays)
        .select("*")
        .eq("match_id", matchId)
        .eq("player_id", myId),
    ]);
    setGames((g ?? []) as Game[]);
    setPlays((p ?? []) as GamePlay[]);
    setLoading(false);
  }, [partnerId, matchId, myId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { games, plays, loading, reload };
}

/**
 * Persist a finished playthrough and drop the result card into the chat —
 * both sides see it via the existing realtime message subscription.
 */
export async function submitPlay(
  game: Game,
  matchId: string,
  playerId: string,
  picks: number[]
): Promise<{ score: number; total: number }> {
  const { score, total } = scorePlay(game, picks);

  const { error: playErr } = await supabase.from(TABLES.gamePlays).insert({
    game_id: game.id,
    match_id: matchId,
    player_id: playerId,
    answers: picks,
    score,
    total,
  });
  if (playErr) throw playErr;

  const meta: GameResultMeta = {
    game_id: game.id,
    game_kind: game.kind,
    game_title: game.title,
    emoji: GAME_KINDS[game.kind].emoji,
    score,
    total,
  };
  const { error: msgErr } = await supabase.from(TABLES.messages).insert({
    match_id: matchId,
    sender_id: playerId,
    kind: "game_result",
    content: `${GAME_KINDS[game.kind].emoji} ${game.title} — ${resultLine(
      game.kind,
      score,
      total
    )}`,
    meta,
  });
  if (msgErr) throw msgErr;

  return { score, total };
}
