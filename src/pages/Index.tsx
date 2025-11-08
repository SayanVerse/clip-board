import { useState, useEffect } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { Clipboard, Zap, Shield, Smartphone } from "lucide-react";
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

    // Auto-exit session when window is closed
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
      <div className="container max-w-5xl mx-auto px-4 py-6 md:py-8 flex-1">
        <motion.div 
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ThemeToggle />
        </motion.div>
        
        <header className="text-center mb-12 md:mb-16">
          <motion.div 
            className="flex items-center justify-center gap-3 mb-6"
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
            className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent px-4"
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
            className="mt-12 md:mt-16 text-center space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: Shield, title: "Secure", desc: "Sessions expire after 24h of inactivity", color: "text-green-500" },
                { icon: Zap, title: "Fast", desc: "Real-time sync across all devices", color: "text-yellow-500" },
                { icon: Smartphone, title: "Universal", desc: "Works on mobile, tablet, and desktop", color: "text-blue-500" }
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
                    <motion.div 
                      className={`mb-4 ${feature.color}`}
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="h-10 w-10 md:h-12 md:w-12 mx-auto" />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base">
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
