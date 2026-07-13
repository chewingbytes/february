import { createClient } from "@supabase/supabase-js";

/**
 * Profile-photo storage — the SAME Supabase-cloud project the meetup2 app
 * uses, whose storage is backed by Cloudflare R2. It is a separate client
 * from lib/supabase.ts (which talks to the self-hosted instance): auth and
 * data live on hangoutstudios, files live here on R2.
 *
 * Player 2 files are namespaced under `p2/…` inside the shared bucket so
 * they can't collide with meetup2's uploads.
 */
const STORAGE_URL = "https://nlsggkzpooovjifqcbig.supabase.co";
const STORAGE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sc2dna3pwb29vdmppZnFjYmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDU4NjMsImV4cCI6MjA1NjA4MTg2M30.BEjDniiAZAu1u3lBPiHf750OqdJiEWZu1M05j4_44xo";
const BUCKET = "image_storage";

const storageClient = createClient(STORAGE_URL, STORAGE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function extFromUri(uri: string): string {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (!ext || ext.length > 5) return "jpg";
  return ext;
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return "image/jpeg";
  }
}

/**
 * Upload a locally-picked image to `p2/{userId}/{timestamp}.{ext}` and return
 * its public URL (what we store in p2_profiles.photos).
 */
export async function uploadProfilePhoto(
  userId: string,
  localUri: string
): Promise<string> {
  const ext = extFromUri(localUri);
  const path = `p2/${userId}/${Date.now()}.${ext}`;

  // Same read pattern as meetup2: fetch the file:// URI into an ArrayBuffer.
  const res = await fetch(localUri);
  if (!res.ok) throw new Error("Couldn't read the selected image.");
  const buf = await res.arrayBuffer();

  const { error } = await storageClient.storage.from(BUCKET).upload(path, buf, {
    contentType: mimeFromExt(ext),
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message || "Photo upload failed.");

  return storageClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Best-effort delete by public URL. Foreign URLs (e.g. Google avatars) are
 * ignored; storage failures never block the profile update that follows.
 */
export async function deletePhotoByUrl(publicUrl: string): Promise<void> {
  const prefix = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!publicUrl.startsWith(prefix)) return;
  const path = publicUrl.slice(prefix.length).split("?")[0];
  try {
    await storageClient.storage.from(BUCKET).remove([path]);
  } catch {
    // orphaned file is acceptable; the profile row is the source of truth
  }
}
