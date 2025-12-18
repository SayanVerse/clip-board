import { useState, useEffect, useCallback } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { SessionTimer } from "@/components/SessionTimer";
import { Clipboard, Shield, Zap, Monitor, ArrowRight } from "lucide-react";
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
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    
    if (codeParam) {
      setSessionCode(codeParam);
    }
    
    const storedSessionId = localStorage.getItem("clipboard_session_id");
    const storedSessionCode = localStorage.getItem("clipboard_session_code");
    const sessionStartTime = localStorage.getItem("clipboard_session_start");
    
    if (storedSessionId && storedSessionCode && sessionStartTime) {
      const startTime = parseInt(sessionStartTime);
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed < 3600000) {
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
        if (timeElapsed >= 3600000) {
          handleSessionChange(null, null);
        }
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [sessionId, handleSessionChange]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-lg">
              <Clipboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">CopyPaste</span>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && sessionStart && (
              <SessionTimer startTime={sessionStart} />
            )}
            <KeyboardShortcuts />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!sessionId ? (
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
                Sync text, code, and files across all your devices with a simple 6-digit code.
              </p>
              
              <div className="max-w-md mx-auto">
                <SessionManager
                  sessionId={sessionId}
                  sessionCode={sessionCode}
                  onSessionChange={handleSessionChange}
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
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                {[
                  { step: "1", title: "Create", desc: "Generate a session" },
                  { step: "2", title: "Share", desc: "Send the code" },
                  { step: "3", title: "Sync", desc: "Start sharing" },
                ].map((item, index, arr) => (
                  <div key={item.step} className="flex items-center gap-4 md:gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-2">
                        {item.step}
                      </div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          // Active session view - Two column layout
          <div className="container max-w-6xl mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-[380px_1fr] gap-6">
              {/* Left sidebar */}
              <div className="space-y-6">
                <SessionManager
                  sessionId={sessionId}
                  sessionCode={sessionCode}
                  onSessionChange={handleSessionChange}
                />
                <ClipboardInput sessionId={sessionId} deviceName={deviceName} />
              </div>
              
              {/* Right content */}
              <div>
                <ClipboardHistory sessionId={sessionId} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CopyPaste Server · Sessions expire after 1 hour
        </div>
      </footer>
    </div>
  );
};

export default Index;
