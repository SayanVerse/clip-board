import { useEffect } from "react";

const STORAGE_KEY = "clipboard-theme-preferences";

const PRESET_COLORS: Record<string, string> = {
  blue: "217 91% 60%",
  purple: "262 83% 58%",
  green: "142 76% 36%",
  orange: "24 95% 53%",
  pink: "330 81% 60%",
  red: "0 84% 60%",
  cyan: "188 94% 43%",
  amber: "38 92% 50%",
  emerald: "160 84% 39%",
  violet: "258 90% 66%",
  rose: "347 77% 50%",
  teal: "174 84% 32%",
};

const GRADIENT_PRESETS: Record<string, { from: string; to: string }> = {
  sunset: { from: "0 84% 60%", to: "24 95% 53%" },
  ocean: { from: "217 91% 60%", to: "188 94% 43%" },
  forest: { from: "142 76% 36%", to: "160 84% 39%" },
  aurora: { from: "262 83% 58%", to: "330 81% 60%" },
  fire: { from: "24 95% 53%", to: "0 84% 60%" },
  lavender: { from: "258 90% 66%", to: "330 81% 60%" },
  mint: { from: "174 84% 32%", to: "142 76% 36%" },
  golden: { from: "38 92% 50%", to: "24 95% 53%" },
};

const hexToHsl = (hex: string): string => {
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

/**
 * This component initializes the theme from localStorage immediately on mount.
 * It runs synchronously to prevent theme flash on page load.
 */
export const ThemeInitializer = () => {
  useEffect(() => {
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (!localData) return;

      const prefs = JSON.parse(localData);

      if (prefs.colorMode === "gradient" && prefs.gradientId) {
        const gradient = GRADIENT_PRESETS[prefs.gradientId];
        if (gradient) {
          document.documentElement.style.setProperty("--primary", gradient.from);
          document.documentElement.style.setProperty("--primary-glow", gradient.to);
          document.documentElement.style.setProperty("--ring", gradient.from);
          document.documentElement.style.setProperty(
            "--gradient-primary", 
            `linear-gradient(135deg, hsl(${gradient.from}), hsl(${gradient.to}))`
          );
          document.documentElement.setAttribute("data-gradient-mode", "true");
        }
      } else if (prefs.accentColor?.startsWith("custom:")) {
        const hex = prefs.accentColor.replace("custom:", "");
        const hsl = hexToHsl(hex);
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--primary-glow", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
        document.documentElement.removeAttribute("data-gradient-mode");
      } else if (prefs.accentColor) {
        const hsl = PRESET_COLORS[prefs.accentColor];
        if (hsl) {
          document.documentElement.style.setProperty("--primary", hsl);
          document.documentElement.style.setProperty("--primary-glow", hsl);
          document.documentElement.style.setProperty("--ring", hsl);
        }
        document.documentElement.removeAttribute("data-gradient-mode");
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  return null;
};
