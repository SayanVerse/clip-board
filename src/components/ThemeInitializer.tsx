import { useEffect } from "react";

const STORAGE_KEY = "clipboard-theme-preferences";

// Legacy inline overrides from the old accent/gradient system — the current
// design is monochrome, so these must never be set at runtime.
const LEGACY_VARS = [
  "--primary",
  "--primary-glow",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--gradient-primary",
];

/**
 * Runs once on mount: strips any legacy accent/gradient overrides left by the
 * old theme system and migrates stored preferences down to theme mode only.
 */
export const ThemeInitializer = () => {
  useEffect(() => {
    LEGACY_VARS.forEach((v) => document.documentElement.style.removeProperty(v));
    document.documentElement.removeAttribute("data-gradient-mode");

    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (!localData) return;

      const prefs = JSON.parse(localData);
      if (prefs && (prefs.accentColor || prefs.colorMode || prefs.gradientId || prefs.customColor)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: prefs.theme || "system" }));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  return null;
};
