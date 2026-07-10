import * as Haptics from "expo-haptics";
import { CalendarDays, Dices, MapPin, Plus } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CreateEventSheet,
  type EventDraft,
} from "@/components/map/create-event-sheet";
import { EventSheet } from "@/components/map/event-sheet";
import { IS_EXPO_GO, MapView, Marker, PROVIDER_GOOGLE, type Region } from "@/components/maps";
import { PressableScale } from "@/components/ui/pressable-scale";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { useMyMatches } from "@/lib/chat";
import { createEvent, useEvents } from "@/lib/events";
import { eventWhen } from "@/lib/format";
import { BOTANICAL_MAP_STYLE } from "@/lib/map-style";
import { T, eyebrow } from "@/lib/theme";
import type { EventRow } from "@/lib/types";

/** Purvis Street / Bras Basah — where the pilot night lives. */
const INITIAL_REGION: Region = {
  latitude: 1.2966,
  longitude: 103.8547,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

/** A clay-terracotta arch pin with a dice face — the night, pressed onto the map. */
function EventPin() {
  return (
    <View style={styles.pinWrap}>
      <View style={styles.pin}>
        <Dices size={19} color={T.colors.white} strokeWidth={1.9} />
      </View>
      <View style={styles.pinTail} />
    </View>
  );
}

export default function EventsMap() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const myId = session?.user.id ?? "";
  const admin = isAdminEmail(session?.user.email);

  const { events } = useEvents();
  const matches = useMyMatches(myId || undefined);

  const mapRef = useRef<any>(null);
  const regionRef = useRef<Region>(INITIAL_REGION);

  const [selected, setSelected] = useState<EventRow | null>(null);
  const [composing, setComposing] = useState(false);
  const [placing, setPlacing] = useState<EventDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const openEvent = (e: EventRow) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelected(e);
    mapRef.current?.animateToRegion(
      { latitude: e.lat, longitude: e.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      350
    );
  };

  const confirmPlacement = async () => {
    if (!placing) return;
    setSaving(true);
    try {
      const { latitude, longitude } = regionRef.current;
      const created = await createEvent({
        title: placing.title,
        description: placing.description,
        venue: placing.venue,
        lat: latitude,
        lng: longitude,
        starts_at: placing.date.toISOString(),
        created_by: myId,
      });
      setPlacing(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      setSelected(created);
    } catch (e) {
      Alert.alert(
        "Couldn't create the event",
        e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        customMapStyle={BOTANICAL_MAP_STYLE}
        showsCompass={false}
        showsPointsOfInterest={false}
        onRegionChangeComplete={(r: Region) => {
          regionRef.current = r;
        }}
      >
        {events.map((e) => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.lat, longitude: e.lng }}
            onPress={() => openEvent(e)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <EventPin />
          </Marker>
        ))}
      </MapView>

      {/* ── floating header ── */}
      <Animated.View
        entering={M.fadeDown()}
        style={[styles.headerCard, { top: insets.top + 10 }]}
      >
        <Text style={styles.headerEyebrow}>Game nights</Text>
        <Text style={styles.headerTitle}>
          {events.length > 0
            ? `${events.length} ${events.length === 1 ? "night" : "nights"} on the map`
            : "Nights land here soon"}
        </Text>
      </Animated.View>

      {/* Expo Go: the native map is stubbed → surface events as tappable cards */}
      {IS_EXPO_GO && (
        <View style={[styles.goList, { top: insets.top + 86 }]} pointerEvents="box-none">
          <Text style={styles.goNote}>
            Live map needs the dev build — tap a night below.
          </Text>
          {events.map((e, i) => (
            <Animated.View
              key={e.id}
              entering={M.fadeDown(50 + i * 45)}
            >
              <PressableScale to={0.97} style={styles.goCard} onPress={() => openEvent(e)}>
                <View style={styles.goIcon}>
                  <Dices size={18} color={T.colors.white} strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <View style={styles.goMetaRow}>
                    <CalendarDays size={12} color={T.colors.sage} strokeWidth={2} />
                    <Text style={styles.goMeta} numberOfLines={1}>
                      {eventWhen(e.starts_at)}
                    </Text>
                  </View>
                  <View style={styles.goMetaRow}>
                    <MapPin size={12} color={T.colors.sage} strokeWidth={2} />
                    <Text style={styles.goMeta} numberOfLines={1}>
                      {e.venue}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </View>
      )}

      {/* ── crosshair placement mode ── */}
      {placing && (
        <>
          <View pointerEvents="none" style={styles.crosshairWrap}>
            <View style={styles.crosshairPinOffset}>
              <EventPin />
            </View>
          </View>
          <Animated.View
            entering={M.fadeDown()}
            style={[styles.placeHint, { top: insets.top + 84 }]}
          >
            <Text style={styles.placeHintText}>
              Drag the map — the pin drops at the centre
            </Text>
          </Animated.View>
          <Animated.View
            entering={M.fadeUp()}
            style={[styles.placeBar, { bottom: Math.max(insets.bottom, 12) + 84 }]}
          >
            <PressableScale
              style={styles.placeCancel}
              onPress={saving ? undefined : () => setPlacing(null)}
            >
              <Text style={styles.placeCancelText}>Cancel</Text>
            </PressableScale>
            <PressableScale
              style={styles.placeConfirm}
              onPress={saving ? undefined : () => void confirmPlacement()}
            >
              <Text style={styles.placeConfirmText}>
                {saving ? "Dropping…" : "Drop pin here"}
              </Text>
            </PressableScale>
          </Animated.View>
        </>
      )}

      {/* ── admin FAB ── */}
      {admin && !placing && !composing && !selected && (
        <Animated.View
          entering={M.fadeUp(100)}
          style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 12) + 84 }]}
        >
          <PressableScale to={0.9} style={styles.fab} onPress={() => setComposing(true)}>
            <Plus size={24} color={T.colors.white} strokeWidth={2.2} />
          </PressableScale>
        </Animated.View>
      )}

      {/* ── sheets ── */}
      {selected && (
        <EventSheet
          event={selected}
          myId={myId}
          matches={matches}
          onClose={() => setSelected(null)}
        />
      )}
      {composing && (
        <CreateEventSheet
          busy={saving}
          onClose={() => setComposing(false)}
          onPlace={(draft) => {
            setComposing(false);
            setPlacing(draft);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.background },
  headerCard: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: T.whiteA(0.94),
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 11,
    ...T.shadow.medium,
  },
  headerEyebrow: {
    ...eyebrow,
    fontSize: 10,
    color: T.colors.terracotta,
  },
  headerTitle: {
    marginTop: 2,
    fontFamily: T.fonts.serif,
    fontSize: 19,
    color: T.colors.forest,
  },
  pinWrap: { alignItems: "center" },
  pin: {
    width: 42,
    height: 42,
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: T.colors.terracotta,
    borderWidth: 2.5,
    borderColor: T.colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.medium,
  },
  pinTail: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: T.colors.terracotta,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: T.colors.white,
    transform: [{ rotate: "45deg" }],
  },
  goList: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 10,
  },
  goNote: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12,
    color: T.forestA(0.5),
    textAlign: "center",
    marginBottom: 2,
  },
  goCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    padding: 13,
    ...T.shadow.soft,
  },
  goIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },
  goTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 17,
    color: T.colors.forest,
  },
  goMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  goMeta: {
    flex: 1,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.55),
  },
  crosshairWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairPinOffset: {
    // anchor the pin's tip to the exact map centre
    marginTop: -52,
  },
  placeHint: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: T.colors.forest,
    borderRadius: T.radii.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
    ...T.shadow.medium,
  },
  placeHintText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 12.5,
    color: T.colors.white,
  },
  placeBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  placeCancel: {
    paddingHorizontal: 20,
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.soft,
  },
  placeCancelText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15,
    color: T.forestA(0.6),
  },
  placeConfirm: {
    flex: 1,
    height: 52,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.medium,
  },
  placeConfirmText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 15.5,
    color: T.colors.white,
  },
  fabWrap: {
    position: "absolute",
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    ...T.shadow.large,
  },
});
