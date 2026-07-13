import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  HeartHandshake,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { M } from "@/lib/motion";
import { supabase, TABLES } from "@/lib/supabase";
import { T, eyebrow } from "@/lib/theme";
import type { Match, Profile, QuizRow } from "@/lib/types";

/**
 * Matchmaker — the founder's pairing desk (admin email only; RLS enforces).
 *   Members: everyone who signed into the app, with their website quiz
 *            answers linked by telegram handle. Select two → create a match.
 *            The pair's chat channel appears for both of them in realtime.
 *   Quiz:    every website application, in full.
 *   Matches: every live pair — unmatch if needed.
 */

type Tab = "members" | "quiz" | "matches";

const tgKey = (raw?: string | null) =>
  (raw ?? "").trim().replace(/^@+/, "").toLowerCase() || null;

/* Pretty labels for raw quiz values. */
const QUIZ_LABELS: Record<string, string> = {
  man_seeking_woman: "Man → meeting women",
  woman_seeking_man: "Woman → meeting men",
  serious: "Serious relationship",
  open: "Open to dating",
  casual: "Casual / networking",
  ambition: "Ambition & drive",
  empathy: "Empathy & communication",
  lifestyle: "Shared lifestyle & fun",
  hype: "The hype",
  chill: "The chill observer",
  balanced: "Balanced contributor",
  win: "Plays to win",
  laughs: "Plays for laughs",
};
const nice = (v?: string | null) => (v ? (QUIZ_LABELS[v] ?? v) : "—");

export default function Admin() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("members");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);
  const [quiz, setQuiz] = useState<QuizRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<string[]>([]); // profile ids, max 2
  const [compat, setCompat] = useState(90);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p }, { data: q }, { data: m }] = await Promise.all([
      supabase
        .from(TABLES.profiles)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.questionnaire)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from(TABLES.matches)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setMembers((p ?? []) as Profile[]);
    setQuiz((q ?? []) as QuizRow[]);
    setMatches((m ?? []) as Match[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** quiz rows keyed by telegram handle, for member linkage. */
  const quizByTg = useMemo(() => {
    const map = new Map<string, QuizRow>();
    for (const row of quiz) {
      const key = tgKey(row.telegram);
      if (key && !map.has(key)) map.set(key, row);
    }
    return map;
  }, [quiz]);

  const profileById = useMemo(
    () => new Map(members.map((p) => [p.id, p])),
    [members]
  );

  const matchedPairs = useMemo(() => {
    const s = new Set<string>();
    for (const m of matches) s.add([m.user_a, m.user_b].sort().join("|"));
    return s;
  }, [matches]);

  if (!session || !isAdminEmail(session.user.email)) {
    return <Redirect href="/(tabs)" />;
  }

  const toggleSelect = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return [cur[1], id]; // keep the newest two
      return [...cur, id];
    });
  };

  const pairAlreadyMatched =
    selected.length === 2 &&
    matchedPairs.has([selected[0], selected[1]].sort().join("|"));

  const createMatch = async () => {
    if (selected.length !== 2 || creating) return;
    setCreating(true);
    try {
      const { error } = await supabase.from(TABLES.matches).insert({
        user_a: selected[0],
        user_b: selected[1],
        compatibility: compat,
      });
      if (error) throw error;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      setSelected([]);
      await load();
      Alert.alert(
        "Matched ✨",
        "Their chat channel is live — both of them can start talking right now."
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      Alert.alert(
        "Couldn't create the match",
        msg.includes("duplicate") || msg.includes("uniq")
          ? "These two are already matched."
          : msg || "Try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const unmatch = (m: Match) => {
    const a = profileById.get(m.user_a)?.display_name ?? "A";
    const b = profileById.get(m.user_b)?.display_name ?? "B";
    Alert.alert(`Unmatch ${a} & ${b}?`, "Their chat disappears for both of them.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Unmatch",
        style: "destructive",
        onPress: () =>
          void supabase
            .from(TABLES.matches)
            .delete()
            .eq("id", m.id)
            .then(() => load()),
      },
    ]);
  };

  const selectedProfiles = selected
    .map((id) => profileById.get(id))
    .filter((p): p is Profile => !!p);

  return (
    <View style={styles.root}>
      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableScale to={0.9} onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={T.colors.forest} strokeWidth={2} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Matchmaker</Text>
          <Text style={styles.subtitle}>
            {members.length} members · {quiz.length} applications · {matches.length}{" "}
            pairs
          </Text>
        </View>
      </View>

      {/* segmented */}
      <View style={styles.seg}>
        {(
          [
            ["members", "Members"],
            ["quiz", "Quiz"],
            ["matches", "Matches"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <PressableScale
            key={key}
            to={0.97}
            onPress={() => setTab(key)}
            style={[styles.segBtn, tab === key && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === key && styles.segTextActive]}>
              {label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.colors.sage} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: selected.length ? 190 : 60,
          }}
          showsVerticalScrollIndicator={false}
        >
          {tab === "members" &&
            (members.length === 0 ? (
              <Empty text="Nobody has signed into the app yet." />
            ) : (
              members.map((p, i) => (
                <MemberCard
                  key={p.id}
                  profile={p}
                  index={i}
                  selected={selected.includes(p.id)}
                  isMe={p.id === session.user.id}
                  quiz={quizByTg.get(tgKey(p.telegram) ?? "") ?? null}
                  onToggle={() => toggleSelect(p.id)}
                />
              ))
            ))}

          {tab === "quiz" &&
            (quiz.length === 0 ? (
              <Empty text="No quiz applications yet." />
            ) : (
              quiz.map((row, i) => <QuizCard key={String(row.id)} row={row} index={i} />)
            ))}

          {tab === "matches" &&
            (matches.length === 0 ? (
              <Empty text="No pairs yet — select two members to make the first one." />
            ) : (
              matches.map((m, i) => {
                const a = profileById.get(m.user_a);
                const b = profileById.get(m.user_b);
                return (
                  <Animated.View key={m.id} entering={M.fadeDown(i * 30)}>
                    <View style={styles.matchRow}>
                      <View style={styles.matchAvatars}>
                        <Avatar
                          uri={a?.photos?.[0] ?? a?.avatar_url}
                          name={a?.display_name ?? "?"}
                          size={40}
                        />
                        <View style={{ marginLeft: -12 }}>
                          <Avatar
                            uri={b?.photos?.[0] ?? b?.avatar_url}
                            name={b?.display_name ?? "?"}
                            size={40}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.matchNames} numberOfLines={1}>
                          {a?.display_name ?? "?"} & {b?.display_name ?? "?"}
                        </Text>
                        <Text style={styles.matchMeta}>
                          {m.compatibility}% · paired{" "}
                          {dayjs(m.created_at).format("D MMM")}
                        </Text>
                      </View>
                      <PressableScale
                        to={0.85}
                        onPress={() => unmatch(m)}
                        style={styles.matchTrash}
                      >
                        <Trash2 size={16} color={T.terracottaA(0.85)} strokeWidth={2} />
                      </PressableScale>
                    </View>
                  </Animated.View>
                );
              })
            ))}
        </ScrollView>
      )}

      {/* floating pair bar */}
      {tab === "members" && selected.length > 0 && (
        <Animated.View
          entering={M.fadeUp()}
          style={[styles.pairBar, { paddingBottom: insets.bottom + 14 }]}
        >
          <View style={styles.pairRow}>
            {selectedProfiles.map((p) => (
              <View key={p.id} style={styles.pairChip}>
                <Avatar
                  uri={p.photos?.[0] ?? p.avatar_url}
                  name={p.display_name}
                  size={26}
                  ring={false}
                />
                <Text style={styles.pairChipText} numberOfLines={1}>
                  {p.display_name.split(" ")[0]}
                </Text>
              </View>
            ))}
            {selected.length === 1 && (
              <Text style={styles.pairHint}>select one more…</Text>
            )}
          </View>

          {selected.length === 2 && (
            <>
              <View style={styles.compatRow}>
                <Text style={styles.compatLabel}>Compatibility</Text>
                <View style={styles.stepper}>
                  <PressableScale
                    to={0.85}
                    style={styles.stepBtn}
                    onPress={() => setCompat((c) => Math.max(50, c - 1))}
                  >
                    <Minus size={15} color={T.colors.forest} strokeWidth={2.4} />
                  </PressableScale>
                  <Text style={styles.stepValue}>{compat}%</Text>
                  <PressableScale
                    to={0.85}
                    style={styles.stepBtn}
                    onPress={() => setCompat((c) => Math.min(99, c + 1))}
                  >
                    <Plus size={15} color={T.colors.forest} strokeWidth={2.4} />
                  </PressableScale>
                </View>
              </View>

              <PressableScale
                style={[styles.createBtn, pairAlreadyMatched && { opacity: 0.4 }]}
                onPress={pairAlreadyMatched ? undefined : () => void createMatch()}
              >
                {creating ? (
                  <ActivityIndicator color={T.colors.white} />
                ) : (
                  <>
                    <HeartHandshake size={17} color={T.colors.white} strokeWidth={2} />
                    <Text style={styles.createText}>
                      {pairAlreadyMatched ? "Already matched" : "Create match"}
                    </Text>
                  </>
                )}
              </PressableScale>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/* ── members ─────────────────────────────────────────────────────────── */

function MemberCard({
  profile,
  index,
  selected,
  isMe,
  quiz,
  onToggle,
}: {
  profile: Profile;
  index: number;
  selected: boolean;
  isMe: boolean;
  quiz: QuizRow | null;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Animated.View entering={M.fadeDown(Math.min(index, 8) * 30)} layout={M.layout}>
      <PressableScale
        to={0.985}
        onPress={onToggle}
        style={[styles.member, selected && styles.memberSelected]}
      >
        <View>
          <Avatar
            uri={profile.photos?.[0] ?? profile.avatar_url}
            name={profile.display_name}
            size={46}
          />
          {selected && (
            <View style={styles.selectedTick}>
              <Check size={11} color={T.colors.white} strokeWidth={3} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName} numberOfLines={1}>
            {profile.display_name}
            {isMe ? "  (you)" : ""}
          </Text>
          <Text style={styles.memberMeta} numberOfLines={1}>
            {profile.email}
          </Text>
          <View style={styles.memberChips}>
            {profile.telegram ? (
              <View style={[styles.chip, quiz && { backgroundColor: T.sageA(0.15) }]}>
                <Text
                  style={[styles.chipText, quiz ? { color: T.colors.sage } : undefined]}
                >
                  {profile.telegram}
                  {quiz ? " · quiz linked" : " · no quiz"}
                </Text>
              </View>
            ) : (
              <View style={styles.chip}>
                <Text style={styles.chipText}>no telegram set</Text>
              </View>
            )}
          </View>
        </View>
        {quiz && (
          <PressableScale
            to={0.85}
            haptic={false}
            onPress={() => setOpen((o) => !o)}
            style={styles.expandBtn}
          >
            <ChevronDown
              size={17}
              color={T.forestA(0.55)}
              strokeWidth={2.2}
              style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
            />
          </PressableScale>
        )}
      </PressableScale>
      {open && quiz && (
        <Animated.View entering={M.fadeDown()} style={styles.quizInline}>
          <QuizAnswers row={quiz} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/* ── quiz ────────────────────────────────────────────────────────────── */

function statusTone(status: string | null): { bg: string; fg: string } {
  switch (status) {
    case "qualified":
      return { bg: T.sageA(0.16), fg: T.colors.sage };
    case "casual":
      return { bg: T.colors.stone, fg: T.forestA(0.55) };
    default:
      return { bg: T.terracottaA(0.12), fg: T.colors.terracotta };
  }
}

function QuizCard({ row, index }: { row: QuizRow; index: number }) {
  const [open, setOpen] = useState(false);
  const tone = statusTone(row.status);

  return (
    <Animated.View entering={M.fadeDown(Math.min(index, 8) * 30)} layout={M.layout}>
      <PressableScale to={0.985} onPress={() => setOpen((o) => !o)} style={styles.member}>
        <View style={[styles.statusDot, { backgroundColor: tone.fg }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName} numberOfLines={1}>
            {row.telegram ?? "no telegram"}
            {row.age ? ` · ${row.age}` : ""}
          </Text>
          <Text style={styles.memberMeta} numberOfLines={1}>
            {nice(row.gender_pref)} · {dayjs(row.created_at).format("D MMM, h:mma")}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.chipText, { color: tone.fg }]}>
            {row.status ?? "—"}
          </Text>
        </View>
        <ChevronDown
          size={17}
          color={T.forestA(0.55)}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </PressableScale>
      {open && (
        <Animated.View entering={M.fadeDown()} style={styles.quizInline}>
          <QuizAnswers row={row} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function ageGapLabel(row: QuizRow): string {
  const parts: string[] = [];
  if (row.accepts_younger)
    parts.push(`up to ${row.max_years_younger ?? "?"}y younger`);
  if (row.accepts_older) parts.push(`up to ${row.max_years_older ?? "?"}y older`);
  return parts.length ? parts.join(" · ") : "Same age only";
}

function QuizAnswers({ row }: { row: QuizRow }) {
  const basics: [string, string][] = [
    ["Age", row.age != null ? String(row.age) : "—"],
    ["Age gap", ageGapLabel(row)],
    ["Looking to meet", nice(row.gender_pref)],
    ["Free that Saturday", row.available_saturday == null ? "—" : row.available_saturday ? "Yes" : "No"],
    ["Looking for", nice(row.looking_for)],
    ["Values most", nice(row.top_value)],
    ["Group energy", nice(row.energy_level)],
    ["Board games", nice(row.competitiveness)],
    ["Dealbreaker", row.dealbreaker ?? "—"],
  ];
  const matchQs = row.match_answers ? Object.entries(row.match_answers) : [];

  return (
    <View>
      {basics.map(([label, value]) => (
        <View key={label} style={styles.answerRow}>
          <Text style={styles.answerLabel}>{label}</Text>
          <Text style={styles.answerValue}>{value}</Text>
        </View>
      ))}
      {matchQs.length > 0 && (
        <>
          <Text style={styles.matchQsLabel}>Compatibility questions</Text>
          {matchQs.map(([question, a]) => (
            <View key={question} style={styles.matchQ}>
              <Text style={styles.matchQText}>{question}</Text>
              <Text style={styles.matchQAnswer}>
                <Text style={{ color: T.colors.sage }}>They said: </Text>
                {a.self}
              </Text>
              <Text style={styles.matchQAnswer}>
                <Text style={{ color: T.colors.terracotta }}>Accepts: </Text>
                {a.accept.join(" · ")}
              </Text>
              <Text style={styles.matchQAnswer}>
                <Text style={{ color: T.forestA(0.5) }}>Importance: </Text>
                {a.weight || "—"}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/* ── styles ──────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: T.fonts.serif,
    fontSize: 26,
    color: T.colors.forest,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.5),
  },
  seg: {
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.full,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    height: 36,
    borderRadius: T.radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: {
    backgroundColor: T.colors.forest,
  },
  segText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13,
    color: T.forestA(0.55),
  },
  segTextActive: { color: T.colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: T.colors.card,
    borderWidth: 1.5,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 9,
  },
  memberSelected: {
    borderColor: T.colors.terracotta,
    backgroundColor: T.terracottaA(0.05),
  },
  selectedTick: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.colors.terracotta,
    borderWidth: 2,
    borderColor: T.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  memberName: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.forest,
  },
  memberMeta: {
    marginTop: 1,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    color: T.forestA(0.5),
  },
  memberChips: {
    flexDirection: "row",
    gap: 6,
    marginTop: 5,
  },
  chip: {
    backgroundColor: T.colors.cardClay,
    borderRadius: T.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 10.5,
    color: T.forestA(0.55),
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  quizInline: {
    marginTop: -4,
    marginBottom: 10,
    marginHorizontal: 6,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: T.colors.stone,
    borderBottomLeftRadius: T.radii.lg,
    borderBottomRightRadius: T.radii.lg,
    padding: 14,
    paddingTop: 16,
  },
  answerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4.5,
  },
  answerLabel: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    color: T.forestA(0.5),
  },
  answerValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    color: T.colors.forest,
  },
  matchQsLabel: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.sage,
    marginTop: 12,
    marginBottom: 4,
  },
  matchQ: {
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    padding: 11,
    marginTop: 7,
  },
  matchQText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.colors.forest,
  },
  matchQAnswer: {
    marginTop: 5,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: T.forestA(0.75),
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 9,
  },
  matchAvatars: { flexDirection: "row" },
  matchNames: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14.5,
    color: T.colors.forest,
  },
  matchMeta: {
    marginTop: 2,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    color: T.forestA(0.5),
  },
  matchTrash: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.terracottaA(0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: T.fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: T.forestA(0.45),
  },
  pairBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: T.colors.background,
    borderTopWidth: 1,
    borderTopColor: T.colors.stone,
    paddingHorizontal: 18,
    paddingTop: 14,
    ...T.shadow.large,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pairChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.full,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 4,
  },
  pairChipText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13,
    color: T.colors.forest,
    maxWidth: 90,
  },
  pairHint: {
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.45),
  },
  compatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  compatLabel: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 13.5,
    color: T.forestA(0.65),
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 46,
    textAlign: "center",
    fontFamily: T.fonts.sansBold,
    fontSize: 16,
    color: T.colors.forest,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.terracotta,
    ...T.shadow.medium,
  },
  createText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.white,
  },
});
