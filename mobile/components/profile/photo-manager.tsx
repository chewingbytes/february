import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ImagePlus,
  RefreshCcw,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { PressableScale } from "@/components/ui/pressable-scale";
import { M } from "@/lib/motion";
import { deletePhotoByUrl, uploadProfilePhoto } from "@/lib/storage";
import { T } from "@/lib/theme";

export const MAX_PHOTOS = 6;
const GAP = 10;
const H_PADDING = 24; // matches profile.tsx section padding

// expo-image-picker pulls in a native module. Lazy-require it so a binary that
// hasn't been rebuilt since the dependency was added (native side missing)
// still renders the whole profile — you just can't add photos until you
// rebuild — instead of crashing the entire route at import time.
type ImagePickerModule = typeof import("expo-image-picker");
let _picker: ImagePickerModule | null | undefined;
function getPicker(): ImagePickerModule | null {
  if (_picker !== undefined) return _picker;
  try {
    _picker = require("expo-image-picker") as ImagePickerModule;
  } catch {
    _picker = null;
  }
  return _picker;
}

/**
 * The profile photo wall manager: a 3×2 grid in display order. The first
 * slot wears the website's signature arch + a "Main" crown. Tapping a photo
 * opens a botanical action sheet (make main / nudge earlier / later /
 * replace / remove); order changes animate via layout transitions.
 *
 * Files live on the R2-backed storage project (lib/storage.ts); this
 * component uploads/deletes there, then reports the new ordered URL array
 * up via `onChange` — the parent persists it to p2_profiles.photos.
 */
export function PhotoManager({
  photos,
  userId,
  onChange,
}: {
  photos: string[];
  userId: string;
  onChange: (next: string[]) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const tileW = (width - H_PADDING * 2 - GAP * 2) / 3;
  const tileH = tileW * (4 / 3);

  // Which existing photo index a picked image should replace (null = append).
  const [busy, setBusy] = useState<number | null>(null);
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);

  const pick = async (replaceIndex: number | null) => {
    const ImagePicker = getPicker();
    if (!ImagePicker) {
      Alert.alert(
        "Rebuild needed",
        "Photo uploads need a fresh app build (the image picker is a native module). Run “npx expo run:ios” to enable them."
      );
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Photos access needed",
        "Allow photo access in Settings to add profile photos."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      selectionLimit: 1,
    });
    const uri = res.assets?.[0]?.uri;
    if (res.canceled || !uri) return;

    const slot = replaceIndex ?? photos.length;
    setBusy(slot);
    try {
      const url = await uploadProfilePhoto(userId, uri);
      const next = [...photos];
      if (replaceIndex !== null) {
        const old = next[replaceIndex];
        next[replaceIndex] = url;
        void deletePhotoByUrl(old);
      } else {
        next.push(url);
      }
      await onChange(next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    } catch {
      Alert.alert("Upload failed", "Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p);
    setSheetIndex(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await onChange(next);
  };

  const remove = async (index: number) => {
    const url = photos[index];
    setSheetIndex(null);
    await onChange(photos.filter((_, i) => i !== index));
    void deletePhotoByUrl(url);
  };

  const confirmRemove = (index: number) => {
    Alert.alert("Remove this photo?", "It disappears from your profile right away.", [
      { text: "Keep it", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => void remove(index) },
    ]);
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const nextEmpty = photos.length; // only this empty slot is tappable

  return (
    <View>
      <View style={styles.grid}>
        {slots.map((url, i) => {
          const arch = i === 0; // main photo wears the arch
          const radius = {
            borderTopLeftRadius: arch ? tileW / 2 : T.radii.md,
            borderTopRightRadius: arch ? tileW / 2 : T.radii.md,
            borderBottomLeftRadius: T.radii.md,
            borderBottomRightRadius: T.radii.md,
          };

          if (!url) {
            const active = i === nextEmpty && busy === null;
            const uploadingHere = busy === i;
            return (
              <Pressable
                key={`empty-${i}`}
                onPress={active ? () => void pick(null) : undefined}
                style={[
                  styles.empty,
                  radius,
                  { width: tileW, height: tileH, opacity: active || uploadingHere ? 1 : 0.45 },
                ]}
              >
                {uploadingHere ? (
                  <ActivityIndicator color={T.colors.sage} />
                ) : (
                  <>
                    <ImagePlus
                      size={20}
                      color={active ? T.colors.sage : T.forestA(0.3)}
                      strokeWidth={1.8}
                    />
                    {active && <Text style={styles.emptyHint}>Add</Text>}
                  </>
                )}
              </Pressable>
            );
          }

          return (
            <Animated.View key={url} layout={M.layout} entering={M.fadeIn()}>
              <PressableScale
                to={0.95}
                onPress={() => setSheetIndex(i)}
                style={[styles.tile, radius, { width: tileW, height: tileH }]}
              >
                <Image
                  source={{ uri: url }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                {i === 0 && (
                  <View style={styles.mainChip}>
                    <Crown size={10} color={T.colors.white} strokeWidth={2.4} />
                    <Text style={styles.mainChipText}>Main</Text>
                  </View>
                )}
                <View style={styles.orderDot}>
                  <Text style={styles.orderDotText}>{i + 1}</Text>
                </View>
                {busy === i && (
                  <View style={styles.tileBusy}>
                    <ActivityIndicator color={T.colors.white} />
                  </View>
                )}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        Tap a photo to reorder or swap it — the order here is exactly how your
        matches see it.
      </Text>

      {/* ── action sheet ── */}
      <Modal
        visible={sheetIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetIndex(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetIndex(null)}>
          {sheetIndex !== null && photos[sheetIndex] && (
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetGrabber} />
              <View style={styles.sheetHead}>
                <Image
                  source={{ uri: photos[sheetIndex] }}
                  style={styles.sheetThumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>
                    Photo {sheetIndex + 1} of {photos.length}
                  </Text>
                  <Text style={styles.sheetSub}>
                    {sheetIndex === 0
                      ? "This is your main photo"
                      : "Move it, make it main, or swap it"}
                  </Text>
                </View>
              </View>

              {sheetIndex > 0 && (
                <SheetAction
                  icon={<Crown size={17} color={T.colors.terracotta} strokeWidth={2} />}
                  label="Make main photo"
                  onPress={() => void move(sheetIndex, 0)}
                />
              )}
              <SheetAction
                icon={<ArrowLeft size={17} color={T.colors.forest} strokeWidth={2} />}
                label="Move earlier"
                disabled={sheetIndex === 0}
                onPress={() => void move(sheetIndex, sheetIndex - 1)}
              />
              <SheetAction
                icon={<ArrowRight size={17} color={T.colors.forest} strokeWidth={2} />}
                label="Move later"
                disabled={sheetIndex === photos.length - 1}
                onPress={() => void move(sheetIndex, sheetIndex + 1)}
              />
              <SheetAction
                icon={<RefreshCcw size={17} color={T.colors.forest} strokeWidth={2} />}
                label="Replace photo"
                onPress={() => {
                  const idx = sheetIndex;
                  setSheetIndex(null);
                  void pick(idx);
                }}
              />
              <SheetAction
                icon={<Trash2 size={17} color={T.colors.terracotta} strokeWidth={2} />}
                label="Remove"
                destructive
                onPress={() => confirmRemove(sheetIndex)}
              />
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <PressableScale
      to={0.98}
      onPress={disabled ? undefined : onPress}
      style={disabled ? [styles.action, { opacity: 0.35 }] : styles.action}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={[styles.actionText, destructive && { color: T.colors.terracotta }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    overflow: "hidden",
    backgroundColor: T.colors.stone,
    ...T.shadow.soft,
  },
  tileBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.forestA(0.45),
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: T.colors.stone,
    backgroundColor: T.colors.cardClay,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  emptyHint: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 11.5,
    color: T.colors.sage,
  },
  mainChip: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.colors.terracotta,
    borderRadius: T.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...T.shadow.soft,
  },
  mainChipText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: T.colors.white,
  },
  orderDot: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.forestA(0.55),
    alignItems: "center",
    justifyContent: "center",
  },
  orderDotText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 10.5,
    color: T.colors.white,
  },
  caption: {
    marginTop: 12,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.forestA(0.45),
  },
  backdrop: {
    flex: 1,
    backgroundColor: T.forestA(0.4),
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: T.colors.background,
    borderTopLeftRadius: T.radii.xxl,
    borderTopRightRadius: T.radii.xxl,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
  },
  sheetGrabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.colors.stone,
    marginBottom: 14,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sheetThumb: {
    width: 52,
    height: 66,
    borderRadius: T.radii.sm,
    backgroundColor: T.colors.stone,
  },
  sheetTitle: {
    fontFamily: T.fonts.serif,
    fontSize: 18,
    color: T.colors.forest,
  },
  sheetSub: {
    marginTop: 2,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.forestA(0.5),
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 8,
  },
  actionIcon: { width: 22, alignItems: "center" },
  actionText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 14.5,
    color: T.colors.forest,
  },
});
