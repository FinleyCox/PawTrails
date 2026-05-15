import { StyleSheet } from "react-native";

export type ThemeKey = "sage" | "teal" | "warm" | "midnight";

export interface Theme {
  primary: string;
  primaryLight: string;
  primaryGradient: readonly [string, string];
  secondary: string;
  background: string;
  surface: string;
  border: string;
  danger: string;
  warning: string;
  text: string;
  textMuted: string;
}

export const themes: Record<ThemeKey, Theme> = {
  sage: {
    primary: "#5C8F72",
    primaryLight: "#8DBFA0",
    primaryGradient: ["#5C8F72", "#8DBFA0"],
    secondary: "#E8A87C",
    background: "#F8F8F5",
    surface: "#FFFFFF",
    border: "#EEEEEE",
    danger: "#D95D5D",
    warning: "#D4845A",
    text: "#1C1C1E",
    textMuted: "#8E8E93",
  },
  teal: {
    primary: "#0D9488",
    primaryLight: "#2DD4BF",
    primaryGradient: ["#0D9488", "#2DD4BF"],
    secondary: "#F59E0B",
    background: "#F0FDFA",
    surface: "#FFFFFF",
    border: "#CCFBF1",
    danger: "#DC2626",
    warning: "#D97706",
    text: "#134E4A",
    textMuted: "#6B7280",
  },
  warm: {
    primary: "#C2714F",
    primaryLight: "#E8A87C",
    primaryGradient: ["#C2714F", "#E8A87C"],
    secondary: "#F5C842",
    background: "#FDF8F3",
    surface: "#FFFFFF",
    border: "#F0E4D7",
    danger: "#C0392B",
    warning: "#E67E22",
    text: "#2C1A0E",
    textMuted: "#9C7E6A",
  },
  midnight: {
    primary: "#6366F1",
    primaryLight: "#A5B4FC",
    primaryGradient: ["#6366F1", "#818CF8"],
    secondary: "#F472B6",
    background: "#0F172A",
    surface: "#1E293B",
    border: "#334155",
    danger: "#EF4444",
    warning: "#F97316",
    text: "#F1F5F9",
    textMuted: "#94A3B8",
  },
};

export const themeLabels: Record<ThemeKey, { label: string; emoji: string }> = {
  sage:     { label: "セージグリーン", emoji: "🌿" },
  teal:     { label: "ティール",       emoji: "🩵" },
  warm:     { label: "ウォーム",       emoji: "🍂" },
  midnight: { label: "ミッドナイト",   emoji: "🌙" },
};

// backward compat — screens that haven't migrated yet can still import this
export const COLORS = themes.sage;
