import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { T } from "@/lib/theme";

/**
 * Round avatar with an initials fallback (sage on clay) and an optional
 * presence dot. `ring` draws the thin stone ring used on cards.
 */
export function Avatar({
  uri,
  name,
  size = 44,
  online,
  ring = true,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const dot = Math.max(10, Math.round(size * 0.26));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.img,
            { width: size, height: size, borderRadius: size / 2 },
            ring && styles.ring,
          ]}
          transition={200}
          contentFit="cover"        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
            ring && styles.ring,
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: online ? "#7BA05B" : T.colors.stone,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: T.colors.stone },
  ring: { borderWidth: 1.5, borderColor: T.colors.stone },
  fallback: {
    backgroundColor: T.colors.clay,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: T.fonts.serif,
    color: T.colors.forest,
  },
  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: T.colors.background,
  },
});
