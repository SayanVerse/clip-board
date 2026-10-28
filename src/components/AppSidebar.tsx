import { NavLink, useLocation } from "react-router-dom";
import { Clipboard, Home, Mail, Cloud, CircleDashed, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { AuthButton } from "@/components/AuthButton";
import { UserSettings } from "@/components/UserSettings";
import { SessionTimer } from "@/components/SessionTimer";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  sessionId: string | null;
  sessionCode: string | null;
  sessionStart: number | null;
  isLoggedIn: boolean;
  userId?: string;
}

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Contact", url: "/contact", icon: Mail },
];

export const AppSidebar = ({ sessionId, sessionCode, sessionStart, isLoggedIn, userId }: AppSidebarProps) => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Clipboard className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">SyncHub</span>
      </div>

      {/* Session status */}
      <div className="px-5 py-5 border-b border-border">
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
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
      <div className="border-t border-border px-3 py-3 space-y-3">
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
    </aside>
  );
};
