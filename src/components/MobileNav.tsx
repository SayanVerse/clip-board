import { useState } from "react";
import { Menu, X, Clipboard, Cloud } from "lucide-react";
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
      {/* Mobile Header - Google style */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-[var(--shadow-1)] md:hidden">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-full">
              <Clipboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-base text-foreground">Clip-Board</span>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && sessionStart && (
              <SessionTimer startTime={sessionStart} />
            )}
            {isLoggedIn && !sessionId && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-accent rounded-full">
                <Cloud className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Synced</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-14 left-0 right-0 z-50 bg-card border-b border-border shadow-[var(--shadow-3)] md:hidden"
            >
              <div className="container max-w-6xl mx-auto px-4 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {sessionId ? (
                        <span className="text-xs font-medium text-primary">Session Active</span>
                      ) : isLoggedIn ? (
                        <span className="text-xs font-medium text-primary">Cloud Synced</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not Connected</span>
                      )}
                    </div>
                  </div>

                  {!isLoggedIn && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                  )}
                  
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

                  <div className="pt-2 border-t border-border">
                    <AuthButton />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Header - Google style surface */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-[var(--shadow-1)] hidden md:block">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-full">
              <Clipboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-medium text-xl text-foreground">Clip-Board</span>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && sessionStart && (
              <SessionTimer startTime={sessionStart} />
            )}
            {isLoggedIn && !sessionId && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent rounded-full">
                <Cloud className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Synced</span>
              </div>
            )}
            <KeyboardShortcuts />
            {isLoggedIn && userId ? (
              <UserSettings userId={userId} />
            ) : (
              <ThemeToggle />
            )}
            <AuthButton />
          </div>
        </div>
      </header>
    </>
  );
};
