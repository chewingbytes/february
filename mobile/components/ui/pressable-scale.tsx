import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that breathes — springs down to `to` while pressed, with an
 * optional haptic tick. The app's universal "everything reacts" primitive.
 */
export function PressableScale({
  to = 0.97,
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { to?: number; haptic?: boolean; style?: ViewStyle | ViewStyle[] }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={(e) => {
        // High damping = quick settle, no wobble.
        scale.value = withSpring(to, { damping: 24, stiffness: 420 });
        if (haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 22, stiffness: 380 });
        onPressOut?.(e);
      }}
    />
  );
}
