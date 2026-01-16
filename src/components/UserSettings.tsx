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
import { cn } from "@/lib/utils";
import { 
  useThemePreferences, 
  PRESET_COLORS, 
  GRADIENT_PRESETS 
} from "@/hooks/useThemePreferences";

interface UserSettingsProps {
  userId: string | null;
}

export const UserSettings = ({ userId }: UserSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const { 
    preferences, 
    saving, 
    savePreferences,
  } = useThemePreferences(userId);

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

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  };

  const handleAccentChange = (colorId: string) => {
    savePreferences({ 
      accentColor: colorId, 
      colorMode: "solid", 
      gradientId: null 
    });
  };

  const handleCustomColorChange = (hex: string) => {
    savePreferences({ 
      customColor: hex, 
      accentColor: `custom:${hex}`, 
      colorMode: "solid", 
      gradientId: null 
    });
  };

  const handleGradientChange = (gradId: string) => {
    savePreferences({ 
      gradientId: gradId, 
      colorMode: "gradient" 
    });
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
                          disabled={saving}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                            preferences.accentColor === color.id && preferences.colorMode === "solid"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                            saving && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-full relative flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: `hsl(${color.hsl})` }}
                          >
                            {preferences.accentColor === color.id && preferences.colorMode === "solid" && (
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
                            value={preferences.customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            disabled={saving}
                            className="w-16 h-16 rounded-xl cursor-pointer border-2 border-border disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm">Custom Color</Label>
                          <Input
                            value={preferences.customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            placeholder="#3b82f6"
                            disabled={saving}
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
                          disabled={saving}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            preferences.gradientId === gradient.id && preferences.colorMode === "gradient"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                            saving && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div
                            className="w-full h-8 rounded-lg relative flex items-center justify-center shadow-sm"
                            style={{ 
                              background: `linear-gradient(135deg, hsl(${gradient.from}), hsl(${gradient.to}))`
                            }}
                          >
                            {preferences.gradientId === gradient.id && preferences.colorMode === "gradient" && (
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

              {saving && (
                <p className="text-sm text-muted-foreground mt-4 text-center animate-pulse">
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
