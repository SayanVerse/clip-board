import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  onCtrlV?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onCtrlV,
  onEscape,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+V (or Cmd+V on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const target = e.target as HTMLElement;
        // Only trigger if not already in an input/textarea
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          onCtrlV?.();
        }
      }

      // Escape key
      if (e.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onCtrlV, onEscape]);
};
