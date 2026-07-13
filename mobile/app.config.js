// Dynamic Expo config — wires the Google Maps API keys (from env) into the
// react-native-maps config plugin, exactly like the meetup2 app.
//
// react-native-maps >= ~1.18 ships its own Expo config plugin that, given a
// key, adds the `react-native-maps/Google` pod, sets GMSApiKey, injects
// GMSServices.provideAPIKey into the AppDelegate, and wires the Android
// manifest key.
//
// IMPORTANT: do NOT also set the legacy `ios.config.googleMapsApiKey` /
// `android.config.googleMaps.apiKey` — those trigger Expo's built-in maps
// handling, which tries to add the old standalone `react-native-google-maps`
// pod that no longer exists, breaking `pod install`.
//
// Keys live in `.env.local` (local builds) and EAS env vars (cloud builds):
//   GOOGLE_MAPS_API_KEY_IOS=AIza...
//   GOOGLE_MAPS_API_KEY_ANDROID=AIza...
const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_IOS;
const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID;

export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey,
        androidGoogleMapsApiKey,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Player 2 uses your photo library so you can add photos to your profile.",
      },
    ],
  ],
});
