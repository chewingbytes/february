# Player 2 — mobile app

Expo (React Native) companion app for **february.place / Player 2**: matched
pairs chat in realtime and team up for hosted game nights around Singapore.
The design is a straight port of the website's Botanical / Organic Serif
system — alabaster, forest, sage, clay, terracotta, Playfair Display + Source
Sans 3.

## What's inside

| Area   | Details |
| ------ | ------- |
| Auth   | Google OAuth only, via the shared self-hosted Supabase (GoTrue) |
| Home   | Horizontal rails ("We think you should meet", "Shares your competitiveness", "Matches your energy") with compatibility badges + status bubbles. **Sample data for now** (`lib/sample.ts`) |
| Chats  | Supabase Realtime: live messages, ✓/✓✓ read receipts, presence (online now / last seen), typing indicator, day separators, optimistic sends |
| Nights (map) | Google Map (botanical style) with event pins. Only `bryanchewzy24@gmail.com` can create events (UI + RLS). Pairs join with the **both-agree** flow: one suggests → invite lands in the chat → partner accepts → you're both in |
| Profile | Edit your "bubble" (the about-my-day line other people see on your card) + sign out |

## One-time setup

### 1. Database

Open the Supabase SQL editor and run [`supabase/p2_schema.sql`](supabase/p2_schema.sql).
Every table is prefixed `p2_` so nothing collides with the other apps sharing
this instance. Then sign in on the app once (creates your profile) and re-run
the SEED block at the bottom of the file to drop the pilot-night pin.

To create a real match (so two accounts can chat), use the commented block at
the bottom of the schema file, or insert into `p2_matches` from the dashboard.

### 2. Google OAuth redirect

GoTrue must be allowed to redirect back into the app. Add these to
`GOTRUE_URI_ALLOW_LIST` (comma-separated) in your Supabase docker `.env`, then
restart the auth container:

```
playertwo://auth-callback,exp://*/--/auth-callback
```

(`playertwo://…` is the dev/prod build; the `exp://` wildcard covers Expo Go.
If your GoTrue version doesn't support wildcards, run the app once, log the
exact `Linking.createURL("auth-callback")` value and whitelist that.)

Google provider is already configured on this instance (the meetup2 webapp
uses it) — no Google Cloud changes needed.

### 3. Google Maps keys (dev/prod builds only)

Copy `.env.example` → `.env.local` and fill in native Maps SDK keys
(same ones as the meetup2 app work):

```
GOOGLE_MAPS_API_KEY_IOS=AIza...
GOOGLE_MAPS_API_KEY_ANDROID=AIza...
```

## Running it

```bash
cd mobile
npm install

# Expo Go (fastest) — everything works EXCEPT the native map,
# which is auto-stubbed (events show as a tappable list instead)
npx expo start

# Real map — dev build
npx expo run:ios      # or: npx expo run:android
```

The map shim ([`components/maps.tsx`](components/maps.tsx)) detects Expo Go at
runtime — no code changes needed when switching between Go and dev builds.

## Where things live

```
app/                 expo-router routes
  _layout.tsx        fonts + auth provider + stack
  sign-in.tsx        hero photo + Google button
  (tabs)/            Home · Chats · Nights (custom botanical tab bar)
  chat/[id].tsx      realtime room
  profile.tsx        bubble editor + sign out (modal)
components/          ui primitives, home cards, chat bubbles, map sheets
lib/                 theme tokens, supabase client, auth, chat/events hooks
supabase/            p2_schema.sql (tables + RLS + realtime + seed)
```

## Notes

- **Sample data**: the home rails render `lib/sample.ts` until real pairing
  data exists — swap `SAMPLE_RAILS` for a `p2_profiles` query when ready.
- **Admin allow-list**: `lib/admin.ts` (client UI) and the `p2_events`
  policies in the schema (actual enforcement).
- The Supabase URL/anon key default to the shared instance and can be
  overridden with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
