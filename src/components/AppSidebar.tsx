import { NavLink, useLocation } from "react-router-dom";
import { Clipboard, Home, Mail, Cloud, CircleDashed, Sparkles, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { AuthButton } from "@/components/AuthButton";
import { UserSettings } from "@/components/UserSettings";
import { SessionTimer } from "@/components/SessionTimer";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  sessionId: string | null;
  sessionCode: string | null;
  sessionStart: number | null;
  isLoggedIn: boolean;
  userId?: string;
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Contact", url: "/contact", icon: Mail },
];

export const AppSidebar = ({ sessionId, sessionCode, sessionStart, isLoggedIn, userId, open, onClose }: AppSidebarProps) => {
  const { pathname } = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-[var(--shadow-3)] flex"
            role="dialog"
            aria-label="Main menu"
          >
            {/* Brand */}
            <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Clipboard className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight text-foreground truncate">SyncHub</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Session status */}
            <div className="px-5 py-5 border-b border-border shrink-0">
              {sessionId && sessionStart ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-primary animate-soft-pulse" />
                    <span className="font-medium text-foreground">Session active</span>
                  </div>
                  {sessionCode && (
                    <div className="font-mono text-xl font-semibold tracking-[0.35em] text-foreground">
                      {sessionCode}
                    </div>
                  )}
                  <SessionTimer startTime={sessionStart} />
                </div>
              ) : isLoggedIn ? (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Cloud synced</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleDashed className="h-4 w-4" />
                  <span>Not connected</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin min-h-0">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Menu
              </p>
              {navItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                      active && "bg-accent text-foreground font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-border px-3 py-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">Shortcuts</span>
                <KeyboardShortcuts />
              </div>
              {isLoggedIn && userId && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground">Settings</span>
                  <UserSettings userId={userId} />
                </div>
              )}
              <div className="pt-1">
                <AuthButton />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
