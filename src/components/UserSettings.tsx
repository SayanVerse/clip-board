import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, X, Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserSettingsProps {
  userId: string;
}

const ACCENT_COLORS = [
  { id: "blue", label: "Blue", hsl: "217 91% 60%" },
  { id: "purple", label: "Purple", hsl: "262 83% 58%" },
  { id: "green", label: "Green", hsl: "142 76% 36%" },
  { id: "orange", label: "Orange", hsl: "24 95% 53%" },
  { id: "pink", label: "Pink", hsl: "330 81% 60%" },
  { id: "red", label: "Red", hsl: "0 84% 60%" },
];

export const UserSettings = ({ userId }: UserSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

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
          setAccentColor(data.accent_color);
          applyAccentColor(data.accent_color);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const applyAccentColor = (colorId: string) => {
    const color = ACCENT_COLORS.find(c => c.id === colorId);
    if (color) {
      document.documentElement.style.setProperty("--primary", color.hsl);
    }
  };

  const savePreferences = async (newTheme?: string, newAccent?: string) => {
    setLoading(true);
    try {
      const preferences = {
        user_id: userId,
        theme: newTheme || theme,
        accent_color: newAccent || accentColor,
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
    applyAccentColor(colorId);
    savePreferences(undefined, colorId);
  };

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

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-2xl overflow-auto"
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
                  <Label className="text-base font-medium">Appearance</Label>
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

                {/* Accent Color */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Accent Color</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleAccentChange(color.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          accentColor === color.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-full relative flex items-center justify-center"
                          style={{ backgroundColor: `hsl(${color.hsl})` }}
                        >
                          {accentColor === color.id && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{color.label}</span>
                      </button>
                    ))}
                  </div>
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
    </>
  );
};