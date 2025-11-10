import { useState, useEffect, useCallback } from "react";
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
    
    // Check if session expired (1 hour = 3600000ms)
    if (storedSessionId && storedSessionCode && sessionStartTime) {
      const timeElapsed = Date.now() - parseInt(sessionStartTime);
      if (timeElapsed < 3600000) {
        setSessionId(storedSessionId);
        setSessionCode(storedSessionCode);
      } else {
        // Session expired, clear storage
        localStorage.removeItem("clipboard_session_id");
        localStorage.removeItem("clipboard_session_code");
        localStorage.removeItem("clipboard_session_start");
      }
    }

    // Auto-exit session on window close/refresh
    const handleBeforeUnload = () => {
      localStorage.removeItem("clipboard_session_id");
      localStorage.removeItem("clipboard_session_code");
      localStorage.removeItem("clipboard_session_start");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-exit after 1 hour
  useEffect(() => {
    if (!sessionId) return;

    const sessionStartTime = localStorage.getItem("clipboard_session_start");
    if (!sessionStartTime) {
      localStorage.setItem("clipboard_session_start", Date.now().toString());
    }

    // Check every minute if session has expired
    const checkInterval = setInterval(() => {
      const startTime = localStorage.getItem("clipboard_session_start");
      if (startTime) {
        const timeElapsed = Date.now() - parseInt(startTime);
        if (timeElapsed >= 3600000) {
          // 1 hour passed, exit session
          handleSessionChange(null, null);
          localStorage.removeItem("clipboard_session_start");
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [sessionId, handleSessionChange]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-glow/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1 relative z-10">
        <motion.div 
          className="absolute top-6 right-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ThemeToggle />
        </motion.div>
        
        <header className="text-center mb-8 md:mb-12">
          <motion.div 
            className="flex items-center justify-center gap-4 mb-6"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 120 }}
          >
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-primary rounded-3xl blur-xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative p-4 md:p-5 bg-gradient-primary rounded-3xl shadow-elevated">
                <Clipboard className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4 bg-gradient-primary bg-clip-text text-transparent px-4">
              CopyPaste Server
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.div
                className="h-1 w-12 md:w-20 bg-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
              <motion.div
                className="h-1 w-1 bg-primary rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              />
              <motion.div
                className="h-1 w-12 md:w-20 bg-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>
            <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl font-medium px-4 max-w-2xl mx-auto">
              Share clipboard across devices instantly with real-time sync
            </p>
          </motion.div>
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
            className="mt-8 md:mt-12 space-y-8 md:space-y-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { 
                  icon: "🔒", 
                  title: "Secure", 
                  desc: "Sessions expire after 24h of inactivity",
                  color: "from-green-500/10 to-emerald-500/10"
                },
                { 
                  icon: "⚡", 
                  title: "Fast", 
                  desc: "Real-time sync across all devices",
                  color: "from-yellow-500/10 to-orange-500/10"
                },
                { 
                  icon: "📱", 
                  title: "Universal", 
                  desc: "Works on mobile, tablet, and desktop",
                  color: "from-blue-500/10 to-cyan-500/10"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.8 + index * 0.15,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className={`relative p-6 md:p-8 rounded-3xl glass-hover transition-all duration-300 h-full overflow-hidden group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <motion.div 
                        className="text-4xl md:text-5xl mb-4"
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground font-medium">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* How it works section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
              className="text-center space-y-6"
            >
              <h2 className="text-2xl md:text-3xl font-bold">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {[
                  { step: "1", title: "Create Session", desc: "Generate a unique 6-digit code" },
                  { step: "2", title: "Join Devices", desc: "Enter code or scan QR on other devices" },
                  { step: "3", title: "Share Content", desc: "Copy text, code, or upload files" },
                  { step: "4", title: "Sync Instantly", desc: "Access from any connected device" }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.4 + index * 0.1,
                      type: "spring"
                    }}
                    className="relative"
                  >
                    <div className="p-4 rounded-2xl glass-hover">
                      <motion.div 
                        className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        {item.step}
                      </motion.div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-primary" />
                    )}
                  </motion.div>
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
