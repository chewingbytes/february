/**
 * Emails allowed to create / edit events on the map. Mirrored server-side in
 * the RLS policies (supabase/p2_schema.sql) — the client check only hides UI,
 * the database enforces it.
 */
export const ADMIN_EMAILS = ["bryanchewzy24@gmail.com"];

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());
