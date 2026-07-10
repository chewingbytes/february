import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { T } from "@/lib/theme";

/** Centered botanical empty state: icon in a sage ring, serif title, soft body. */
export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Animated.View entering={M.fadeDown()} style={styles.wrap}>
      <View style={styles.iconRing}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.sageA(0.14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: T.fonts.serif,
    fontSize: 24,
    color: T.colors.forest,
    textAlign: "center",
  },
  body: {
    marginTop: 10,
    fontFamily: T.fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: T.forestA(0.55),
    textAlign: "center",
  },
});
