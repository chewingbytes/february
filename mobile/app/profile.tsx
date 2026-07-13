import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import { Check, ChevronRight, HeartHandshake, LogOut, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MyGames } from "@/components/profile/my-games";
import { PhotoManager } from "@/components/profile/photo-manager";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { T, eyebrow } from "@/lib/theme";

const BUBBLE_MAX = 80;

/** Loose input → clean "@handle" (mirrors the website quiz's normaliser). */
function normalizeTelegram(raw: string): string | null {
  const h = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/\/+$/, "")
    .replace(/^@+/, "")
    .replace(/\s+/g, "");
  return h ? `@${h}` : null;
}

/**
 * Profile modal — your photo wall (order = what matches see), your bubble,
 * your telegram (links your website quiz answers for pairing), and the
 * minigames you host for your matches.
 */
export default function Profile() {
  const { session, profile, updateProfile, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bubble, setBubble] = useState(profile?.status_bubble ?? "");
  const [telegram, setTelegram] = useState(profile?.telegram ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) return <Redirect href="/sign-in" />;

  const admin = isAdminEmail(session.user.email);
  const dirty =
    bubble.trim() !== (profile?.status_bubble ?? "") ||
    (normalizeTelegram(telegram) ?? "") !== (profile?.telegram ?? "");

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        status_bubble: bubble.trim(),
        telegram: normalizeTelegram(telegram),
      });
      setSaved(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      setTimeout(() => setSaved(false), 1600);
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You can always come back — your matches stay put.", [
      { text: "Stay", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/sign-in"));
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <View style={styles.grabber} />
          <PressableScale to={0.88} style={styles.closeBtn} onPress={() => router.back()}>
            <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
          </PressableScale>
        </View>

        {/* identity */}
        <Animated.View entering={M.fadeDown()} style={styles.identity}>
          <Avatar
            uri={profile?.photos?.[0] ?? profile?.avatar_url}
            name={profile?.display_name ?? "P2"}
            size={92}
          />
          <Text style={styles.name}>{profile?.display_name}</Text>
          <View style={styles.emailChip}>
            <Text style={styles.emailText}>{session.user.email}</Text>
          </View>
          <View style={styles.pilotChip}>
            <Text style={styles.pilotText}>Pilot member · July 2026</Text>
          </View>
        </Animated.View>

        {/* photo wall */}
        <Animated.View entering={M.fadeDown(40)} style={styles.section}>
          <Text style={styles.sectionLabel}>Your photos</Text>
          <Text style={styles.sectionHint}>
            Up to six — the first one is your main photo, and this exact order
            is what your matches see.
          </Text>
          <View style={{ marginTop: 16 }}>
            <PhotoManager
              photos={profile?.photos ?? []}
              userId={session.user.id}
              onChange={(next) => updateProfile({ photos: next })}
            />
          </View>
        </Animated.View>

        {/* bubble + telegram */}
        <Animated.View entering={M.fadeDown(80)} style={styles.section}>
          <Text style={styles.sectionLabel}>About you</Text>
          <Text style={styles.sectionHint}>
            A line about your day — it floats on your card for people browsing
            their matches.
          </Text>

          {/* live preview, styled exactly like the home-rail bubble */}
          <View style={styles.previewBubble}>
            <Text style={styles.previewText} numberOfLines={2}>
              {bubble.trim() || "Say something about your day…"}
            </Text>
            <View style={styles.previewTail} />
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={bubble}
              onChangeText={(t) => t.length <= BUBBLE_MAX && setBubble(t)}
              placeholder="Post-gym laksa hunt. Zero regrets 🍜"
              placeholderTextColor={T.forestA(0.3)}
              multiline
            />
            <Text style={styles.counter}>
              {bubble.length}/{BUBBLE_MAX}
            </Text>
          </View>

          <Text style={[styles.sectionHint, { marginTop: 16 }]}>
            Telegram — the same handle you used on the application quiz, so we
            can link your answers.
          </Text>
          <View style={styles.tgWrap}>
            <Text style={styles.tgAt}>@</Text>
            <TextInput
              style={styles.tgInput}
              value={telegram.replace(/^@/, "")}
              onChangeText={setTelegram}
              placeholder="username"
              placeholderTextColor={T.forestA(0.3)}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              maxLength={32}
            />
          </View>

          <PressableScale
            style={[styles.saveBtn, (!dirty || saving) && !saved && styles.saveDisabled]}
            onPress={!dirty || saving ? undefined : () => void save()}
          >
            {saving ? (
              <ActivityIndicator color={T.colors.white} />
            ) : saved ? (
              <>
                <Check size={16} color={T.colors.white} strokeWidth={2.5} />
                <Text style={styles.saveText}>Saved</Text>
              </>
            ) : (
              <Text style={styles.saveText}>Save changes</Text>
            )}
          </PressableScale>
        </Animated.View>

        {/* minigames */}
        <Animated.View entering={M.fadeDown(120)} style={styles.section}>
          <Text style={styles.sectionLabel}>Your games</Text>
          <Text style={styles.sectionHint}>
            Little ice-breakers your matches can play from your chat — set your
            answers once, see how well they read you.
          </Text>
          <View style={{ marginTop: 14 }}>
            <MyGames userId={session.user.id} />
          </View>
        </Animated.View>

        {/* admin */}
        {admin && (
          <Animated.View entering={M.fadeDown(150)} style={styles.section}>
            <PressableScale
              to={0.98}
              onPress={() => router.push("/admin")}
              style={styles.adminBtn}
            >
              <View style={styles.adminIcon}>
                <HeartHandshake size={17} color={T.colors.white} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminTitle}>Matchmaker</Text>
                <Text style={styles.adminSub}>
                  Review members & quiz answers · pair people up
                </Text>
              </View>
              <ChevronRight size={17} color={T.whiteA(0.75)} strokeWidth={2.2} />
            </PressableScale>
          </Animated.View>
        )}

        {/* sign out */}
        <Animated.View entering={M.fadeDown(180)} style={styles.section}>
          <PressableScale style={styles.signOut} onPress={confirmSignOut}>
            <LogOut size={16} color={T.colors.terracotta} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign out</Text>
          </PressableScale>
        </Animated.View>

        <Text style={styles.version}>Player 2 · pilot build</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.colors.stone,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    alignItems: "center",
    marginTop: 18,
  },
  name: {
    marginTop: 14,
    fontFamily: T.fonts.serif,
    fontSize: 27,
    color: T.colors.forest,
  },
  emailChip: {
    marginTop: 8,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  emailText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    color: T.forestA(0.6),
  },
  pilotChip: {
    marginTop: 8,
    backgroundColor: T.terracottaA(0.1),
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pilotText: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.terracotta,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    ...eyebrow,
    color: T.colors.sage,
  },
  sectionHint: {
    marginTop: 6,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: T.forestA(0.5),
  },
  previewBubble: {
    alignSelf: "flex-start",
    marginTop: 18,
    marginLeft: 6,
    maxWidth: "88%",
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    transform: [{ rotate: "-1.2deg" }],
    ...T.shadow.soft,
  },
  previewTail: {
    position: "absolute",
    bottom: -6,
    left: 18,
    width: 10,
    height: 10,
    backgroundColor: T.colors.card,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: T.colors.stone,
    transform: [{ rotate: "45deg" }],
  },
  previewText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.forestA(0.75),
  },
  inputWrap: {
    marginTop: 16,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  input: {
    minHeight: 52,
    fontFamily: T.fonts.sans,
    fontSize: 15,
    color: T.colors.forest,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontFamily: T.fonts.sans,
    fontSize: 11,
    color: T.forestA(0.35),
  },
  tgWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    height: 50,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
  },
  tgAt: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.forestA(0.55),
  },
  tgInput: {
    flex: 1,
    fontFamily: T.fonts.sans,
    fontSize: 15,
    color: T.colors.forest,
  },
  saveBtn: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    height: 50,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: {
    opacity: 0.35,
  },
  saveText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.white,
  },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.colors.forest,
    borderRadius: T.radii.lg,
    paddingHorizontal: 15,
    paddingVertical: 14,
    ...T.shadow.medium,
  },
  adminIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.whiteA(0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  adminTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 17,
    color: T.colors.white,
  },
  adminSub: {
    marginTop: 1,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    color: T.whiteA(0.65),
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.terracottaA(0.4),
  },
  signOutText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.terracotta,
  },
  version: {
    marginTop: 26,
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 11.5,
    color: T.forestA(0.35),
  },
});
