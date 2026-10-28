import { useState } from "react";
import { Menu, X, Clipboard, Cloud, CircleDashed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { AuthButton } from "@/components/AuthButton";
import { SessionTimer } from "@/components/SessionTimer";
import { UserSettings } from "@/components/UserSettings";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  sessionId: string | null;
  sessionStart: number | null;
  isLoggedIn: boolean;
  userId?: string;
}

export const MobileNav = ({ sessionId, sessionStart, isLoggedIn, userId }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card md:hidden">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Clipboard className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-foreground">SyncHub</span>
          </div>

          <div className="flex items-center gap-2">
            {sessionId && sessionStart && <SessionTimer startTime={sessionStart} />}
            {isLoggedIn && !sessionId && (
              <div className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Synced</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-foreground/10 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed left-0 right-0 top-14 z-50 border-b border-border bg-card shadow-[var(--shadow-3)] md:hidden"
            >
              <div className="mx-auto w-full max-w-6xl px-4 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {sessionId ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full bg-primary animate-soft-pulse" />
                          Session active
                        </span>
                      ) : isLoggedIn ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Cloud className="h-3 w-3" /> Cloud synced
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CircleDashed className="h-3 w-3" /> Not connected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shortcuts</span>
                    <KeyboardShortcuts />
                  </div>

                  {isLoggedIn && userId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Settings</span>
                      <UserSettings userId={userId} />
                    </div>
                  )}

                  <div className="border-t border-border pt-3">
                    <AuthButton />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
