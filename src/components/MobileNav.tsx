import { useState } from "react";
import { Menu, X, Clipboard, Cloud, CircleDashed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/AuthButton";
import { SessionTimer } from "@/components/SessionTimer";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  sessionId: string | null;
  sessionCode: string | null;
  sessionStart: number | null;
  isLoggedIn: boolean;
  userId?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileNav = ({ sessionId, sessionCode, sessionStart, isLoggedIn, userId, sidebarOpen, onToggleSidebar }: MobileNavProps) => {
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <>
      {/* Universal top bar (mobile + desktop) */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
                <Clipboard className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-foreground truncate">SyncHub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sessionId && sessionStart && <SessionTimer startTime={sessionStart} />}
            {!sessionId && <AuthButton />}
            {isLoggedIn && !sessionId && (
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1"
                aria-label="Toggle sync status"
              >
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="hidden sm:inline text-xs font-medium text-foreground">Synced</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact status popover (when signed in without a session) */}
        <AnimatePresence>
          {statusOpen && isLoggedIn && !sessionId && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-20 border-b border-border bg-card shadow-[var(--shadow-2)]"
            >
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
                <span className="text-xs text-muted-foreground">
                  {sessionId ? "Session active" : "All items sync to your signed-in devices"}
                </span>
                {sessionCode && (
                  <span className="font-mono text-sm font-semibold tracking-[0.3em] text-foreground">{sessionCode}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
