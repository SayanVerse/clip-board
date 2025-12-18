import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Enter"], description: "Send text (in text mode)" },
  { keys: ["Shift", "Enter"], description: "New line (in text mode)" },
  { keys: ["Ctrl", "Enter"], description: "Send code (in code mode)" },
  { keys: ["Ctrl", "V"], description: "Paste and auto-send" },
  { keys: ["Esc"], description: "Clear input" },
  { keys: ["Ctrl", "C"], description: "Copy selected text" },
];

export const KeyboardShortcuts = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Tip: Keyboard shortcuts work when the input is not focused.
        </p>
      </DialogContent>
    </Dialog>
  );
};
