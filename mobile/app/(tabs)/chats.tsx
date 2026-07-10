import { useRouter } from "expo-router";
import { Check, CheckCheck, Dices } from "lucide-react-native";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { useChats, useOnlineUsers, type ChatPreview } from "@/lib/chat";
import { listTime } from "@/lib/format";
import { T } from "@/lib/theme";

function Preview({ chat, myId }: { chat: ChatPreview; myId: string }) {
  const m = chat.lastMessage;
  if (!m) {
    return (
      <Text style={styles.previewNew} numberOfLines={1}>
        Say hi — you two are matched ✨
      </Text>
    );
  }
  const mine = m.sender_id === myId;
  const body = m.kind === "event_invite" ? "🎲 Suggested a game night" : m.content;
  return (
    <View style={styles.previewRow}>
      {mine &&
        (m.read_at ? (
          <CheckCheck size={14} color={T.colors.terracotta} strokeWidth={2.2} />
        ) : (
          <Check size={14} color={T.forestA(0.4)} strokeWidth={2.2} />
        ))}
      <Text
        style={[styles.preview, chat.unread > 0 && styles.previewUnread]}
        numberOfLines={1}
      >
        {mine ? `You: ${body}` : body}
      </Text>
    </View>
  );
}

export default function Chats() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const { chats, loading } = useChats(myId);
  const online = useOnlineUsers(myId);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 18 }]}>
      <Animated.View entering={M.fadeDown()} style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>
          {chats.length > 0
            ? `${chats.length} ${chats.length === 1 ? "match" : "matches"}`
            : "Your matches, one table away"}
        </Text>
      </Animated.View>

      <FlatList
        data={chats}
        keyExtractor={(c) => c.match.id}
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={M.fadeDown(30 + index * 30)}>
            <PressableScale
              to={0.98}
              style={styles.row}
              onPress={() => router.push(`/chat/${item.match.id}`)}
            >
              <Avatar
                uri={item.match.partner.avatar_url}
                name={item.match.partner.display_name}
                size={54}
                online={online.has(item.match.partner.id)}
              />
              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.match.partner.display_name}
                </Text>
                {myId && <Preview chat={item} myId={myId} />}
              </View>
              <View style={styles.rowMeta}>
                {item.lastMessage && (
                  <Text
                    style={[
                      styles.time,
                      item.unread > 0 && { color: T.colors.terracotta },
                    ]}
                  >
                    {listTime(item.lastMessage.created_at)}
                  </Text>
                )}
                {item.unread > 0 && (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={<Dices size={30} color={T.colors.sage} strokeWidth={1.6} />}
                title="No matches yet"
                body={
                  "We pair people by hand every Thursday from the quiz. Your Player 2 will appear right here."
                }
              />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: T.fonts.serif,
    fontSize: 30,
    color: T.colors.forest,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    color: T.forestA(0.5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  rowBody: { flex: 1 },
  name: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 16.5,
    color: T.colors.forest,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    color: T.forestA(0.5),
  },
  previewUnread: {
    fontFamily: T.fonts.sansSemiBold,
    color: T.forestA(0.8),
  },
  previewNew: {
    marginTop: 2,
    fontFamily: T.fonts.sansMedium,
    fontSize: 13.5,
    color: T.colors.terracotta,
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  time: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.forestA(0.4),
  },
  unreadPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 11,
    color: T.colors.white,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
  },
});
