import { useColorScheme } from "react-native";

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  segmentTrack: string;
  segmentSelected: string;
  complete: string;
  archive: string;
  danger: string;
};

const light: ThemeColors = {
  background: "#f4f5f7",
  surface: "#ffffff",
  text: "#111111",
  textMuted: "#5d6168",
  border: "#8a8e95",
  primary: "#1a73d9",
  onPrimary: "#ffffff",
  segmentTrack: "#e3e5e8",
  segmentSelected: "#ffffff",
  complete: "#1f7a4d",
  archive: "#5b45b8",
  danger: "#c9353a",
};

const dark: ThemeColors = {
  background: "#0f1012",
  surface: "#1c1d21",
  text: "#f2f3f5",
  textMuted: "#9a9ea6",
  border: "#6f737b",
  primary: "#4c9cf0",
  onPrimary: "#0b1320",
  segmentTrack: "#26282d",
  segmentSelected: "#3a3c42",
  complete: "#237a4f",
  archive: "#6e58c9",
  danger: "#b8323a",
};

/** Returns the color palette for the device's current light or dark setting. */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === "dark" ? dark : light;
}
