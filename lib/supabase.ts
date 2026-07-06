import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (anon key). Used exactly like the Expo app's
 * lib/supabase.ts — for realtime chat (messages table) and presence
 * (online users). All privileged writes go through the Express backend.
 *
 * Anonymous webapp visitors are NOT Supabase-auth users, so we disable session
 * persistence. OAuth (Google/Apple) hosts DO use Supabase auth and get their
 * own session (detectSessionInUrl handles the OAuth redirect callback).
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
