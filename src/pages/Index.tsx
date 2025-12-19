import { useState, useEffect, useCallback } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { SessionTimer } from "@/components/SessionTimer";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/hooks/useAuth";
import { Clipboard, Shield, Zap, Monitor, ArrowRight, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const getDeviceName = () => {
  const userAgent = navigator.userAgent;
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    return `Mobile (${/iPhone/.test(userAgent) ? "iOS" : "Android"})`;
  }
  return "Desktop";
};

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [deviceName] = useState(getDeviceName());
  const [urlCode, setUrlCode] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();

  const handleSessionChange = useCallback((newSessionId: string | null, newSessionCode: string | null) => {
    setSessionId(newSessionId);
    setSessionCode(newSessionCode);
    
    if (newSessionId && newSessionCode) {
      const startTime = Date.now();
      setSessionStart(startTime);
      localStorage.setItem("clipboard_session_id", newSessionId);
      localStorage.setItem("clipboard_session_code", newSessionCode);
      localStorage.setItem("clipboard_session_start", startTime.toString());
    } else {
      setSessionStart(null);
      localStorage.removeItem("clipboard_session_id");
      localStorage.removeItem("clipboard_session_code");
      localStorage.removeItem("clipboard_session_start");
    }
  }, []);

  useEffect(() => {
    // Check URL for session code
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    
    if (codeParam && codeParam.length === 4) {
      setUrlCode(codeParam);
      return; // Don't restore from localStorage if we have a URL code
    }
    
    // Restore session from localStorage
    const storedSessionId = localStorage.getItem("clipboard_session_id");
    const storedSessionCode = localStorage.getItem("clipboard_session_code");
    const sessionStartTime = localStorage.getItem("clipboard_session_start");
    
    if (storedSessionId && storedSessionCode && sessionStartTime) {
      const startTime = parseInt(sessionStartTime);
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed < 7200000) {
        setSessionId(storedSessionId);
        setSessionCode(storedSessionCode);
        setSessionStart(startTime);
      } else {
        localStorage.removeItem("clipboard_session_id");
        localStorage.removeItem("clipboard_session_code");
        localStorage.removeItem("clipboard_session_start");
      }
    }

    const handleBeforeUnload = () => {
      localStorage.removeItem("clipboard_session_id");
      localStorage.removeItem("clipboard_session_code");
      localStorage.removeItem("clipboard_session_start");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const checkInterval = setInterval(() => {
      const startTime = localStorage.getItem("clipboard_session_start");
      if (startTime) {
        const timeElapsed = Date.now() - parseInt(startTime);
        if (timeElapsed >= 7200000) {
          handleSessionChange(null, null);
        }
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [sessionId, handleSessionChange]);

  // Check if user is logged in - they get auto-sync mode
  const isLoggedIn = !!user && !authLoading;
  const hasActiveSession = isLoggedIn || !!sessionId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-lg">
              <Clipboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Clip-Board</span>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && sessionStart && (
              <SessionTimer startTime={sessionStart} />
            )}
            {isLoggedIn && !sessionId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
                <Cloud className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Synced</span>
              </div>
            )}
            <KeyboardShortcuts />
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!hasActiveSession ? (
          // Landing view
          <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Share clipboard
                <span className="text-primary"> instantly</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {isLoggedIn 
                  ? "Sign in with Google to sync across all your devices automatically."
                  : "Sync text, code, and files across all your devices with a simple 4-digit code."}
              </p>
              
              <div className="max-w-md mx-auto">
                <SessionManager
                  sessionId={sessionId}
                  sessionCode={sessionCode}
                  onSessionChange={handleSessionChange}
                  initialCode={urlCode}
                />
              </div>
            </motion.div>

            {/* Features */}
            <motion.div 
              className="grid md:grid-cols-3 gap-6 mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {[
                { icon: Shield, title: "Secure", desc: "End-to-end encryption, auto-expiring sessions" },
                { icon: Zap, title: "Instant", desc: "Real-time sync with sub-second latency" },
                { icon: Monitor, title: "Universal", desc: "Works on any device with a browser" },
              ].map((feature) => (
                <div key={feature.title} className="p-6 rounded-xl border border-border bg-card">
                  <feature.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-center mb-8">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { step: "1", title: "Create", desc: "Generate a session" },
                  { step: "2", title: "Share", desc: "Send the code" },
                  { step: "3", title: "Sync", desc: "Start sharing" },
                ].map((item, index, arr) => (
                  <div key={item.step} className="relative flex flex-col items-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3 mx-auto">
                        {item.step}
                      </div>
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground absolute -right-6 top-5 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          // Active session view - Two column layout
          <div className="container max-w-6xl mx-auto px-4 py-6">
            {isLoggedIn && !sessionId ? (
              // Logged-in user auto-sync mode
              <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Cloud className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Auto-Sync Mode</p>
                        <p className="text-xs text-muted-foreground">Synced across all your devices</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All clipboard items are automatically synced to devices where you're signed in with the same Google account.
                    </p>
                  </div>
                  <ClipboardInput sessionId={null} deviceName={deviceName} userId={user?.id} />
                </div>
                
                <div>
                  <ClipboardHistory sessionId={null} userId={user?.id} />
                </div>
              </div>
            ) : (
              // Session-based mode
              <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                <div className="space-y-6">
                  <SessionManager
                    sessionId={sessionId}
                    sessionCode={sessionCode}
                    onSessionChange={handleSessionChange}
                  />
                  <ClipboardInput sessionId={sessionId!} deviceName={deviceName} />
                </div>
                
                <div>
                  <ClipboardHistory sessionId={sessionId!} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Clip-Board</span>
          <span className="hidden sm:inline">·</span>
          <a href="/contact" className="hover:text-foreground transition-colors">Contact Developer</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
