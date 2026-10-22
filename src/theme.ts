import { Platform } from "react-native";
import type { ViewStyle } from "react-native";

export const colors = {
  brand: {
    50: "#fdf8f3",
    100: "#f9ede0",
    200: "#f2d9bd",
    300: "#e8bd91",
    400: "#dc9a5f",
    500: "#d07f3f",
    600: "#b86431",
    700: "#964e2b",
    800: "#7a4027",
    900: "#653623",
    950: "#371a10",
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    600: "#059669",
    700: "#047857",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    600: "#e11d48",
    700: "#be123c",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    700: "#b45309",
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    700: "#0369a1",
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    700: "#6d28d9",
  },
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(28, 25, 23, 0.45)",
  transparent: "transparent",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 26,
  hero: 32,
} as const;

export const fonts = {
  regular: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  medium: Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  bold: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
} as const;

export const shadow: ViewStyle =
  Platform.OS === "android"
    ? { elevation: 2 }
    : {
        shadowColor: colors.stone[900],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      };

export const strongShadow: ViewStyle =
  Platform.OS === "android"
    ? { elevation: 8 }
    : {
        shadowColor: colors.stone[900],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      };
