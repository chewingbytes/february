import { useRouter } from "expo-router";
import { CalendarDays, ChevronRight, PenLine } from "lucide-react-native";
import React from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonCard } from "@/components/home/person-card";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { SAMPLE_RAILS, type SampleRail } from "@/lib/sample";
import { T, eyebrow } from "@/lib/theme";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late,";
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function Rail({ rail, index }: { rail: SampleRail; index: number }) {
  return (
    <Animated.View
      entering={M.fadeUp(120 + index * 60)}
      style={styles.rail}
    >
      <View style={styles.railHeader}>
        <Text style={styles.railTitle}>{rail.title}</Text>
        <Text style={styles.railSubtitle}>{rail.subtitle}</Text>
      </View>
      <FlatList
        horizontal
        data={rail.people}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index: i }) => (
          <PersonCard person={item} index={i} size={index === 0 ? "lg" : "md"} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
      />
    </Animated.View>
  );
}

export default function Home() {
  const { profile, session } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const firstName = (profile?.display_name ?? session?.user.email ?? "there")
    .split(/[\s@]/)[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── header ── */}
      <Animated.View entering={M.fadeDown()} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>{greeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
        <PressableScale to={0.92} onPress={() => router.push("/profile")}>
          <Avatar uri={profile?.avatar_url} name={profile?.display_name ?? "P2"} size={46} />
        </PressableScale>
      </Animated.View>

      {/* ── my status bubble (editable in profile) ── */}
      <Animated.View entering={M.fadeDown(40)}>
        <PressableScale
          to={0.98}
          onPress={() => router.push("/profile")}
          style={styles.bubbleCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bubbleLabel}>Your bubble</Text>
            <Text
              style={[
                styles.bubbleValue,
                !profile?.status_bubble && styles.bubblePlaceholder,
              ]}
              numberOfLines={1}
            >
              {profile?.status_bubble || "Say something about your day…"}
            </Text>
          </View>
          <View style={styles.bubbleEdit}>
            <PenLine size={14} color={T.colors.terracotta} strokeWidth={2} />
            <Text style={styles.bubbleEditText}>Edit</Text>
          </View>
        </PressableScale>
      </Animated.View>

      {/* ── pilot night banner ── */}
      <Animated.View entering={M.fadeDown(80)}>
        <PressableScale
          to={0.98}
          onPress={() => router.push("/(tabs)/map")}
          style={styles.banner}
        >
          <View style={styles.bannerIcon}>
            <CalendarDays size={18} color={T.colors.white} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerEyebrow}>Game night</Text>
            <Text style={styles.bannerTitle}>Sat 18 Jul · King and the Pawn</Text>
          </View>
          <ChevronRight size={18} color={T.whiteA(0.8)} strokeWidth={2} />
        </PressableScale>
      </Animated.View>

      {/* ── rails ── */}
      {SAMPLE_RAILS.map((rail, i) => (
        <Rail key={rail.id} rail={rail} index={i} />
      ))}

      <Text style={styles.disclaimer}>
        Profiles shown are a preview — your real pairings land after the pilot night.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  hello: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 14,
    color: T.colors.sage,
  },
  name: {
    fontFamily: T.fonts.serif,
    fontSize: 30,
    color: T.colors.forest,
    marginTop: 1,
  },
  bubbleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleLabel: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.sage,
  },
  bubbleValue: {
    marginTop: 3,
    fontFamily: T.fonts.sansMedium,
    fontSize: 14.5,
    color: T.colors.forest,
  },
  bubblePlaceholder: {
    color: T.forestA(0.38),
  },
  bubbleEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  bubbleEditText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13,
    color: T.colors.terracotta,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: T.colors.forest,
    borderRadius: T.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...T.shadow.medium,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.whiteA(0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  bannerEyebrow: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.blush,
  },
  bannerTitle: {
    marginTop: 2,
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14.5,
    color: T.colors.white,
  },
  rail: {
    marginTop: 30,
  },
  railHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  railTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 22,
    color: T.colors.forest,
  },
  railSubtitle: {
    marginTop: 3,
    fontFamily: T.fonts.sans,
    fontSize: 13,
    color: T.forestA(0.5),
  },
  railContent: {
    paddingHorizontal: 20,
  },
  disclaimer: {
    marginTop: 34,
    marginHorizontal: 40,
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: T.forestA(0.4),
  },
});
