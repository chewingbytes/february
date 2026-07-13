import * as Haptics from "expo-haptics";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Check, Plus, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import {
  createGame,
  fetchGame,
  GAME_KINDS,
  SUGGESTED_PAIRS,
  updateGame,
} from "@/lib/games";
import { M } from "@/lib/motion";
import { T, eyebrow } from "@/lib/theme";
import type { GameItem, GameKind } from "@/lib/types";

/**
 * Create / edit one of your profile minigames. Three flavours:
 *   ⚖️ This or That — add pairs (curated suggestions + your own), pick YOUR
 *      side of each; your match tries to land on the same sides.
 *   🎭 Two Truths & a Lie — three statements, flag the lie.
 *   🔮 Guess About Me — mini quiz; mark the true answer per question.
 */

type Pair = { a: string; b: string; answer: 0 | 1 | null };
type Quiz = { prompt: string; options: string[]; answer: number | null };

export default function CreateGame() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const editing = !!id;
  const [kind, setKind] = useState<GameKind | null>(null);
  const [title, setTitle] = useState("");
  const [loadingGame, setLoadingGame] = useState(editing);
  const [saving, setSaving] = useState(false);

  // per-kind editor state
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [customA, setCustomA] = useState("");
  const [customB, setCustomB] = useState("");
  const [statements, setStatements] = useState<string[]>(["", "", ""]);
  const [lie, setLie] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Quiz[]>([
    { prompt: "", options: ["", ""], answer: null },
  ]);

  // Edit mode: hydrate from the stored game.
  useEffect(() => {
    if (!id) return;
    void fetchGame(id).then((g) => {
      if (!g) return setLoadingGame(false);
      setKind(g.kind);
      setTitle(g.title);
      if (g.kind === "this_or_that") {
        setPairs(
          g.items.map((it) => ({
            a: it.options[0] ?? "",
            b: it.options[1] ?? "",
            answer: (it.answer === 1 ? 1 : 0) as 0 | 1,
          }))
        );
      } else if (g.kind === "two_truths") {
        const it = g.items[0];
        setStatements([it?.options[0] ?? "", it?.options[1] ?? "", it?.options[2] ?? ""]);
        setLie(it?.answer ?? null);
      } else {
        setQuestions(
          g.items.map((it) => ({
            prompt: it.prompt ?? "",
            options: [...it.options],
            answer: it.answer,
          }))
        );
      }
      setLoadingGame(false);
    });
  }, [id]);

  if (!session) return <Redirect href="/sign-in" />;

  const pickKind = (k: GameKind) => {
    setKind(k);
    setTitle(GAME_KINDS[k].title);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  /* ── validation + serialisation ── */
  const items: GameItem[] | null = useMemo(() => {
    if (kind === "this_or_that") {
      const done = pairs.filter((p) => p.a.trim() && p.b.trim() && p.answer !== null);
      if (done.length < 3 || done.length !== pairs.length) return null;
      return done.map((p) => ({
        options: [p.a.trim(), p.b.trim()],
        answer: p.answer as number,
      }));
    }
    if (kind === "two_truths") {
      if (statements.some((s) => !s.trim()) || lie === null) return null;
      return [{ options: statements.map((s) => s.trim()), answer: lie }];
    }
    if (kind === "guess_me") {
      const ok =
        questions.length >= 1 &&
        questions.every(
          (q) =>
            q.prompt.trim() &&
            q.options.length >= 2 &&
            q.options.every((o) => o.trim()) &&
            q.answer !== null
        );
      if (!ok) return null;
      return questions.map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        answer: q.answer as number,
      }));
    }
    return null;
  }, [kind, pairs, statements, lie, questions]);

  const canSave = !!kind && !!title.trim() && !!items && !saving;

  const save = async () => {
    if (!kind || !items) return;
    setSaving(true);
    try {
      if (editing && id) {
        await updateGame(id, { title: title.trim(), items });
      } else {
        await createGame(session.user.id, kind, title.trim(), items);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      router.back();
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
      setSaving(false);
    }
  };

  const suggestionsLeft = SUGGESTED_PAIRS.filter(
    ([a, b]) => !pairs.some((p) => p.a === a && p.b === b)
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* header */}
      <View style={styles.header}>
        <PressableScale to={0.88} style={styles.closeBtn} onPress={() => router.back()}>
          <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
        </PressableScale>
        <Text style={styles.headerTitle}>
          {editing ? "Edit game" : kind ? GAME_KINDS[kind].title : "New game"}
        </Text>
        <PressableScale
          style={[styles.saveBtn, !canSave && { opacity: 0.35 }]}
          onPress={canSave ? () => void save() : undefined}
        >
          {saving ? (
            <ActivityIndicator size="small" color={T.colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </PressableScale>
      </View>

      {loadingGame ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.colors.sage} />
        </View>
      ) : !kind ? (
        /* ── step 1: pick a flavour ── */
        <ScrollView
          contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 30 }}
        >
          <Text style={styles.pickTitle}>What kind of game?</Text>
          <Text style={styles.pickSub}>
            Your matches play it from your chat — you set the answers once.
          </Text>
          {(Object.keys(GAME_KINDS) as GameKind[]).map((k, i) => (
            <Animated.View key={k} entering={M.fadeDown(60 + i * 60)}>
              <PressableScale to={0.97} onPress={() => pickKind(k)} style={styles.kindCard}>
                <View style={styles.kindEmojiRing}>
                  <Text style={{ fontSize: 26 }}>{GAME_KINDS[k].emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kindTitle}>{GAME_KINDS[k].title}</Text>
                  <Text style={styles.kindTagline}>{GAME_KINDS[k].tagline}</Text>
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        /* ── step 2: the editor ── */
        <ScrollView
          contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(t) => t.length <= 40 && setTitle(t)}
            placeholder={GAME_KINDS[kind].title}
            placeholderTextColor={T.forestA(0.3)}
          />

          {kind === "this_or_that" && (
            <>
              <Text style={styles.fieldLabel}>Your pairs · pick YOUR side of each</Text>
              {pairs.map((p, i) => (
                <Animated.View key={i} layout={M.layout} entering={M.fadeDown()}>
                  <View style={styles.pairCard}>
                    <PressableScale
                      to={0.85}
                      haptic={false}
                      onPress={() => setPairs((cur) => cur.filter((_, j) => j !== i))}
                      style={styles.pairRemove}
                    >
                      <X size={13} color={T.forestA(0.45)} strokeWidth={2.4} />
                    </PressableScale>
                    <View style={styles.pairSides}>
                      {([0, 1] as const).map((side) => {
                        const label = side === 0 ? p.a : p.b;
                        const on = p.answer === side;
                        return (
                          <PressableScale
                            key={side}
                            to={0.96}
                            onPress={() =>
                              setPairs((cur) =>
                                cur.map((x, j) => (j === i ? { ...x, answer: side } : x))
                              )
                            }
                            style={[styles.pairSide, on && styles.pairSideOn]}
                          >
                            {on && (
                              <Check
                                size={13}
                                color={T.colors.white}
                                strokeWidth={3}
                              />
                            )}
                            <Text
                              style={[styles.pairSideText, on && { color: T.colors.white }]}
                              numberOfLines={1}
                            >
                              {label}
                            </Text>
                          </PressableScale>
                        );
                      })}
                    </View>
                    {p.answer === null && (
                      <Text style={styles.pairHint}>tap the side that's you</Text>
                    )}
                  </View>
                </Animated.View>
              ))}

              {/* custom pair */}
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  value={customA}
                  onChangeText={setCustomA}
                  placeholder="Bubble tea"
                  placeholderTextColor={T.forestA(0.3)}
                  maxLength={24}
                />
                <Text style={styles.customVs}>or</Text>
                <TextInput
                  style={styles.customInput}
                  value={customB}
                  onChangeText={setCustomB}
                  placeholder="Kopi peng"
                  placeholderTextColor={T.forestA(0.3)}
                  maxLength={24}
                />
                <PressableScale
                  to={0.85}
                  style={[
                    styles.customAdd,
                    !(customA.trim() && customB.trim()) && { opacity: 0.35 },
                  ]}
                  onPress={
                    customA.trim() && customB.trim()
                      ? () => {
                          setPairs((cur) => [
                            ...cur,
                            { a: customA.trim(), b: customB.trim(), answer: null },
                          ]);
                          setCustomA("");
                          setCustomB("");
                        }
                      : undefined
                  }
                >
                  <Plus size={16} color={T.colors.white} strokeWidth={2.6} />
                </PressableScale>
              </View>

              {suggestionsLeft.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>Quick adds</Text>
                  <View style={styles.chipsWrap}>
                    {suggestionsLeft.map(([a, b]) => (
                      <PressableScale
                        key={`${a}|${b}`}
                        to={0.94}
                        onPress={() =>
                          setPairs((cur) => [...cur, { a, b, answer: null }])
                        }
                        style={styles.suggestChip}
                      >
                        <Plus size={11} color={T.colors.sage} strokeWidth={2.6} />
                        <Text style={styles.suggestChipText}>
                          {a} / {b}
                        </Text>
                      </PressableScale>
                    ))}
                  </View>
                </>
              )}
              <Text style={styles.validHint}>
                {pairs.length < 3
                  ? `Add ${3 - pairs.length} more pair${3 - pairs.length === 1 ? "" : "s"} to save.`
                  : pairs.some((p) => p.answer === null)
                    ? "Pick your side on every pair to save."
                    : "Looking good — save when you're happy."}
              </Text>
            </>
          )}

          {kind === "two_truths" && (
            <>
              <Text style={styles.fieldLabel}>
                Three statements about you · flag the lie
              </Text>
              {statements.map((s, i) => {
                const isLie = lie === i;
                return (
                  <View key={i} style={styles.truthRow}>
                    <TextInput
                      style={styles.truthInput}
                      value={s}
                      onChangeText={(t) =>
                        setStatements((cur) => cur.map((x, j) => (j === i ? t : x)))
                      }
                      placeholder={
                        ["I've met a Minister at a kopitiam", "I can solve a Rubik's cube", "I've never tried durian"][i]
                      }
                      placeholderTextColor={T.forestA(0.3)}
                      multiline
                      maxLength={90}
                    />
                    <PressableScale
                      to={0.92}
                      onPress={() => setLie(i)}
                      style={[styles.lieBtn, isLie && styles.lieBtnOn]}
                    >
                      <Text style={[styles.lieBtnText, isLie && { color: T.colors.white }]}>
                        {isLie ? "the lie 🤫" : "lie?"}
                      </Text>
                    </PressableScale>
                  </View>
                );
              })}
              <Text style={styles.validHint}>
                {statements.some((s) => !s.trim())
                  ? "Fill in all three statements."
                  : lie === null
                    ? "Tap “lie?” on the one that isn't true."
                    : "Perfect — two truths, one lie."}
              </Text>
            </>
          )}

          {kind === "guess_me" && (
            <>
              <Text style={styles.fieldLabel}>
                Questions about you · mark the TRUE answer
              </Text>
              {questions.map((q, qi) => (
                <Animated.View key={qi} layout={M.layout} entering={M.fadeDown()}>
                  <View style={styles.quizCard}>
                    <View style={styles.quizHead}>
                      <Text style={styles.quizNum}>Q{qi + 1}</Text>
                      {questions.length > 1 && (
                        <PressableScale
                          to={0.85}
                          haptic={false}
                          onPress={() =>
                            setQuestions((cur) => cur.filter((_, j) => j !== qi))
                          }
                          style={styles.pairRemove}
                        >
                          <X size={13} color={T.forestA(0.45)} strokeWidth={2.4} />
                        </PressableScale>
                      )}
                    </View>
                    <TextInput
                      style={styles.quizPrompt}
                      value={q.prompt}
                      onChangeText={(t) =>
                        setQuestions((cur) =>
                          cur.map((x, j) => (j === qi ? { ...x, prompt: t } : x))
                        )
                      }
                      placeholder="My go-to supper order is…"
                      placeholderTextColor={T.forestA(0.3)}
                      multiline
                      maxLength={90}
                    />
                    {q.options.map((o, oi) => {
                      const isTruth = q.answer === oi;
                      return (
                        <View key={oi} style={styles.optionRow}>
                          <PressableScale
                            to={0.85}
                            haptic={false}
                            onPress={() =>
                              setQuestions((cur) =>
                                cur.map((x, j) =>
                                  j === qi ? { ...x, answer: oi } : x
                                )
                              )
                            }
                            style={[styles.truthDot, isTruth && styles.truthDotOn]}
                          >
                            {isTruth && (
                              <Check size={11} color={T.colors.white} strokeWidth={3.2} />
                            )}
                          </PressableScale>
                          <TextInput
                            style={styles.optionInput}
                            value={o}
                            onChangeText={(t) =>
                              setQuestions((cur) =>
                                cur.map((x, j) =>
                                  j === qi
                                    ? {
                                        ...x,
                                        options: x.options.map((y, k) =>
                                          k === oi ? t : y
                                        ),
                                      }
                                    : x
                                )
                              )
                            }
                            placeholder={`Option ${oi + 1}`}
                            placeholderTextColor={T.forestA(0.3)}
                            maxLength={50}
                          />
                          {q.options.length > 2 && (
                            <PressableScale
                              to={0.85}
                              haptic={false}
                              onPress={() =>
                                setQuestions((cur) =>
                                  cur.map((x, j) =>
                                    j === qi
                                      ? {
                                          ...x,
                                          options: x.options.filter((_, k) => k !== oi),
                                          answer:
                                            x.answer === oi
                                              ? null
                                              : x.answer !== null && x.answer > oi
                                                ? x.answer - 1
                                                : x.answer,
                                        }
                                      : x
                                  )
                                )
                              }
                              style={styles.pairRemove}
                            >
                              <X size={12} color={T.forestA(0.4)} strokeWidth={2.4} />
                            </PressableScale>
                          )}
                        </View>
                      );
                    })}
                    {q.options.length < 4 && (
                      <PressableScale
                        to={0.96}
                        haptic={false}
                        onPress={() =>
                          setQuestions((cur) =>
                            cur.map((x, j) =>
                              j === qi ? { ...x, options: [...x.options, ""] } : x
                            )
                          )
                        }
                        style={styles.addOption}
                      >
                        <Plus size={13} color={T.colors.sage} strokeWidth={2.4} />
                        <Text style={styles.addOptionText}>Add option</Text>
                      </PressableScale>
                    )}
                  </View>
                </Animated.View>
              ))}
              <PressableScale
                to={0.97}
                onPress={() =>
                  setQuestions((cur) => [
                    ...cur,
                    { prompt: "", options: ["", ""], answer: null },
                  ])
                }
                style={styles.addQuestion}
              >
                <Plus size={15} color={T.colors.white} strokeWidth={2.4} />
                <Text style={styles.addQuestionText}>Add question</Text>
              </PressableScale>
              <Text style={styles.validHint}>
                Mark the true answer (the ring) on every question.
              </Text>
            </>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 20,
    color: T.colors.forest,
  },
  saveBtn: {
    minWidth: 64,
    height: 34,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  saveBtnText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13.5,
    color: T.colors.white,
  },
  pickTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 26,
    color: T.colors.forest,
    marginTop: 8,
  },
  pickSub: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: T.forestA(0.5),
  },
  kindCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.xl,
    padding: 16,
    marginBottom: 12,
    ...T.shadow.soft,
  },
  kindEmojiRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  kindTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 19,
    color: T.colors.forest,
  },
  kindTagline: {
    marginTop: 3,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.forestA(0.55),
  },
  fieldLabel: {
    ...eyebrow,
    fontSize: 10.5,
    color: T.colors.sage,
    marginTop: 20,
    marginBottom: 10,
  },
  titleInput: {
    height: 50,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.forest,
  },
  pairCard: {
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    padding: 10,
    marginBottom: 9,
  },
  pairRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  pairSides: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 24,
  },
  pairSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: T.radii.md,
    borderWidth: 1,
    borderColor: T.colors.stone,
    backgroundColor: T.colors.cardClay,
    paddingHorizontal: 10,
  },
  pairSideOn: {
    backgroundColor: T.colors.sage,
    borderColor: T.colors.sage,
  },
  pairSideText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13.5,
    color: T.colors.forest,
  },
  pairHint: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 11,
    color: T.forestA(0.4),
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  customInput: {
    flex: 1,
    height: 44,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 12,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    color: T.colors.forest,
  },
  customVs: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.forestA(0.45),
  },
  customAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.sageA(0.1),
    borderWidth: 1,
    borderColor: T.sageA(0.3),
    borderRadius: T.radii.full,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  suggestChipText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    color: T.colors.forest,
  },
  validHint: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.45),
  },
  truthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },
  truthInput: {
    flex: 1,
    minHeight: 52,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: T.fonts.sans,
    fontSize: 14,
    color: T.colors.forest,
  },
  lieBtn: {
    width: 74,
    height: 40,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.colors.stone,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  lieBtnOn: {
    backgroundColor: T.colors.terracotta,
    borderColor: T.colors.terracotta,
  },
  lieBtnText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 11.5,
    color: T.forestA(0.55),
  },
  quizCard: {
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    padding: 12,
    marginBottom: 10,
  },
  quizHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  quizNum: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.terracotta,
  },
  quizPrompt: {
    minHeight: 44,
    backgroundColor: T.colors.cardClay,
    borderRadius: T.radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontFamily: T.fonts.sansMedium,
    fontSize: 13.5,
    color: T.colors.forest,
    marginBottom: 9,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 7,
  },
  truthDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.colors.stone,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  truthDotOn: {
    backgroundColor: T.colors.sage,
    borderColor: T.colors.sage,
  },
  optionInput: {
    flex: 1,
    height: 40,
    backgroundColor: T.colors.cardClay,
    borderRadius: T.radii.sm,
    paddingHorizontal: 11,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    color: T.colors.forest,
  },
  addOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  addOptionText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    color: T.colors.sage,
  },
  addQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.sage,
    marginTop: 4,
  },
  addQuestionText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.colors.white,
  },
});
