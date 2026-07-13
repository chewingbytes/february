import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { PressableScale } from "@/components/ui/pressable-scale";
import type { SamplePerson } from "@/lib/sample";
import { T } from "@/lib/theme";

/**
 * A person tile for the home rails. Botanical language throughout:
 *  • arched photo top (the website's signature portrait arch) on large cards
 *  • compatibility % pill, terracotta, top-right
 *  • a hand-placed speech bubble ("about my day"), slightly tilted, with a tail
 *  • serif name over a forest scrim + a small trait chip
 */
export function PersonCard({
  person,
  index,
  size = "md",
}: {
  person: SamplePerson;
  index: number;
  size?: "lg" | "md";
}) {
  const lg = size === "lg";
  const width = lg ? 182 : 152;
  const height = lg ? 250 : 208;
  const router = useRouter();

  return (
    <Animated.View entering={M.fadeDown(50 + index * 40)}>
      <PressableScale
        to={0.965}
        style={{ width }}
        onPress={() => router.push(`/person/${person.id}`)}
      >
        <View
          style={[
            styles.photoWrap,
            {
              width,
              height,
              borderTopLeftRadius: lg ? 90 : T.radii.xl,
              borderTopRightRadius: lg ? 90 : T.radii.xl,
            },
          ]}
        >
          <Image
            source={{ uri: person.photo }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          {/* readability scrim, like the site's photo tiles */}
          <LinearGradient
            colors={["transparent", "rgba(45,58,49,0.82)"]}
            locations={[0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* compatibility badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{person.compatibility}%</Text>
          </View>

          {/* name + trait */}
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {person.name}, {person.age}
            </Text>
            <View style={styles.tagChip}>
              <Text style={styles.tagText} numberOfLines={1}>
                {person.tag}
              </Text>
            </View>
          </View>
        </View>

        {/* status bubble — sits under the portrait like a caption card */}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText} numberOfLines={2}>
            {person.bubble}
          </Text>
          <View style={styles.bubbleTail} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    overflow: "hidden",
    borderBottomLeftRadius: T.radii.lg,
    borderBottomRightRadius: T.radii.lg,
    backgroundColor: T.colors.stone,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: T.colors.terracotta,
    borderRadius: T.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...T.shadow.soft,
  },
  badgeText: {
    fontFamily: T.fonts.sansBold,
    fontSize: 12,
    color: T.colors.white,
    letterSpacing: 0.3,
  },
  nameBlock: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  name: {
    fontFamily: T.fonts.serif,
    fontSize: 19,
    color: T.colors.white,
  },
  tagChip: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: T.whiteA(0.16),
    borderWidth: 1,
    borderColor: T.whiteA(0.28),
    borderRadius: T.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 11,
    color: T.whiteA(0.92),
  },
  bubble: {
    marginTop: 10,
    marginHorizontal: 2,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    transform: [{ rotate: "-1.2deg" }],
    ...T.shadow.soft,
  },
  bubbleTail: {
    position: "absolute",
    top: -6,
    left: 18,
    width: 10,
    height: 10,
    backgroundColor: T.colors.card,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: T.colors.stone,
    transform: [{ rotate: "45deg" }],
  },
  bubbleText: {
    fontFamily: T.fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.forestA(0.75),
  },
});
