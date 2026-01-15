import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, X, Sun, Moon, Monitor, Check, Palette, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserSettingsProps {
  userId: string;
}

const PRESET_COLORS = [
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

const GRADIENT_PRESETS = [
  { id: "sunset", label: "Sunset", from: "0 84% 60%", to: "24 95% 53%" },
  { id: "ocean", label: "Ocean", from: "217 91% 60%", to: "188 94% 43%" },
  { id: "forest", label: "Forest", from: "142 76% 36%", to: "160 84% 39%" },
  { id: "aurora", label: "Aurora", from: "262 83% 58%", to: "330 81% 60%" },
  { id: "fire", label: "Fire", from: "24 95% 53%", to: "0 84% 60%" },
  { id: "lavender", label: "Lavender", from: "258 90% 66%", to: "330 81% 60%" },
  { id: "mint", label: "Mint", from: "174 84% 32%", to: "142 76% 36%" },
  { id: "golden", label: "Golden", from: "38 92% 50%", to: "24 95% 53%" },
];

export const UserSettings = ({ userId }: UserSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("blue");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [gradientId, setGradientId] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        if (data.theme) setTheme(data.theme);
        if (data.accent_color) {
          if (data.accent_color.startsWith("gradient:")) {
            setColorMode("gradient");
            const gradId = data.accent_color.replace("gradient:", "");
            setGradientId(gradId);
            applyGradient(gradId);
          } else if (data.accent_color.startsWith("custom:")) {
            setColorMode("solid");
            const hex = data.accent_color.replace("custom:", "");
            setCustomColor(hex);
            applyCustomColor(hex);
          } else {
            setColorMode("solid");
            setAccentColor(data.accent_color);
            applyAccentColor(data.accent_color);
          }
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
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

  const applyAccentColor = (colorId: string) => {
    const color = PRESET_COLORS.find(c => c.id === colorId);
    if (color) {
      document.documentElement.style.setProperty("--primary", color.hsl);
      document.documentElement.style.setProperty("--primary-glow", color.hsl);
      document.documentElement.style.setProperty("--ring", color.hsl);
    }
  };

  const applyCustomColor = (hex: string) => {
    const hsl = hexToHsl(hex);
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--primary-glow", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
  };

  const applyGradient = (gradId: string) => {
    const gradient = GRADIENT_PRESETS.find(g => g.id === gradId);
    if (gradient) {
      document.documentElement.style.setProperty("--primary", gradient.from);
      document.documentElement.style.setProperty("--primary-glow", gradient.to);
      document.documentElement.style.setProperty("--ring", gradient.from);
    }
  };

  const savePreferences = async (newTheme?: string, colorValue?: string) => {
    setLoading(true);
    try {
      const preferences = {
        user_id: userId,
        theme: newTheme || theme,
        accent_color: colorValue || (colorMode === "gradient" ? `gradient:${gradientId}` : accentColor),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_preferences")
        .upsert(preferences, { onConflict: "user_id" });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    savePreferences(newTheme, undefined);
  };

  const handleAccentChange = (colorId: string) => {
    setAccentColor(colorId);
    setGradientId(null);
    setColorMode("solid");
    applyAccentColor(colorId);
    savePreferences(undefined, colorId);
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex);
    setGradientId(null);
    setColorMode("solid");
    applyCustomColor(hex);
    savePreferences(undefined, `custom:${hex}`);
  };

  const handleGradientChange = (gradId: string) => {
    setGradientId(gradId);
    setColorMode("gradient");
    applyGradient(gradId);
    savePreferences(undefined, `gradient:${gradId}`);
  };

  // Render the panel using a portal to ensure it's always on top
  const settingsPanel = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl overflow-auto"
            style={{ zIndex: 9999 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Settings</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Theme Selection */}
              <div className="space-y-4 mb-8">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Appearance
                </Label>
                <RadioGroup
                  value={theme}
                  onValueChange={handleThemeChange}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        theme === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <option.icon className={cn(
                        "h-5 w-5",
                        theme === option.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Color Settings */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Accent Color
                </Label>
                
                <Tabs defaultValue="preset" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preset">Preset</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                    <TabsTrigger value="gradient">Gradient</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preset" className="mt-4">
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => handleAccentChange(color.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                            accentColor === color.id && colorMode === "solid"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-full relative flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: `hsl(${color.hsl})` }}
                          >
                            {accentColor === color.id && colorMode === "solid" && (
                              <Check className="h-4 w-4 text-white drop-shadow" />
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="custom" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="w-16 h-16 rounded-xl cursor-pointer border-2 border-border"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm">Custom Color</Label>
                          <Input
                            value={customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            placeholder="#3b82f6"
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pick any color you like using the color picker or enter a hex code.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="gradient" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {GRADIENT_PRESETS.map((gradient) => (
                        <button
                          key={gradient.id}
                          onClick={() => handleGradientChange(gradient.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            gradientId === gradient.id && colorMode === "gradient"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div
                            className="w-full h-8 rounded-lg relative flex items-center justify-center shadow-sm"
                            style={{ 
                              background: `linear-gradient(135deg, hsl(${gradient.from}), hsl(${gradient.to}))`
                            }}
                          >
                            {gradientId === gradient.id && colorMode === "gradient" && (
                              <Check className="h-4 w-4 text-white drop-shadow" />
                            )}
                          </div>
                          <span className="text-xs font-medium">{gradient.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Gradients add a dynamic touch to buttons and accents.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {loading && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Saving preferences...
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Render panel in a portal at document.body level */}
      {typeof document !== "undefined" && createPortal(settingsPanel, document.body)}
    </>
  );
};
