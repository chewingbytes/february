import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { M } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { PressableScale } from "@/components/ui/pressable-scale";
import { useAuth } from "@/lib/auth";
import { T, eyebrow } from "@/lib/theme";

/** The official multicolour Google "G". */
function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function SignIn() {
  const { session, loading, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) return <Redirect href="/(tabs)" />;

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-bleed hero photograph with the website's forest tint */}
      <Image source={require("../assets/hero.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: T.forestA(0.62) }]} />
      <LinearGradient
        colors={["transparent", "rgba(20, 26, 22, 0.9)"]}
        style={styles.bottomScrim}
      />

      {/* Wordmark, floating over the photo like the site hero */}
      <View style={styles.center}>
        <Animated.View entering={M.fadeDown()}>
          <Image
            source={require("../assets/wordmark.png")}
            style={styles.wordmark}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom sheet copy + CTA */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <Animated.Text
          entering={M.fadeUp(80)}
          style={styles.eyebrow}
        >
          Hosted game nights · Singapore
        </Animated.Text>
        <Animated.Text entering={M.fadeUp(140)} style={styles.tagline}>
          Find your <Text style={styles.taglineItalic}>Player 2.</Text>
        </Animated.Text>
        <Animated.Text entering={M.fadeUp(200)} style={styles.sub}>
          Team up with your match and take on the table together.
        </Animated.Text>

        <Animated.View entering={M.fadeUp(260)}>
          <PressableScale
            to={0.97}
            onPress={busy ? undefined : onGoogle}
            style={styles.googleBtn}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {busy ? (
              <ActivityIndicator color={T.colors.forest} />
            ) : (
              <>
                <GoogleG />
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </PressableScale>
        </Animated.View>

        {error ? (
          <Animated.Text entering={M.fadeUp()} style={styles.error}>
            {error}
          </Animated.Text>
        ) : (
          <Text style={styles.note}>One tap — we only use your email.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.colors.forest },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 380,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  wordmark: {
    width: 300,
    height: 150,
  },
  bottom: {
    paddingHorizontal: 28,
  },
  eyebrow: {
    ...eyebrow,
    color: T.colors.blush,
    textAlign: "center",
  },
  tagline: {
    marginTop: 10,
    fontFamily: T.fonts.serif,
    fontSize: 38,
    lineHeight: 44,
    color: T.colors.white,
    textAlign: "center",
  },
  taglineItalic: {
    fontFamily: T.fonts.serifItalic,
    color: T.colors.blush,
  },
  sub: {
    marginTop: 10,
    marginBottom: 26,
    fontFamily: T.fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: T.whiteA(0.8),
    textAlign: "center",
  },
  googleBtn: {
    height: 56,
    borderRadius: T.radii.full,
    backgroundColor: T.colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...T.shadow.large,
  },
  googleText: {
    fontFamily: T.fonts.sansSemiBold,
    fontSize: 16,
    color: T.colors.forest,
  },
  note: {
    marginTop: 14,
    fontFamily: T.fonts.sans,
    fontSize: 12.5,
    color: T.whiteA(0.55),
    textAlign: "center",
  },
  error: {
    marginTop: 14,
    fontFamily: T.fonts.sansMedium,
    fontSize: 13,
    color: T.colors.blush,
    textAlign: "center",
  },
});
