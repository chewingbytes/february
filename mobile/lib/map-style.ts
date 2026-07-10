/**
 * Botanical Google Maps style — the website palette translated to cartography:
 * alabaster ground, stone roads, sage greenery, muted forest labels. Applied
 * via MapView's `customMapStyle` (Google provider only).
 */
export const BOTANICAL_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F4F2EC" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7A6E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F9F8F4" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#DCCFC2" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#EFEDE4" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#DCE5D5", visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8C9A84", visibility: "on" }],
  },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E6E2DA" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#F2E9E1" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E3D5C8" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CBD9CE" }] },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7E9187" }],
  },
];
