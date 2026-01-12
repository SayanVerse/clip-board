import { useState, useEffect, useCallback } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { MobileNav } from "@/components/MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { SessionTimer } from "@/components/SessionTimer";
import { AuthButton } from "@/components/AuthButton";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import { Clipboard, Shield, Zap, Monitor, ArrowRight, Cloud, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      
      {/* Mobile & Desktop Header */}
      <MobileNav 
        sessionId={sessionId} 
        sessionStart={sessionStart} 
        isLoggedIn={isLoggedIn} 
      />

      <main className="flex-1">
        {!hasActiveSession ? (
          // Landing view
          <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
            <motion.div 
              className="text-center max-w-2xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">AI-Powered Code Detection</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
                Share clipboard
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"> instantly</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                {isLoggedIn 
                  ? "Sign in with Google to sync across all your devices automatically."
                  : "Sync text, code, and files across all your devices with a simple 4-digit code."}
              </p>
              
              <div className="max-w-md mx-auto">
                <div className="glass rounded-2xl p-6">
                  <SessionManager
                    sessionId={sessionId}
                    sessionCode={sessionCode}
                    onSessionChange={handleSessionChange}
                    initialCode={urlCode}
                  />
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div 
              className="grid md:grid-cols-3 gap-5 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {[
                { icon: Shield, title: "Secure & Private", desc: "Auto-expiring sessions with secure data handling" },
                { icon: Zap, title: "Real-time Sync", desc: "Instant sync with sub-second latency across devices" },
                { icon: Monitor, title: "Works Everywhere", desc: "Universal compatibility with any modern browser" },
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title} 
                  className="group p-6 rounded-2xl glass glass-hover cursor-default"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-center mb-10">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                {[
                  { step: "1", title: "Create Session", desc: "Generate a unique 4-digit code" },
                  { step: "2", title: "Share Code", desc: "Send the code to your other devices" },
                  { step: "3", title: "Start Syncing", desc: "Copy and paste across devices instantly" },
                ].map((item, index, arr) => (
                  <div key={item.step} className="relative flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-primary/20">
                      {item.step}
                    </div>
                    <h4 className="font-semibold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    {index < arr.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50 absolute -right-4 top-5 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          // Active session view - Professional two column layout
          <div className="container max-w-7xl mx-auto px-4 py-6 lg:py-8">
            {isLoggedIn && !sessionId ? (
              // Logged-in user auto-sync mode
              <div className="grid lg:grid-cols-[420px_1fr] gap-6">
                {/* Left Panel */}
                <div className="space-y-5">
                  {/* Auto-Sync Status Card */}
                  <motion.div 
                    className="glass rounded-2xl p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/10">
                        <Cloud className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Auto-Sync Mode</p>
                        <p className="text-xs text-muted-foreground">Synced across all your devices</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      All clipboard items are automatically synced to devices where you're signed in. Items older than 7 days are automatically cleaned up.
                    </p>
                    <SessionManager
                      sessionId={sessionId}
                      sessionCode={sessionCode}
                      onSessionChange={handleSessionChange}
                      showCreateOnly
                      showJoinOption
                    />
                  </motion.div>
                  
                  {/* Input Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <ClipboardInput sessionId={sessionId} deviceName={deviceName} userId={user?.id} />
                  </motion.div>
                </div>
                
                {/* Right Panel - History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <ClipboardHistory sessionId={sessionId} userId={user?.id} />
                </motion.div>
              </div>
            ) : (
              // Session-based mode
              <div className="grid lg:grid-cols-[420px_1fr] gap-6">
                {/* Left Panel */}
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SessionManager
                      sessionId={sessionId}
                      sessionCode={sessionCode}
                      onSessionChange={handleSessionChange}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <ClipboardInput sessionId={sessionId!} deviceName={deviceName} />
                  </motion.div>
                </div>
                
                {/* Right Panel - History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <ClipboardHistory sessionId={sessionId!} />
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-5 mt-auto backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Clip-Board</span>
          <span className="hidden sm:inline text-muted-foreground/40">·</span>
          <a href="/contact" className="hover:text-foreground transition-colors">Contact Developer</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;