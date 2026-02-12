import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "clipboard-theme-preferences";

export interface ThemePreferences {
  theme: string;
  accentColor: string;
  colorMode: "solid" | "gradient";
  gradientId: string | null;
  customColor: string;
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: "system",
  accentColor: "blue",
  colorMode: "solid",
  gradientId: null,
  customColor: "#3b82f6",
};

export const PRESET_COLORS = [
  { id: "blue", label: "Blue", hsl: "217 91% 60%" },
  { id: "purple", label: "Purple", hsl: "262 83% 58%" },
  { id: "green", label: "Green", hsl: "142 76% 36%" },
  { id: "orange", label: "Orange", hsl: "24 95% 53%" },
  { id: "pink", label: "Pink", hsl: "330 81% 60%" },
  { id: "red", label: "Red", hsl: "0 84% 60%" },
  { id: "cyan", label: "Cyan", hsl: "188 94% 43%" },
  { id: "amber", label: "Amber", hsl: "38 92% 50%" },
  { id: "emerald", label: "Emerald", hsl: "160 84% 39%" },
  { id: "violet", label: "Violet", hsl: "258 90% 66%" },
  { id: "rose", label: "Rose", hsl: "347 77% 50%" },
  { id: "teal", label: "Teal", hsl: "174 84% 32%" },
];

export const GRADIENT_PRESETS = [
  { id: "sunset", label: "Sunset", from: "0 84% 60%", to: "24 95% 53%" },
  { id: "ocean", label: "Ocean", from: "217 91% 60%", to: "188 94% 43%" },
  { id: "forest", label: "Forest", from: "142 76% 36%", to: "160 84% 39%" },
  { id: "aurora", label: "Aurora", from: "262 83% 58%", to: "330 81% 60%" },
  { id: "fire", label: "Fire", from: "24 95% 53%", to: "0 84% 60%" },
  { id: "lavender", label: "Lavender", from: "258 90% 66%", to: "330 81% 60%" },
  { id: "mint", label: "Mint", from: "174 84% 32%", to: "142 76% 36%" },
  { id: "golden", label: "Golden", from: "38 92% 50%", to: "24 95% 53%" },
];

export const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const useThemePreferences = (userId: string | null) => {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    // Initialize from localStorage immediately to prevent flash
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        return JSON.parse(localData) as ThemePreferences;
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_PREFERENCES;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Apply theme colors to document
  const applyTheme = useCallback((prefs: ThemePreferences) => {
    const applyColor = (hsl: string) => {
      document.documentElement.style.setProperty("--primary", hsl);
      document.documentElement.style.setProperty("--primary-glow", hsl);
      document.documentElement.style.setProperty("--ring", hsl);
      // Update accent to tint from primary for Google Material style
      const parts = hsl.split(" ");
      if (parts.length >= 3) {
        const h = parts[0];
        document.documentElement.style.setProperty("--accent", `${h} 40% 95%`);
        document.documentElement.style.setProperty("--accent-foreground", `${h} 82% 40%`);
      }
    };

    if (prefs.colorMode === "gradient" && prefs.gradientId) {
      const gradient = GRADIENT_PRESETS.find(g => g.id === prefs.gradientId);
      if (gradient) {
        applyColor(gradient.from);
        document.documentElement.style.setProperty("--primary-glow", gradient.to);
        document.documentElement.style.setProperty(
          "--gradient-primary", 
          `linear-gradient(135deg, hsl(${gradient.from}), hsl(${gradient.to}))`
        );
        document.documentElement.setAttribute("data-gradient-mode", "true");
      }
    } else if (prefs.accentColor.startsWith("custom:")) {
      const hex = prefs.accentColor.replace("custom:", "");
      const hsl = hexToHsl(hex);
      applyColor(hsl);
      document.documentElement.removeAttribute("data-gradient-mode");
    } else {
      const color = PRESET_COLORS.find(c => c.id === prefs.accentColor);
      if (color) {
        applyColor(color.hsl);
      }
      document.documentElement.removeAttribute("data-gradient-mode");
    }
  }, []);

  // Apply theme immediately on mount from initial state
  useEffect(() => {
    applyTheme(preferences);
  }, []); // Only run once on mount

  // Load preferences from localStorage first (instant), then from DB if logged in
  const loadPreferences = useCallback(async () => {
    try {
      // Re-apply from localStorage (already set in initial state)
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData) as ThemePreferences;
        setPreferences(parsed);
        applyTheme(parsed);
      }

      // If logged in, sync from database
      if (userId) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error loading DB preferences:", error);
        } else if (data) {
          // Parse the stored format
          let prefs: ThemePreferences = { ...DEFAULT_PREFERENCES };
          
          if (data.theme) prefs.theme = data.theme;
          
          if (data.accent_color) {
            if (data.accent_color.startsWith("gradient:")) {
              prefs.colorMode = "gradient";
              prefs.gradientId = data.accent_color.replace("gradient:", "");
            } else if (data.accent_color.startsWith("custom:")) {
              prefs.colorMode = "solid";
              prefs.customColor = data.accent_color.replace("custom:", "");
              prefs.accentColor = data.accent_color;
            } else {
              prefs.colorMode = "solid";
              prefs.accentColor = data.accent_color;
            }
          }

          setPreferences(prefs);
          applyTheme(prefs);
          // Sync to localStorage for offline access
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, applyTheme]);

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
      applyTheme(updated);

      // If logged in, save to database
      if (userId) {
        // Serialize to DB format
        let accentColorValue = updated.accentColor;
        if (updated.colorMode === "gradient" && updated.gradientId) {
          accentColorValue = `gradient:${updated.gradientId}`;
        } else if (updated.customColor && updated.accentColor.startsWith("custom:")) {
          accentColorValue = `custom:${updated.customColor}`;
        }

        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: userId,
            theme: updated.theme,
            accent_color: accentColorValue,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) {
          console.error("DB save error:", error);
          // Don't show error - localStorage already saved
        }
      }

      toast.success("Preferences saved!", { duration: 1500 });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }, [preferences, userId, applyTheme]);

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    applyTheme,
  };
};
