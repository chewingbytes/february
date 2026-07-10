import { Check, CheckCheck, Clock3, Dices } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/ui/pressable-scale";
import { respondToEventJoin, useEventJoins } from "@/lib/events";
import { eventWhen, messageTime } from "@/lib/format";
import { supabase, TABLES } from "@/lib/supabase";
import { T, eyebrow } from "@/lib/theme";
import type { EventRow, Message } from "@/lib/types";

/** ✓ sent · ✓✓ read (terracotta) · clock while the optimistic send is in flight. */
function Ticks({ msg }: { msg: Message }) {
  if (msg.pending) return <Clock3 size={12} color={T.whiteA(0.6)} strokeWidth={2.2} />;
  if (msg.read_at) return <CheckCheck size={13} color={T.colors.blush} strokeWidth={2.4} />;
  return <Check size={13} color={T.whiteA(0.65)} strokeWidth={2.4} />;
}

/**
 * An event_invite message: a little ticket card in the thread. The recipient
 * gets Accept / Pass buttons while it's pending; both sides watch the status
 * update live (the join row is realtime).
 */
function EventInviteBubble({ msg, mine }: { msg: Message; mine: boolean }) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const { joins } = useEventJoins(msg.event_id);
  const join = joins.find((j) => j.match_id === msg.match_id) ?? null;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!msg.event_id) return;
    void supabase
      .from(TABLES.events)
      .select("*")
      .eq("id", msg.event_id)
      .maybeSingle()
      .then(({ data }) => setEvent((data as EventRow) ?? null));
  }, [msg.event_id]);

  const respond = async (accept: boolean) => {
    if (!join) return;
    setBusy(true);
    try {
      await respondToEventJoin(join.id, accept);
    } finally {
      setBusy(false);
    }
  };

  const status = join?.status ?? "pending";

  return (
    <View style={[inviteStyles.card, mine ? inviteStyles.mine : inviteStyles.theirs]}>
      <View style={inviteStyles.headerRow}>
        <View style={inviteStyles.iconRing}>
          <Dices size={16} color={T.colors.terracotta} strokeWidth={1.8} />
        </View>
        <Text style={inviteStyles.eyebrow}>Game night invite</Text>
      </View>
      <Text style={inviteStyles.title}>{msg.content}</Text>
      {event && (
        <Text style={inviteStyles.meta}>
          {eventWhen(event.starts_at)} · {event.venue}
        </Text>
      )}

      {status === "accepted" ? (
        <View style={[inviteStyles.statusPill, { backgroundColor: T.sageA(0.16) }]}>
          <Text style={[inviteStyles.statusText, { color: T.colors.sage }]}>
            You're both in 🎉
          </Text>
        </View>
      ) : status === "declined" ? (
        <View style={[inviteStyles.statusPill, { backgroundColor: T.colors.stone }]}>
          <Text style={[inviteStyles.statusText, { color: T.forestA(0.55) }]}>
            Passed on this one
          </Text>
        </View>
      ) : mine ? (
        <View style={[inviteStyles.statusPill, { backgroundColor: T.terracottaA(0.12) }]}>
          <Text style={[inviteStyles.statusText, { color: T.colors.terracotta }]}>
            Waiting for their yes…
          </Text>
        </View>
      ) : (
        <View style={inviteStyles.actions}>
          <PressableScale
            style={inviteStyles.accept}
            onPress={busy ? undefined : () => void respond(true)}
          >
            {busy ? (
              <ActivityIndicator size="small" color={T.colors.white} />
            ) : (
              <Text style={inviteStyles.acceptText}>I'm in</Text>
            )}
          </PressableScale>
          <PressableScale
            style={inviteStyles.decline}
            onPress={busy ? undefined : () => void respond(false)}
          >
            <Text style={inviteStyles.declineText}>Pass</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

export function MessageBubble({
  msg,
  mine,
  lastOfGroup,
}: {
  msg: Message;
  mine: boolean;
  /** Visually the bottom message of a run from one sender → tail + meta row. */
  lastOfGroup: boolean;
}) {
  if (msg.kind === "event_invite") {
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <EventInviteBubble msg={msg} mine={mine} />
      </View>
    );
  }

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          lastOfGroup && (mine ? styles.tailMine : styles.tailTheirs),
        ]}
      >
        <Text style={mine ? styles.textMine : styles.textTheirs}>{msg.content}</Text>
        <View style={styles.metaRow}>
          <Text style={mine ? styles.timeMine : styles.timeTheirs}>
            {messageTime(msg.created_at)}
          </Text>
          {mine && <Ticks msg={msg} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    marginVertical: 1.5,
    flexDirection: "row",
  },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: T.radii.lg,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: T.colors.forest,
  },
  bubbleTheirs: {
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
  },
  tailMine: { borderBottomRightRadius: 6 },
  tailTheirs: { borderBottomLeftRadius: 6 },
  textMine: {
    fontFamily: T.fonts.sans,
    fontSize: 15.5,
    lineHeight: 21,
    color: T.colors.background,
  },
  textTheirs: {
    fontFamily: T.fonts.sans,
    fontSize: 15.5,
    lineHeight: 21,
    color: T.colors.forest,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 3,
  },
  timeMine: {
    fontFamily: T.fonts.sans,
    fontSize: 10.5,
    color: T.whiteA(0.55),
  },
  timeTheirs: {
    fontFamily: T.fonts.sans,
    fontSize: 10.5,
    color: T.forestA(0.4),
  },
});

const inviteStyles = StyleSheet.create({
  card: {
    maxWidth: "82%",
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.xl,
    padding: 14,
    ...T.shadow.soft,
  },
  mine: { borderTopRightRadius: 8 },
  theirs: { borderTopLeftRadius: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.terracottaA(0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.terracotta,
  },
  title: {
    marginTop: 8,
    fontFamily: T.fonts.serif,
    fontSize: 18,
    color: T.colors.forest,
  },
  meta: {
    marginTop: 4,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.55),
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: T.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  accept: {
    flex: 1,
    height: 40,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.colors.white,
  },
  decline: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: T.radii.full,
    borderWidth: 1,
    borderColor: T.colors.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.forestA(0.6),
  },
});
