import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from "@expo-google-fonts/source-sans-3";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { T } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: T.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
          <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen
            name="profile"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
