import { useState, useEffect } from "react";
import { SessionManager } from "@/components/SessionManager";
import { ClipboardInput } from "@/components/ClipboardInput";
import { ClipboardHistory } from "@/components/ClipboardHistory";
import { Clipboard } from "lucide-react";

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
  }, []);

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-elevated">
              <Clipboard className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            CopyPaste Server
          </h1>
          <p className="text-muted-foreground text-lg">
            Share clipboard across devices instantly
          </p>
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
          <div className="mt-12 text-center space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-accent">
                <h3 className="font-semibold text-accent-foreground mb-2">🔒 Secure</h3>
                <p className="text-muted-foreground">
                  Sessions expire after 24h of inactivity
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <h3 className="font-semibold text-accent-foreground mb-2">⚡ Fast</h3>
                <p className="text-muted-foreground">
                  Real-time sync across all devices
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent">
                <h3 className="font-semibold text-accent-foreground mb-2">📱 Universal</h3>
                <p className="text-muted-foreground">
                  Works on mobile, tablet, and desktop
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
