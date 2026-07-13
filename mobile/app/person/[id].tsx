import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Leaf, MessageCircle, Sparkles } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { M } from "@/lib/motion";
import { findSamplePerson } from "@/lib/sample";
import { supabase, TABLES } from "@/lib/supabase";
import { T, eyebrow } from "@/lib/theme";
import type { Match, Profile } from "@/lib/types";

/** Everything this screen needs, whether the person is sample or real. */
type PersonVM = {
  name: string;
  age: number | null;
  photos: string[];
  bubble: string;
  tag: string | null;
  compatibility: number | null;
  /** Why they're on your home screen (sample rail title). */
  context: string | null;
  isSample: boolean;
  matchId: string | null;
};

/**
 * A person's profile — opened from a home-rail card or a chat header.
 * Their photo wall leads: a full-bleed pager in the exact order they
 * arranged, then their bubble, then the wall again as a browsable grid
 * (main photo wearing the site's signature arch).
 */
export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const sample = useMemo(() => (id ? findSamplePerson(id) : null), [id]);
  const [real, setReal] = useState<{ profile: Profile; match: Match | null } | null>(
    null
  );
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(0);

  // Real profiles: fetch the person + (if any) my match with them.
  useEffect(() => {
    if (sample || !id || !session) return;
    let alive = true;
    (async () => {
      const me = session.user.id;
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from(TABLES.profiles).select("*").eq("id", id).maybeSingle(),
        supabase
          .from(TABLES.matches)
          .select("*")
          .or(`and(user_a.eq.${me},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${me})`)
          .maybeSingle(),
      ]);
      if (!alive) return;
      if (!p) return setNotFound(true);
      setReal({ profile: p as Profile, match: (m as Match) ?? null });
    })();
    return () => {
      alive = false;
    };
  }, [sample, id, session]);

  if (!session) return <Redirect href="/sign-in" />;

  const vm: PersonVM | null = sample
    ? {
        name: sample.person.name,
        age: sample.person.age,
        photos: sample.person.photos,
        bubble: sample.person.bubble,
        tag: sample.person.tag,
        compatibility: sample.person.compatibility,
        context: sample.rail.title,
        isSample: true,
        matchId: null,
      }
    : real
      ? {
          name: real.profile.display_name,
          age: null,
          photos: real.profile.photos?.length
            ? real.profile.photos
            : real.profile.avatar_url
              ? [real.profile.avatar_url]
              : [],
          bubble: real.profile.status_bubble,
          tag: null,
          compatibility: real.match?.compatibility ?? null,
          context: null,
          isSample: false,
          matchId: real.match?.id ?? null,
        }
      : null;

  const heroH = Math.max(420, Math.round(height * 0.58));

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };
  const heroRef = useRef<FlatList<string>>(null);

  if (notFound) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>Profile not found</Text>
        <PressableScale style={styles.missingBtn} onPress={() => router.back()}>
          <Text style={styles.missingBtnText}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  if (!vm) {
    return <View style={styles.center} />;
  }

  const gridW = (width - 40 - 12) / 2;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── hero pager: their arranged photos ── */}
        <View style={[styles.hero, { height: heroH }]}>
          {vm.photos.length > 0 ? (
            <FlatList
              ref={heroRef}
              data={vm.photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => `${i}-${u}`}
              onScroll={onHeroScroll}
              scrollEventThrottle={32}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: heroH }}
                  contentFit="cover"
                  transition={250}
                />
              )}
            />
          ) : (
            <View style={[styles.heroEmpty, { width, height: heroH }]}>
              <Leaf size={44} color={T.sageA(0.6)} strokeWidth={1.4} />
              <Text style={styles.heroEmptyText}>No photos yet</Text>
            </View>
          )}

          {/* readability scrim */}
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(45,58,49,0.25)", "transparent", "rgba(45,58,49,0.88)"]}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* back */}
          <PressableScale
            to={0.88}
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <ChevronLeft size={22} color={T.colors.white} strokeWidth={2.2} />
          </PressableScale>

          {/* compatibility */}
          {vm.compatibility !== null && (
            <View style={[styles.compatPill, { top: insets.top + 12 }]}>
              <Sparkles size={12} color={T.colors.white} strokeWidth={2.2} />
              <Text style={styles.compatText}>{vm.compatibility}%</Text>
            </View>
          )}

          {/* page dots */}
          {vm.photos.length > 1 && (
            <View style={styles.dots}>
              {vm.photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === page && { backgroundColor: T.colors.white, width: 18 },
                  ]}
                />
              ))}
            </View>
          )}

          {/* name block */}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>
              {vm.name}
              {vm.age ? `, ${vm.age}` : ""}
            </Text>
            {vm.tag && (
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>{vm.tag}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── body ── */}
        <View style={styles.body}>
          {vm.context && (
            <Animated.View entering={M.fadeDown(40)} style={styles.contextRow}>
              <Sparkles size={13} color={T.colors.terracotta} strokeWidth={2.2} />
              <Text style={styles.contextText}>{vm.context}</Text>
            </Animated.View>
          )}

          {/* their bubble */}
          <Animated.View entering={M.fadeDown(80)}>
            <Text style={styles.sectionLabel}>Their day</Text>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                {vm.bubble || "Nothing in their bubble yet…"}
              </Text>
              <View style={styles.bubbleTail} />
            </View>
          </Animated.View>

          {/* photo wall, exactly in their order */}
          {vm.photos.length > 1 && (
            <Animated.View entering={M.fadeDown(120)} style={{ marginTop: 28 }}>
              <Text style={styles.sectionLabel}>
                {vm.name}&rsquo;s photo wall
              </Text>
              <View style={styles.wall}>
                {vm.photos.map((u, i) => (
                  <PressableScale
                    key={`${i}-${u}`}
                    to={0.96}
                    onPress={() => {
                      heroRef.current?.scrollToOffset({
                        offset: i * width,
                        animated: false,
                      });
                      setPage(i);
                    }}
                    style={[
                      styles.wallTile,
                      {
                        width: gridW,
                        height: gridW * 1.25,
                        borderTopLeftRadius: i === 0 ? gridW / 2 : T.radii.md,
                        borderTopRightRadius: i === 0 ? gridW / 2 : T.radii.md,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: u }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={200}
                    />
                  </PressableScale>
                ))}
              </View>
              <Text style={styles.wallCaption}>
                Arranged by {vm.name} — tap one to view it up top.
              </Text>
            </Animated.View>
          )}

          {/* CTA / preview note */}
          {vm.matchId ? (
            <Animated.View entering={M.fadeUp(160)}>
              <PressableScale
                style={styles.messageBtn}
                onPress={() => router.push(`/chat/${vm.matchId}`)}
              >
                <MessageCircle size={17} color={T.colors.white} strokeWidth={2} />
                <Text style={styles.messageText}>Message {vm.name}</Text>
              </PressableScale>
            </Animated.View>
          ) : vm.isSample ? (
            <Animated.View entering={M.fadeUp(160)} style={styles.previewNote}>
              <Leaf size={15} color={T.colors.sage} strokeWidth={2} />
              <Text style={styles.previewNoteText}>
                Preview profile — your real pairings land after the pilot night.
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  center: {
    flex: 1,
    backgroundColor: T.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  missingTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 22,
    color: T.colors.forest,
  },
  missingBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  missingBtnText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.colors.white,
  },
  hero: {
    backgroundColor: T.colors.stone,
    borderBottomLeftRadius: T.radii.xxl,
    borderBottomRightRadius: T.radii.xxl,
    overflow: "hidden",
  },
  heroEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: T.colors.cardClay,
  },
  heroEmptyText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 13.5,
    color: T.forestA(0.45),
  },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(45,58,49,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  compatPill: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.colors.terracotta,
    borderRadius: T.radii.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    ...T.shadow.soft,
  },
  compatText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 13,
    color: T.colors.white,
  },
  dots: {
    position: "absolute",
    bottom: 96,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  nameBlock: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 24,
  },
  name: {
    fontFamily: T.fonts.serif,
    fontSize: 34,
    color: T.colors.white,
  },
  tagChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: T.whiteA(0.16),
    borderWidth: 1,
    borderColor: T.whiteA(0.3),
    borderRadius: T.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.whiteA(0.95),
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 44,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    backgroundColor: T.terracottaA(0.1),
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  contextText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    color: T.colors.terracotta,
  },
  sectionLabel: {
    ...eyebrow,
    color: T.colors.sage,
  },
  bubble: {
    alignSelf: "flex-start",
    marginTop: 14,
    marginLeft: 4,
    maxWidth: "92%",
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    transform: [{ rotate: "-1.2deg" }],
    ...T.shadow.soft,
  },
  bubbleTail: {
    position: "absolute",
    top: -6,
    left: 18,
    width: 10,
    height: 10,
    backgroundColor: T.colors.card,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: T.colors.stone,
    transform: [{ rotate: "45deg" }],
  },
  bubbleText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 14.5,
    lineHeight: 20,
    color: T.forestA(0.8),
  },
  wall: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  wallTile: {
    overflow: "hidden",
    borderBottomLeftRadius: T.radii.md,
    borderBottomRightRadius: T.radii.md,
    backgroundColor: T.colors.stone,
    ...T.shadow.soft,
  },
  wallCaption: {
    marginTop: 10,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    color: T.forestA(0.4),
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 30,
    height: 54,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    ...T.shadow.medium,
  },
  messageText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15.5,
    color: T.colors.white,
  },
  previewNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 30,
    backgroundColor: T.sageA(0.12),
    borderRadius: T.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewNoteText: {
    flex: 1,
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.colors.forest,
  },
});
