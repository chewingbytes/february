import * as Haptics from "expo-haptics";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronRight, Dices, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { GAME_KINDS, resultLine, scorePlay, submitPlay, usePartnerGames } from "@/lib/games";
import { M } from "@/lib/motion";
import { T, eyebrow } from "@/lib/theme";
import type { Game } from "@/lib/types";

/**
 * The minigame arcade for one chat: pick one of your match's games, play it
 * through, and the result posts straight into your thread (both of you see
 * it live). Replays are allowed — beat your own read on them.
 */
export default function PlayGames() {
  const { matchId, partner, name } = useLocalSearchParams<{
    matchId: string;
    partner?: string;
    name?: string;
  }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = session?.user.id;

  const partnerName = name ?? "your match";
  const { games, plays, loading } = usePartnerGames(partner, matchId, myId);

  const [game, setGame] = useState<Game | null>(null); // playing this
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null); // brief highlight
  const [done, setDone] = useState(false);
  const [sendState, setSendState] = useState<"sending" | "sent" | "error">("sending");
  const submitted = useRef(false);

  // Auto-submit once when a run finishes.
  useEffect(() => {
    if (!done || !game || !myId || submitted.current) return;
    submitted.current = true;
    submitPlay(game, matchId, myId, picks)
      .then(() => setSendState("sent"))
      .catch(() => setSendState("error"));
  }, [done, game, matchId, myId, picks]);

  if (!session) return <Redirect href="/sign-in" />;

  const start = (g: Game) => {
    setGame(g);
    setIndex(0);
    setPicks([]);
    setPicked(null);
    setDone(false);
    setSendState("sending");
    submitted.current = false;
  };

  const quit = () => {
    if (!game || done) {
      if (game && done) setGame(null);
      else router.back();
      return;
    }
    Alert.alert("Leave the game?", "This run won't be saved.", [
      { text: "Keep playing", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => setGame(null) },
    ]);
  };

  const choose = (optionIndex: number) => {
    if (!game || picked !== null) return;
    setPicked(optionIndex);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(() => {
      const nextPicks = [...picks, optionIndex];
      setPicks(nextPicks);
      setPicked(null);
      if (index + 1 >= game.items.length) setDone(true);
      else setIndex((i) => i + 1);
    }, 260);
  };

  /* ─────────────────────────── results ─────────────────────────── */
  if (game && done) {
    const { score, total } = scorePlay(game, picks);
    const kind = GAME_KINDS[game.kind];
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>{game.title}</Text>
          <PressableScale to={0.88} style={styles.closeBtn} onPress={() => setGame(null)}>
            <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
          </PressableScale>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={M.fadeDown()} style={styles.scoreCard}>
            <Text style={{ fontSize: 40 }}>{kind.emoji}</Text>
            <Text style={styles.scoreHeadline}>{resultLine(game.kind, score, total)}</Text>
            {game.kind !== "two_truths" && (
              <Text style={styles.scoreFraction}>
                {score} / {total}
              </Text>
            )}
            <View style={styles.sentChip}>
              {sendState === "sending" ? (
                <ActivityIndicator size="small" color={T.colors.sage} />
              ) : sendState === "sent" ? (
                <>
                  <Check size={13} color={T.colors.sage} strokeWidth={2.6} />
                  <Text style={styles.sentText}>Result sent to your chat</Text>
                </>
              ) : (
                <Text style={[styles.sentText, { color: T.colors.terracotta }]}>
                  Couldn&rsquo;t post to the chat — it still counts 😉
                </Text>
              )}
            </View>
          </Animated.View>

          <Text style={styles.breakdownLabel}>The reveal</Text>
          {game.items.map((item, i) => {
            const mine = picks[i];
            const hit = mine === item.answer;
            const isLieGame = game.kind === "two_truths";
            return (
              <Animated.View
                key={i}
                entering={M.fadeDown(80 + i * 50)}
                style={[styles.revealCard, hit ? styles.revealHit : styles.revealMiss]}
              >
                {item.prompt ? (
                  <Text style={styles.revealPrompt}>{item.prompt}</Text>
                ) : null}
                <Text style={styles.revealLine}>
                  <Text style={styles.revealWho}>You picked: </Text>
                  {item.options[mine] ?? "—"}
                </Text>
                <Text style={styles.revealLine}>
                  <Text style={styles.revealWho}>
                    {isLieGame
                      ? "The lie was: "
                      : game.kind === "this_or_that"
                        ? `${partnerName}: `
                        : "Truth: "}
                  </Text>
                  {item.options[item.answer]}
                </Text>
                <View style={[styles.revealBadge, hit ? styles.badgeHit : styles.badgeMiss]}>
                  <Text style={[styles.revealBadgeText, { color: hit ? T.colors.sage : T.colors.terracotta }]}>
                    {game.kind === "this_or_that"
                      ? hit
                        ? "Same side"
                        : "Split vote"
                      : hit
                        ? isLieGame
                          ? "Caught it"
                          : "Correct"
                        : isLieGame
                          ? "Fooled you"
                          : "Missed"}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          <PressableScale style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to the chat</Text>
          </PressableScale>
          <PressableScale
            style={styles.againBtn}
            onPress={() => start(game)}
            haptic={false}
          >
            <Text style={styles.againBtnText}>Play again</Text>
          </PressableScale>
        </ScrollView>
      </View>
    );
  }

  /* ─────────────────────────── playing ─────────────────────────── */
  if (game) {
    const item = game.items[index];
    const kind = GAME_KINDS[game.kind];
    const progress = index / game.items.length;
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <PressableScale to={0.88} style={styles.closeBtn} onPress={quit}>
            <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
          </PressableScale>
          <Text style={styles.headerTitle}>{game.title}</Text>
          <Text style={styles.progressCount}>
            {index + 1}/{game.items.length}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: Math.max(progress, 0.02) }]} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <Animated.View
          key={index}
          entering={FadeInRight.duration(220)}
          exiting={FadeOutLeft.duration(150)}
          style={styles.playBody}
        >
          <Text style={styles.playEyebrow}>
            {kind.emoji} {kind.playHint}
          </Text>
          <Text style={styles.playPrompt}>
            {item.prompt ??
              (game.kind === "this_or_that" ? "Which one is more you?" : "")}
          </Text>

          <View style={{ marginTop: 26, gap: 12 }}>
            {item.options.map((opt, oi) => {
              const on = picked === oi;
              return (
                <PressableScale
                  key={oi}
                  to={0.97}
                  onPress={() => choose(oi)}
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Text style={[styles.optionText, on && { color: T.colors.white }]}>
                    {opt}
                  </Text>
                  {on && <Check size={17} color={T.colors.white} strokeWidth={2.6} />}
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      </View>
    );
  }

  /* ──────────────────────────── list ───────────────────────────── */
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>{partnerName}&rsquo;s games</Text>
        <PressableScale to={0.88} style={styles.closeBtn} onPress={() => router.back()}>
          <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
        </PressableScale>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.colors.sage} />
        </View>
      ) : games.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyRing}>
            <Dices size={30} color={T.colors.sage} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>No games yet</Text>
          <Text style={styles.emptyBody}>
            {partnerName} hasn&rsquo;t set up any games. Nudge them — or set up
            yours in your profile and make them play first 😌
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.listHint}>
            Play one — the result posts into your chat for both of you.
          </Text>
          {games.map((g, i) => {
            const kind = GAME_KINDS[g.kind];
            const best = plays
              .filter((p) => p.game_id === g.id)
              .sort((a, b) => b.score - a.score)[0];
            return (
              <Animated.View key={g.id} entering={M.fadeDown(50 + i * 50)}>
                <PressableScale to={0.97} onPress={() => start(g)} style={styles.gameCard}>
                  <View style={styles.gameEmojiRing}>
                    <Text style={{ fontSize: 24 }}>{kind.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gameTitle} numberOfLines={1}>
                      {g.title}
                    </Text>
                    <Text style={styles.gameSub} numberOfLines={2}>
                      {kind.tagline}
                    </Text>
                    <View style={styles.gameMetaRow}>
                      <View style={styles.gameMetaChip}>
                        <Text style={styles.gameMetaText}>
                          {g.items.length} {g.items.length === 1 ? "prompt" : "prompts"}
                        </Text>
                      </View>
                      {best && (
                        <View style={[styles.gameMetaChip, { backgroundColor: T.sageA(0.14) }]}>
                          <Text style={[styles.gameMetaText, { color: T.colors.sage }]}>
                            best {best.score}/{best.total}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color={T.forestA(0.35)} strokeWidth={2.2} />
                </PressableScale>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 44,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: T.fonts.serif,
    fontSize: 19,
    color: T.colors.forest,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCount: {
    width: 32,
    textAlign: "right",
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    color: T.forestA(0.5),
  },
  progressTrack: {
    flexDirection: "row",
    height: 5,
    marginHorizontal: 20,
    borderRadius: 3,
    backgroundColor: T.colors.stone,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: T.colors.sage,
    borderRadius: 3,
  },
  playBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  playEyebrow: {
    ...eyebrow,
    fontSize: 11,
    color: T.colors.terracotta,
  },
  playPrompt: {
    marginTop: 12,
    fontFamily: T.fonts.serif,
    fontSize: 27,
    lineHeight: 34,
    color: T.colors.forest,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 60,
    borderRadius: T.radii.lg,
    borderWidth: 1,
    borderColor: T.colors.stone,
    backgroundColor: T.colors.card,
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...T.shadow.soft,
  },
  optionOn: {
    backgroundColor: T.colors.forest,
    borderColor: T.colors.forest,
  },
  optionText: {
    flex: 1,
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: T.colors.forest,
  },
  listHint: {
    marginBottom: 14,
    fontFamily: T.fonts.sans,
    fontSize: 13,
    color: T.forestA(0.5),
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.xl,
    padding: 14,
    marginBottom: 11,
    ...T.shadow.soft,
  },
  gameEmojiRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 17.5,
    color: T.colors.forest,
  },
  gameSub: {
    marginTop: 2,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: T.forestA(0.5),
  },
  gameMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 7,
  },
  gameMetaChip: {
    backgroundColor: T.colors.cardClay,
    borderRadius: T.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gameMetaText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 10.5,
    color: T.forestA(0.55),
  },
  emptyRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: T.sageA(0.12),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 22,
    color: T.colors.forest,
  },
  emptyBody: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: T.forestA(0.5),
  },
  scoreCard: {
    alignItems: "center",
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.xxl,
    paddingVertical: 26,
    paddingHorizontal: 20,
    ...T.shadow.medium,
  },
  scoreHeadline: {
    marginTop: 12,
    fontFamily: T.fonts.serif,
    fontSize: 25,
    color: T.colors.forest,
    textAlign: "center",
  },
  scoreFraction: {
    marginTop: 6,
    fontFamily: T.fonts.sansBold,
    fontSize: 17,
    color: T.colors.terracotta,
  },
  sentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: T.sageA(0.1),
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sentText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.colors.sage,
  },
  breakdownLabel: {
    ...eyebrow,
    fontSize: 10.5,
    color: T.colors.sage,
    marginTop: 24,
    marginBottom: 10,
  },
  revealCard: {
    borderRadius: T.radii.lg,
    borderWidth: 1,
    padding: 13,
    marginBottom: 9,
  },
  revealHit: {
    backgroundColor: T.sageA(0.08),
    borderColor: T.sageA(0.35),
  },
  revealMiss: {
    backgroundColor: T.terracottaA(0.06),
    borderColor: T.terracottaA(0.3),
  },
  revealPrompt: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: T.colors.forest,
    marginBottom: 6,
  },
  revealLine: {
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: T.forestA(0.8),
  },
  revealWho: {
    fontFamily: T.fonts.sansSemiBold,
    color: T.forestA(0.5),
  },
  revealBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: T.radii.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeHit: { backgroundColor: T.sageA(0.16) },
  badgeMiss: { backgroundColor: T.terracottaA(0.12) },
  revealBadgeText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  doneBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.white,
  },
  againBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  againBtnText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.forestA(0.6),
  },
});
