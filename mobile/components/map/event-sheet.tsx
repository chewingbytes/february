import * as Haptics from "expo-haptics";
import { CalendarDays, Check, MapPin, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  reSuggestEventJoin,
  respondToEventJoin,
  suggestEvent,
  useEventJoins,
} from "@/lib/events";
import { eventWhen } from "@/lib/format";
import { T, eyebrow } from "@/lib/theme";
import type { EventRow, MatchWithPartner } from "@/lib/types";

/**
 * Bottom sheet for a tapped event pin. Shows the night's details and drives
 * the both-agree join flow: one half of a match suggests, the other accepts
 * in chat (or right here) — only then is the pair in.
 */
export function EventSheet({
  event,
  myId,
  matches,
  onClose,
}: {
  event: EventRow;
  myId: string;
  matches: MatchWithPartner[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { joins } = useEventJoins(event.id);
  const [matchIdx, setMatchIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const match = matches[matchIdx] ?? null;
  const join = match ? joins.find((j) => j.match_id === match.id) ?? null : null;
  const pairsIn = joins.filter((j) => j.status === "accepted").length;

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {}
      );
    } finally {
      setBusy(false);
    }
  };

  const renderJoinArea = () => {
    if (!match) {
      return (
        <Text style={styles.noMatchNote}>
          Nights are joined as a pair — once you're matched, you can suggest this
          one to your Player 2.
        </Text>
      );
    }

    if (!join) {
      return (
        <PressableScale
          style={styles.cta}
          onPress={
            busy
              ? undefined
              : () =>
                  void act(() =>
                    suggestEvent({
                      eventId: event.id,
                      matchId: match.id,
                      myId,
                      eventTitle: event.title,
                    })
                  )
          }
        >
          {busy ? (
            <ActivityIndicator color={T.colors.white} />
          ) : (
            <Text style={styles.ctaText}>
              Suggest to {match.partner.display_name.split(" ")[0]}
            </Text>
          )}
        </PressableScale>
      );
    }

    if (join.status === "accepted") {
      return (
        <View style={[styles.statusCard, { backgroundColor: T.sageA(0.14) }]}>
          <Check size={16} color={T.colors.sage} strokeWidth={2.4} />
          <Text style={[styles.statusText, { color: T.colors.sage }]}>
            You and {match.partner.display_name.split(" ")[0]} are in 🎉
          </Text>
        </View>
      );
    }

    if (join.status === "declined") {
      return (
        <PressableScale
          style={[styles.cta, { backgroundColor: T.colors.sage }]}
          onPress={
            busy
              ? undefined
              : () =>
                  void act(() =>
                    reSuggestEventJoin({
                      joinId: join.id,
                      matchId: match.id,
                      myId,
                      eventId: event.id,
                      eventTitle: event.title,
                    })
                  )
          }
        >
          <Text style={styles.ctaText}>Suggest again</Text>
        </PressableScale>
      );
    }

    // pending
    if (join.requested_by === myId) {
      return (
        <View style={[styles.statusCard, { backgroundColor: T.terracottaA(0.1) }]}>
          <Text style={[styles.statusText, { color: T.colors.terracotta }]}>
            Waiting for {match.partner.display_name.split(" ")[0]} to say yes…
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.acceptRow}>
        <PressableScale
          style={[styles.cta, { flex: 1 }]}
          onPress={busy ? undefined : () => void act(() => respondToEventJoin(join.id, true))}
        >
          <Text style={styles.ctaText}>
            Join with {match.partner.display_name.split(" ")[0]}
          </Text>
        </PressableScale>
        <PressableScale
          style={styles.pass}
          onPress={busy ? undefined : () => void act(() => respondToEventJoin(join.id, false))}
        >
          <Text style={styles.passText}>Pass</Text>
        </PressableScale>
      </View>
    );
  };

  return (
    <>
      <Animated.View entering={M.fadeIn()} exiting={M.fadeOut} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={M.sheetIn}
        exiting={M.sheetOut}
        style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}
      >
        <View style={styles.grabber} />
        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
          <X size={18} color={T.forestA(0.55)} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.eyebrow}>Hosted game night</Text>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <CalendarDays size={15} color={T.colors.sage} strokeWidth={1.9} />
          </View>
          <Text style={styles.metaText}>{eventWhen(event.starts_at)}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <MapPin size={15} color={T.colors.sage} strokeWidth={1.9} />
          </View>
          <Text style={styles.metaText}>{event.venue}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <Users size={15} color={T.colors.sage} strokeWidth={1.9} />
          </View>
          <Text style={styles.metaText}>
            {pairsIn > 0
              ? `${pairsIn} ${pairsIn === 1 ? "pair is" : "pairs are"} in`
              : "Be the first pair in"}
          </Text>
        </View>

        {!!event.description && <Text style={styles.desc}>{event.description}</Text>}

        {/* choose which match to bring (usually just one) */}
        {matches.length > 1 && (
          <View style={styles.matchPicker}>
            {matches.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() => setMatchIdx(i)}
                style={[styles.matchChip, i === matchIdx && styles.matchChipActive]}
              >
                <Avatar uri={m.partner.avatar_url} name={m.partner.display_name} size={22} ring={false} />
                <Text
                  style={[
                    styles.matchChipText,
                    i === matchIdx && { color: T.colors.forest },
                  ]}
                >
                  {m.partner.display_name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.joinArea}>{renderJoinArea()}</View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 32, 27, 0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: T.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 10,
    ...T.shadow.large,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.colors.stone,
    marginBottom: 16,
  },
  close: {
    position: "absolute",
    top: 18,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  eyebrow: {
    ...eyebrow,
    color: T.colors.terracotta,
  },
  title: {
    marginTop: 6,
    marginBottom: 14,
    fontFamily: T.fonts.serif,
    fontSize: 26,
    lineHeight: 31,
    color: T.colors.forest,
    paddingRight: 34,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.sageA(0.13),
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    flex: 1,
    fontFamily: T.fonts.sansMedium,
    fontSize: 14,
    color: T.forestA(0.75),
  },
  desc: {
    marginTop: 8,
    fontFamily: T.fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: T.forestA(0.6),
  },
  matchPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  matchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.colors.stone,
    backgroundColor: T.colors.card,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 4,
  },
  matchChipActive: {
    borderColor: T.colors.sage,
    backgroundColor: T.sageA(0.12),
  },
  matchChipText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 13,
    color: T.forestA(0.55),
  },
  joinArea: {
    marginTop: 16,
  },
  cta: {
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.medium,
  },
  ctaText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15.5,
    color: T.colors.white,
  },
  acceptRow: {
    flexDirection: "row",
    gap: 10,
  },
  pass: {
    paddingHorizontal: 20,
    height: 52,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  passText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.forestA(0.6),
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: T.radii.full,
  },
  statusText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14.5,
  },
  noMatchNote: {
    fontFamily: T.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: T.forestA(0.5),
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
