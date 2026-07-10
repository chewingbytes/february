import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import { Check, LogOut, X } from "lucide-react-native";
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
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { T, eyebrow } from "@/lib/theme";

const BUBBLE_MAX = 80;

/**
 * Profile modal — where you set your "bubble": the one-liner about your day
 * that floats on your card in other people's home rails.
 */
export default function Profile() {
  const { session, profile, updateStatusBubble, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bubble, setBubble] = useState(profile?.status_bubble ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) return <Redirect href="/sign-in" />;

  const dirty = bubble.trim() !== (profile?.status_bubble ?? "");

  const save = async () => {
    setSaving(true);
    try {
      await updateStatusBubble(bubble.trim());
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
            uri={profile?.avatar_url}
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

        {/* bubble editor */}
        <Animated.View entering={M.fadeDown(50)} style={styles.section}>
          <Text style={styles.sectionLabel}>Your bubble</Text>
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
              <Text style={styles.saveText}>Save bubble</Text>
            )}
          </PressableScale>
        </Animated.View>

        {/* sign out */}
        <Animated.View entering={M.fadeDown(100)} style={styles.section}>
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
