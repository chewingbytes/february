import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { CalendarDays, Clock, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "@/components/ui/pressable-scale";
import { eventWhen } from "@/lib/format";
import { T, eyebrow } from "@/lib/theme";
import dayjs from "dayjs";

export type EventDraft = {
  title: string;
  venue: string;
  description: string;
  date: Date;
};

/**
 * Admin-only event composer (RLS enforces the email allow-list server-side).
 * Collects the details here; the pin position is picked afterwards by moving
 * the map under a fixed crosshair ("Place on the map").
 */
export function CreateEventSheet({
  busy,
  onClose,
  onPlace,
}: {
  busy: boolean;
  onClose: () => void;
  /** Hand the draft back to the map screen → crosshair placement mode. */
  onPlace: (draft: EventDraft) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() =>
    dayjs().add(2, "day").hour(19).minute(0).second(0).toDate()
  );
  const [iosPicker, setIosPicker] = useState<"date" | "time" | null>(null);

  const valid = title.trim().length >= 3 && venue.trim().length >= 3;

  const openAndroidPicker = (mode: "date" | "time") => {
    DateTimePickerAndroid.open({
      value: date,
      mode,
      onChange: (_e, d) => {
        if (d) setDate(d);
      },
    });
  };

  const pick = (mode: "date" | "time") => {
    void Haptics.selectionAsync().catch(() => {});
    if (Platform.OS === "android") openAndroidPicker(mode);
    else setIosPicker((p) => (p === mode ? null : mode));
  };

  return (
    <>
      <Animated.View
        entering={M.fadeIn()}
        exiting={M.fadeOut}
        style={styles.backdrop}
      >
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

        <Text style={styles.eyebrow}>Host tools</Text>
        <Text style={styles.title}>New game night</Text>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0 }}
        >
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Pilot Game Night"
            placeholderTextColor={T.forestA(0.3)}
            maxLength={60}
          />

          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="King and the Pawn, 17 Purvis St"
            placeholderTextColor={T.forestA(0.3)}
            maxLength={120}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Four matched pairs, one table, a live host…"
            placeholderTextColor={T.forestA(0.3)}
            multiline
            maxLength={400}
          />

          <Text style={styles.label}>When</Text>
          <View style={styles.whenRow}>
            <Pressable style={styles.whenChip} onPress={() => pick("date")}>
              <CalendarDays size={15} color={T.colors.sage} strokeWidth={2} />
              <Text style={styles.whenText}>{dayjs(date).format("ddd, D MMM")}</Text>
            </Pressable>
            <Pressable style={styles.whenChip} onPress={() => pick("time")}>
              <Clock size={15} color={T.colors.sage} strokeWidth={2} />
              <Text style={styles.whenText}>{dayjs(date).format("h:mm A")}</Text>
            </Pressable>
          </View>

          {Platform.OS === "ios" && iosPicker && (
            <DateTimePicker
              value={date}
              mode={iosPicker}
              display="spinner"
              themeVariant="light"
              minuteInterval={5}
              onChange={(_e, d) => {
                if (d) setDate(d);
              }}
              style={styles.iosPicker}
            />
          )}

          <Text style={styles.preview}>{eventWhen(date.toISOString())}</Text>
        </ScrollView>

        <PressableScale
          style={[styles.cta, !valid && styles.ctaDisabled]}
          onPress={
            !valid || busy
              ? undefined
              : () =>
                  onPlace({
                    title: title.trim(),
                    venue: venue.trim(),
                    description: description.trim(),
                    date,
                  })
          }
        >
          {busy ? (
            <ActivityIndicator color={T.colors.white} />
          ) : (
            <Text style={styles.ctaText}>Place on the map →</Text>
          )}
        </PressableScale>
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
    maxHeight: "86%",
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
    color: T.colors.forest,
  },
  label: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.sage,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: T.fonts.sans,
    fontSize: 15,
    color: T.colors.forest,
  },
  multiline: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  whenRow: {
    flexDirection: "row",
    gap: 10,
  },
  whenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  whenText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14,
    color: T.colors.forest,
  },
  iosPicker: {
    alignSelf: "center",
  },
  preview: {
    marginTop: 10,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.45),
  },
  cta: {
    marginTop: 16,
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.medium,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15.5,
    color: T.colors.white,
  },
});
