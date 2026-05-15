import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeKey, Theme, themes } from "../constants/theme";

interface ThemeState {
  key: ThemeKey;
  colors: Theme;
  setTheme: (key: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  key: "sage",
  colors: themes.sage,
  setTheme: (key) => {
    set({ key, colors: themes[key] });
    AsyncStorage.setItem("themeKey", key);
  },
}));

// 起動時に保存済みテーマを復元
AsyncStorage.getItem("themeKey").then((saved) => {
  if (saved && themes[saved as ThemeKey]) {
    useThemeStore.getState().setTheme(saved as ThemeKey);
  }
});
