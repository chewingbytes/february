import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

/**
 * Self-hosted Supabase — the SAME instance the february.place website writes
 * its questionnaire to, and that the meetup2 app lives on. Because the
 * instance is shared, every Player 2 table is prefixed `p2_` (see TABLES).
 */
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://supabase.hangoutstudios.com";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NjkxMjAwLCJleHAiOjE5MjI0NTc2MDB9.RB4UMWyk4yUl0GvrbJ_B1f9u6AEar6prsBUTqN3ftWQ";

/** Table names, namespaced so they can't collide with other apps' tables. */
export const TABLES = {
  profiles: "p2_profiles",
  matches: "p2_matches",
  messages: "p2_messages",
  events: "p2_events",
  eventJoins: "p2_event_joins",
  games: "p2_games",
  gamePlays: "p2_game_plays",
  /** The website quiz table — NOT p2-prefixed; admin-only reads. */
  questionnaire: "questionnaire",
} as const;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    // No URL bar on native — the OAuth callback is parsed manually in lib/auth.
    detectSessionInUrl: false,
  },
});

// Keep the session fresh only while the app is foregrounded (official
// supabase-js React Native pattern).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
