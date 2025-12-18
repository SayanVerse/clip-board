import { useState, useEffect, useCallback } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { Clipboard, Shield, Zap, Monitor } from "lucide-react";
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
  const [deviceName] = useState(getDeviceName());

  const handleSessionChange = useCallback((newSessionId: string | null, newSessionCode: string | null) => {
    setSessionId(newSessionId);
    setSessionCode(newSessionCode);
    
    if (newSessionId && newSessionCode) {
      localStorage.setItem("clipboard_session_id", newSessionId);
      localStorage.setItem("clipboard_session_code", newSessionCode);
      localStorage.setItem("clipboard_session_start", Date.now().toString());
    } else {
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
      const timeElapsed = Date.now() - parseInt(sessionStartTime);
      if (timeElapsed < 3600000) {
        setSessionId(storedSessionId);
        setSessionCode(storedSessionCode);
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

    const sessionStartTime = localStorage.getItem("clipboard_session_start");
    if (!sessionStartTime) {
      localStorage.setItem("clipboard_session_start", Date.now().toString());
    }

    const checkInterval = setInterval(() => {
      const startTime = localStorage.getItem("clipboard_session_start");
      if (startTime) {
        const timeElapsed = Date.now() - parseInt(startTime);
        if (timeElapsed >= 3600000) {
          handleSessionChange(null, null);
          localStorage.removeItem("clipboard_session_start");
        }
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [sessionId, handleSessionChange]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1">
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <ThemeToggle />
        </div>
        
        <header className="text-center mb-10 md:mb-14">
          <motion.div 
            className="inline-flex items-center justify-center p-3 bg-primary rounded-xl mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Clipboard className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            CopyPaste Server
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-base md:text-lg max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Share clipboard content across devices with real-time sync
          </motion.p>
        </header>

        <div className="space-y-6">
          <SessionManager
            sessionId={sessionId}
            sessionCode={sessionCode}
            onSessionChange={handleSessionChange}
          />

          {sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <ClipboardInput sessionId={sessionId} deviceName={deviceName} />
              <ClipboardHistory sessionId={sessionId} />
            </motion.div>
          )}
        </div>

        {!sessionId && (
          <motion.div 
            className="mt-16 md:mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Shield, 
                  title: "Secure", 
                  desc: "Sessions auto-expire after 24h of inactivity"
                },
                { 
                  icon: Zap, 
                  title: "Fast", 
                  desc: "Real-time sync across all your devices"
                },
                { 
                  icon: Monitor, 
                  title: "Universal", 
                  desc: "Works on mobile, tablet, and desktop"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="mt-12 text-center"
            >
              <h2 className="text-xl font-semibold mb-8">How It Works</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[
                  { step: "1", title: "Create Session", desc: "Generate a 6-digit code" },
                  { step: "2", title: "Join Devices", desc: "Enter code or scan QR" },
                  { step: "3", title: "Share Content", desc: "Copy text or files" },
                  { step: "4", title: "Sync Instantly", desc: "Access anywhere" }
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      {item.step}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Index;
