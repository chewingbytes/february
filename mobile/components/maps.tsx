/**
 * Map shim — the same trick the meetup2 app uses, but automatic.
 *
 * react-native-maps' native module is NOT bundled in Expo Go, and merely
 * importing the real package crashes Expo Go at launch. In Expo Go we export
 * a stub (flat alabaster canvas, markers render nothing); in a dev/prod build
 * (`expo run:ios` / eas build) the lazy require() pulls in the real map.
 */
import Constants from "expo-constants";
import React from "react";
import { View } from "react-native";

export type LatLng = { latitude: number; longitude: number };
export type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

export const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

/* ── stub implementations (Expo Go) ── */

class StubMapView extends React.Component<any> {
  animateToRegion(_region?: Region, _duration?: number) {}
  animateCamera(_camera?: any, _opts?: any) {}
  fitToCoordinates(_coords?: LatLng[], _opts?: any) {}
  render() {
    const { style, children } = this.props ?? {};
    return <View style={[{ backgroundColor: "#EFEDE6" }, style]}>{children}</View>;
  }
}
const StubMarker = (_props: any) => null;

/* ── real implementations (dev / prod builds) ── */

type MapsModule = {
  default: any;
  Marker: any;
  PROVIDER_GOOGLE: any;
};

const real: MapsModule | null = IS_EXPO_GO
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-var-requires
    (require("react-native-maps") as MapsModule);

export const MapView: any = real?.default ?? StubMapView;
export const Marker: any = real?.Marker ?? StubMarker;
export const PROVIDER_GOOGLE: any = real?.PROVIDER_GOOGLE ?? "google";
