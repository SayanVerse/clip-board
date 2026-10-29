import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "clipboard-theme-preferences";

export interface ThemePreferences {
  theme: string;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: "system",
};

// Legacy inline overrides from the old accent/gradient system. The current
// design is monochrome — these must never be set at runtime.
const LEGACY_VARS = [
  "--primary",
  "--primary-glow",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--gradient-primary",
];

export const useThemePreferences = (userId: string | null) => {
  const { setTheme } = useTheme();
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    // Initialize from localStorage immediately to prevent flash
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed?.theme) return { theme: parsed.theme };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_PREFERENCES;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // The design system owns all colors now — clear any legacy inline overrides.
  const applyTheme = useCallback(() => {
    LEGACY_VARS.forEach((v) => document.documentElement.style.removeProperty(v));
    document.documentElement.removeAttribute("data-gradient-mode");
  }, []);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Load theme mode from localStorage, then sync from the database if logged in
  const loadPreferences = useCallback(async () => {
    try {
      // Migrate legacy stored prefs (accent colors/gradients) to theme-only
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed?.accentColor || parsed?.colorMode || parsed?.gradientId || parsed?.customColor) {
            const migrated: ThemePreferences = { theme: parsed.theme || "system" };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            setPreferences(migrated);
          }
        } catch {
          // Ignore parse errors
        }
      }

      // If logged in, sync theme mode from the database
      if (userId) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error loading DB preferences:", error);
        } else if (data?.theme) {
          const prefs: ThemePreferences = { theme: data.theme };
          setPreferences(prefs);
          setTheme(prefs.theme as "light" | "dark" | "system");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, setTheme]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences
  const savePreferences = useCallback(async (newPrefs: Partial<ThemePreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setSaving(true);

    try {
      // Always save to localStorage first (instant)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPreferences(updated);

      // If logged in, save to database (and clear legacy accent data)
      if (userId) {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: userId,
            theme: updated.theme,
            accent_color: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) {
          console.error("DB save error:", error);
          // Don't show error - localStorage already saved
        }
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  }, [preferences, userId]);

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    applyTheme,
  };
};
