import dayjs from "dayjs";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowUp, ChevronLeft, Dices, Sparkles } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingBubble } from "@/components/chat/typing-dots";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { useChatRoom, useMatch, useOnlineUsers } from "@/lib/chat";
import { dayLabel, lastSeen } from "@/lib/format";
import { T } from "@/lib/theme";
import type { Message } from "@/lib/types";

const GROUP_GAP_MIN = 10;

function DaySeparator({ iso }: { iso: string }) {
  return (
    <View style={styles.dayWrap}>
      <View style={styles.dayPill}>
        <Text style={styles.dayText}>{dayLabel(iso)}</Text>
      </View>
    </View>
  );
}

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myId = session?.user.id ?? "";

  const match = useMatch(id, myId || undefined);
  const online = useOnlineUsers(myId || undefined);
  const {
    messages,
    loading,
    hasMore,
    partnerTyping,
    send,
    sendTyping,
    loadOlder,
  } = useChatRoom(id, myId);

  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0;

  const onSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void send(text).catch(() => {});
  }, [draft, send]);

  const partnerOnline = match ? online.has(match.partner.id) : false;
  const subtitle = useMemo(() => {
    if (!match) return "";
    if (partnerTyping) return "typing…";
    if (partnerOnline) return "Online now";
    return (
      lastSeen(match.partner.last_seen_at) ??
      `Matched ${dayjs(match.created_at).format("D MMM")}`
    );
  }, [match, partnerOnline, partnerTyping]);

  if (!session) return <Redirect href="/sign-in" />;

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const newer = messages[index - 1]; // visually below (inverted list)
    const older = messages[index + 1]; // visually above

    const lastOfGroup =
      !newer ||
      newer.sender_id !== item.sender_id ||
      dayjs(newer.created_at).diff(item.created_at, "minute") > GROUP_GAP_MIN;

    const isDayBoundary =
      (!older && !hasMore) ||
      (older && !dayjs(older.created_at).isSame(item.created_at, "day"));

    return (
      <View>
        {isDayBoundary ? <DaySeparator iso={item.created_at} /> : null}
        <MessageBubble msg={item} mine={item.sender_id === myId} lastOfGroup={lastOfGroup} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <PressableScale to={0.9} onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={T.colors.forest} strokeWidth={2} />
        </PressableScale>
        {match ? (
          <>
            {/* tap the person → their profile (photo wall) */}
            <PressableScale
              to={0.97}
              haptic={false}
              onPress={() => router.push(`/person/${match.partner.id}`)}
              style={styles.headerPerson}
            >
              <Avatar
                uri={match.partner.photos?.[0] ?? match.partner.avatar_url}
                name={match.partner.display_name}
                size={40}
                online={partnerOnline}
              />
              <View style={styles.headerBody}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {match.partner.display_name}
                </Text>
                <Text
                  style={[
                    styles.headerSub,
                    (partnerOnline || partnerTyping) && { color: T.colors.sage },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              </View>
            </PressableScale>
            <View style={styles.compatPill}>
              <Sparkles size={12} color={T.colors.terracotta} strokeWidth={2.2} />
              <Text style={styles.compatText}>{match.compatibility}%</Text>
            </View>
            {/* minigames for this chat */}
            <PressableScale
              to={0.88}
              onPress={() =>
                router.push(
                  `/games/${id}?partner=${match.partner.id}&name=${encodeURIComponent(
                    match.partner.display_name.split(" ")[0]
                  )}`
                )
              }
              style={styles.gamesBtn}
            >
              <Dices size={18} color={T.colors.white} strokeWidth={2} />
            </PressableScale>
          </>
        ) : (
          <View style={styles.headerBody} />
        )}
      </View>

      {/* ── thread ── */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={T.colors.sage} />
        </View>
      ) : (
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.3}
          onEndReached={() => void loadOlder()}
          keyboardDismissMode="interactive"
          ListHeaderComponent={
            partnerTyping ? (
              <Animated.View entering={M.fadeIn()}>
                <TypingBubble />
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyThread}>
              {/* inverted list → flip the empty state back upright */}
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <Text style={styles.emptyTitle}>You two are matched ✨</Text>
                <Text style={styles.emptyBody}>
                  Break the ice — worst case, you settle it over a board game.
                </Text>
              </View>
            </View>
          }
        />
      )}

      {/* ── composer ── */}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (t.length) sendTyping();
            }}
            placeholder="Message…"
            placeholderTextColor={T.forestA(0.35)}
            multiline
            maxLength={1000}
          />
          {canSend && (
            <Animated.View entering={M.zoomIn}>
              <PressableScale to={0.88} onPress={onSend} style={styles.sendBtn}>
                <ArrowUp size={18} color={T.colors.white} strokeWidth={2.4} />
              </PressableScale>
            </Animated.View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: T.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.stone,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPerson: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBody: { flex: 1 },
  headerName: {
    fontFamily: T.fonts.serif,
    fontSize: 19,
    color: T.colors.forest,
  },
  headerSub: {
    marginTop: 1,
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.forestA(0.45),
  },
  compatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.terracottaA(0.1),
    borderRadius: T.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compatText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 12,
    color: T.colors.terracotta,
  },
  gamesBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.colors.sage,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.soft,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  thread: {
    paddingVertical: 12,
  },
  emptyThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 21,
    color: T.colors.forest,
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 8,
    fontFamily: T.fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: T.forestA(0.5),
    textAlign: "center",
  },
  dayWrap: {
    alignItems: "center",
    marginVertical: 12,
  },
  dayPill: {
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 11.5,
    color: T.forestA(0.5),
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: T.colors.background,
    borderTopWidth: 1,
    borderTopColor: T.colors.stone,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: 26,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    fontFamily: T.fonts.sans,
    fontSize: 15.5,
    color: T.colors.forest,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
});
