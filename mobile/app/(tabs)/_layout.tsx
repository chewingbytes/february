import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import * as Haptics from "expo-haptics";
import { MapPin, MessageCircle, Sprout } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { M } from "@/lib/motion";
import { T } from "@/lib/theme";

const ICONS: Record<string, React.ComponentType<{ color: string; size: number; strokeWidth: number }>> = {
  index: Sprout,
  chats: MessageCircle,
  map: MapPin,
};
const LABELS: Record<string, string> = {
  index: "Home",
  chats: "Chats",
  map: "Nights",
};

/**
 * iOS — the real SwiftUI tab bar (Liquid Glass on iOS 26, the classic
 * translucent bar on earlier versions). Icons are SF Symbols.
 */
function IosTabs() {
  return (
    <NativeTabs tintColor={T.colors.terracotta}>
      <NativeTabs.Trigger name="index">
        <Icon sf="leaf" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chats">
        <Icon sf="message" />
        <Label>Chats</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf="map" />
        <Label>Nights</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/**
 * Android — the floating botanical pill bar: alabaster capsule with a forest
 * pill that shifts to the active tab and reveals its label.
 */
function BotanicalTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 6 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, i) => {
          const active = state.index === i;
          const Icon = ICONS[route.name] ?? Sprout;
          const onPress = () => {
            void Haptics.selectionAsync().catch(() => {});
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!active && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <Animated.View key={route.key} layout={M.layout}>
              <Pressable
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.item, active && styles.itemActive]}
              >
                <Icon
                  color={active ? T.colors.background : T.forestA(0.5)}
                  size={20}
                  strokeWidth={1.8}
                />
                {active && (
                  <Animated.Text entering={M.fadeIn()} style={styles.label}>
                    {LABELS[route.name] ?? route.name}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function AndroidTabs() {
  return (
    <Tabs
      tabBar={(props) => <BotanicalTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: T.colors.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="map" />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={T.colors.sage} />
      </View>
    );
  }
  if (!session) return <Redirect href="/sign-in" />;

  return Platform.OS === "ios" ? <IosTabs /> : <AndroidTabs />;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.card,
    borderWidth: 1,
    borderColor: T.colors.stone,
    ...T.shadow.large,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: T.radii.full,
  },
  itemActive: {
    backgroundColor: T.colors.forest,
  },
  label: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 13,
    color: T.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.colors.background,
  },
});
