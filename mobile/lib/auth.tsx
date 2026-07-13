import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase, TABLES } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

/**
 * Google-only auth over Supabase (self-hosted GoTrue).
 *
 * Flow: signInWithOAuth(skipBrowserRedirect) gives us the provider URL → we
 * open it in an in-app auth session → GoTrue redirects back to our deep link
 * (playertwo://auth-callback, or exp:// in Expo Go) → we parse the tokens (or
 * PKCE code) out of the URL and hand them to supabase-js.
 *
 * The redirect URL must be whitelisted in GoTrue (GOTRUE_URI_ALLOW_LIST) —
 * see mobile/README.md.
 */

WebBrowser.maybeCompleteAuthSession();

/** Pull params out of both the query string and the #fragment of a URL. */
function parseAuthParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const collect = (chunk?: string) => {
    if (!chunk) return;
    for (const pair of chunk.split("&")) {
      const [k, v] = pair.split("=");
      if (k && v !== undefined) out[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  };
  const [rest, fragment] = url.split("#");
  collect(fragment);
  const q = rest?.indexOf("?");
  if (q !== undefined && q >= 0) collect(rest.slice(q + 1));
  return out;
}

async function createSessionFromUrl(url: string) {
  const params = parseAuthParams(url);
  if (params.error_description) throw new Error(params.error_description);
  if (params.error) throw new Error(params.error);

  // PKCE flow → exchange the one-time code.
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  // Implicit flow → tokens arrive in the fragment.
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return;
  }
  throw new Error("No credentials found in the sign-in redirect.");
}

/** The profile fields the user can edit from the app. */
export type ProfilePatch = Partial<
  Pick<Profile, "status_bubble" | "photos" | "telegram" | "display_name">
>;

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  /** True until the persisted session has been restored from storage. */
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateStatusBubble: (text: string) => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const ensured = useRef<string | null>(null);

  // Make sure a p2_profiles row exists for this user, seeded from the Google
  // account (name + avatar). Runs once per signed-in user id.
  const ensureProfile = useCallback(async (s: Session) => {
    if (ensured.current === s.user.id) return;
    ensured.current = s.user.id;

    const meta = (s.user.user_metadata ?? {}) as Record<string, unknown>;
    const email = s.user.email ?? "";
    const seed = {
      id: s.user.id,
      email,
      display_name:
        (meta.full_name as string) ?? (meta.name as string) ?? email.split("@")[0],
      avatar_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
    };

    const { data: existing } = await supabase
      .from(TABLES.profiles)
      .select("*")
      .eq("id", s.user.id)
      .maybeSingle();

    if (!existing) {
      const { data } = await supabase
        .from(TABLES.profiles)
        .insert(seed)
        .select()
        .single();
      setProfile((data as Profile) ?? null);
    } else {
      // Keep Google name/photo fresh but never clobber the status bubble.
      const { data } = await supabase
        .from(TABLES.profiles)
        .update({
          email: seed.email,
          display_name: existing.display_name || seed.display_name,
          avatar_url: seed.avatar_url ?? existing.avatar_url,
        })
        .eq("id", s.user.id)
        .select()
        .single();
      setProfile((data as Profile) ?? (existing as Profile));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) void ensureProfile(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) void ensureProfile(s);
      else {
        setProfile(null);
        ensured.current = null;
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [ensureProfile]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL("auth-callback");
    // Whitelist THIS exact value (or a matching glob) in GoTrue's
    // ADDITIONAL_REDIRECT_URLS — else GoTrue falls back to SITE_URL.
    if (__DEV__) console.log("[auth] redirectTo =", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // REQUIRED: without redirect_to, GoTrue ignores the allow-list and
        // always bounces to SITE_URL. `redirectTo` resolves to
        // playertwo://auth-callback in dev/prod builds and the exp:// URL in
        // Expo Go — and must match what openAuthSessionAsync watches below.
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("Could not start Google sign-in.");

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === "success" && res.url) {
      await createSessionFromUrl(res.url);
    } else if (res.type !== "cancel" && res.type !== "dismiss") {
      throw new Error("Sign-in was interrupted. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from(TABLES.profiles)
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, [session]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!session) return;
      const { data, error } = await supabase
        .from(TABLES.profiles)
        .update(patch)
        .eq("id", session.user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    },
    [session]
  );

  const updateStatusBubble = useCallback(
    (text: string) => updateProfile({ status_bubble: text }),
    [updateProfile]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateStatusBubble,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
