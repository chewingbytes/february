import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { PressableScale } from "@/components/ui/pressable-scale";
import { deleteGame, GAME_KINDS, updateGame, useMyGames } from "@/lib/games";
import { M } from "@/lib/motion";
import { T } from "@/lib/theme";
import type { Game } from "@/lib/types";

/**
 * "Your games" — the games this user curates for their matches to play from
 * the chat. Toggle visibility, tap through to edit, or add a new one.
 */
export function MyGames({ userId }: { userId: string }) {
  const router = useRouter();
  const { games, loading, reload } = useMyGames(userId);

  // Refresh when returning from the create/edit modal.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const toggle = async (game: Game, next: boolean) => {
    try {
      await updateGame(game.id, { is_active: next });
    } finally {
      void reload();
    }
  };

  const confirmDelete = (game: Game) => {
    Alert.alert(`Delete “${game.title}”?`, "Past results stay in your chats.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteGame(game.id).then(reload),
      },
    ]);
  };

  return (
    <View>
      {games.map((game, i) => {
        const kind = GAME_KINDS[game.kind];
        return (
          <Animated.View key={game.id} layout={M.layout} entering={M.fadeDown(i * 40)}>
            <PressableScale
              to={0.98}
              onPress={() => router.push(`/games/create?id=${game.id}`)}
              style={styles.card}
            >
              <View style={styles.emojiRing}>
                <Text style={styles.emoji}>{kind.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {game.title}
                </Text>
                <Text style={styles.sub}>
                  {kind.title} · {game.items.length}{" "}
                  {game.items.length === 1 ? "prompt" : "prompts"} ·{" "}
                  {game.is_active ? "Live" : "Hidden"}
                </Text>
              </View>
              <Switch
                value={game.is_active}
                onValueChange={(v) => void toggle(game, v)}
                trackColor={{ false: T.colors.stone, true: T.sageA(0.45) }}
                thumbColor={game.is_active ? T.colors.sage : T.colors.card}
                ios_backgroundColor={T.colors.stone}
              />
              <PressableScale
                to={0.85}
                onPress={() => confirmDelete(game)}
                style={styles.trash}
                haptic={false}
              >
                <Trash2 size={15} color={T.terracottaA(0.8)} strokeWidth={2} />
              </PressableScale>
            </PressableScale>
          </Animated.View>
        );
      })}

      {!loading && games.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎲</Text>
          <Text style={styles.emptyText}>
            Set up a little game — your matches play it from your chat and the
            result lands in the thread.
          </Text>
        </View>
      )}

      <PressableScale
        to={0.98}
        onPress={() => router.push("/games/create")}
        style={styles.addBtn}
      >
        <Plus size={16} color={T.colors.white} strokeWidth={2.4} />
        <Text style={styles.addText}>New game</Text>
        <ChevronRight size={15} color={T.whiteA(0.7)} strokeWidth={2.2} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 9,
  },
  emojiRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 18 },
  title: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.colors.forest,
  },
  sub: {
    marginTop: 2,
    fontFamily: T.fonts.sans,
    fontSize: 12,
    color: T.forestA(0.5),
  },
  trash: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.colors.cardClay,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    padding: 14,
    marginBottom: 9,
  },
  emptyEmoji: { fontSize: 24 },
  emptyText: {
    flex: 1,
    fontFamily: T.fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: T.forestA(0.55),
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 48,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.sage,
    marginTop: 3,
  },
  addText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14.5,
    color: T.colors.white,
  },
});
