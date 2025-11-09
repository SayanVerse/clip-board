import { useState, useEffect } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { Clipboard } from "lucide-react";
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    
    if (codeParam) {
      setSessionCode(codeParam);
    }
    
    const storedSessionId = localStorage.getItem("clipboard_session_id");
    const storedSessionCode = localStorage.getItem("clipboard_session_code");
    
    if (storedSessionId && storedSessionCode) {
      setSessionId(storedSessionId);
      setSessionCode(storedSessionCode);
    }

    // Auto-exit session on window close
    const handleBeforeUnload = () => {
      if (sessionId) {
        localStorage.removeItem("clipboard_session_id");
        localStorage.removeItem("clipboard_session_code");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId]);

  const handleSessionChange = (newSessionId: string | null, newSessionCode: string | null) => {
    setSessionId(newSessionId);
    setSessionCode(newSessionCode);
    
    if (newSessionId && newSessionCode) {
      localStorage.setItem("clipboard_session_id", newSessionId);
      localStorage.setItem("clipboard_session_code", newSessionCode);
    } else {
      localStorage.removeItem("clipboard_session_id");
      localStorage.removeItem("clipboard_session_code");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container max-w-4xl mx-auto px-4 py-6 md:py-8 flex-1">
        <motion.div 
          className="absolute top-6 right-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ThemeToggle />
        </motion.div>
        
        <header className="text-center mb-8 md:mb-16">
          <motion.div 
            className="flex items-center justify-center gap-3 mb-4 md:mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          >
            <motion.div 
              className="p-3 md:p-4 bg-gradient-primary rounded-2xl md:rounded-3xl shadow-elevated"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Clipboard className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
            </motion.div>
          </motion.div>
          <motion.h1 
            className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 bg-gradient-primary bg-clip-text text-transparent px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            CopyPaste Server
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-base md:text-xl font-medium px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Share clipboard across devices instantly
          </motion.p>
        </header>

        <div className="space-y-6">
          <SessionManager
            sessionId={sessionId}
            sessionCode={sessionCode}
            onSessionChange={handleSessionChange}
          />

          {sessionId && (
            <>
              <ClipboardInput sessionId={sessionId} deviceName={deviceName} />
              <ClipboardHistory sessionId={sessionId} />
            </>
          )}
        </div>

        {!sessionId && (
          <motion.div 
            className="mt-8 md:mt-16 text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { icon: "🔒", title: "Secure", desc: "Sessions expire after 24h of inactivity" },
                { icon: "⚡", title: "Fast", desc: "Real-time sync across all devices" },
                { icon: "📱", title: "Universal", desc: "Works on mobile, tablet, and desktop" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl glass-hover transition-all duration-300">
                    <h3 className="text-xl md:text-2xl font-bold text-accent-foreground mb-2 md:mb-3">
                      {feature.icon} {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Index;
