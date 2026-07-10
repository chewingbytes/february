import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/lib/theme";

function Dot({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 320, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
  }, [delay, v]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + v.value * 0.65,
    transform: [{ translateY: -3 * v.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

/** The classic three-dot "typing…" pulse, in a partner-style bubble. */
export function TypingBubble() {
  return (
    <View style={styles.bubble}>
      <Dot delay={0} />
      <Dot delay={140} />
      <Dot delay={280} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    borderRadius: T.radii.lg,
    borderBottomLeftRadius: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.colors.sage,
  },
});
