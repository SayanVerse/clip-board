import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Link2, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { QRScanner } from "./QRScanner";

interface SessionManagerProps {
  sessionId: string | null;
  sessionCode: string | null;
  onSessionChange: (sessionId: string | null, sessionCode: string | null) => void;
}

export const SessionManager = ({ sessionId, sessionCode, onSessionChange }: SessionManagerProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (sessionCode) {
      const url = `${window.location.origin}?code=${sessionCode}`;
      QRCode.toDataURL(url, { width: 180, margin: 2 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [sessionCode]);

  const createSession = async () => {
    setIsLoading(true);
    try {
      const code = await supabase.rpc("generate_session_code");
      
      if (code.error) throw code.error;

      const { data: session, error } = await supabase
        .from("sessions")
        .insert({ session_code: code.data })
        .select()
        .single();

      if (error) throw error;

      onSessionChange(session.id, session.session_code);
      toast.success(`Session created: ${session.session_code}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async (codeToJoin?: string) => {
    const code = codeToJoin || joinCode;
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const { data: session, error } = await supabase
        .from("sessions")
        .select()
        .eq("session_code", code)
        .single();

      if (error || !session) {
        toast.error("Invalid session code");
        return;
      }

      if (new Date(session.expires_at) < new Date()) {
        toast.error("This session has expired");
        return;
      }

      onSessionChange(session.id, session.session_code);
      toast.success("Joined session successfully");
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
    } finally {
      setIsLoading(false);
    }
  };

  const leaveSession = () => {
    onSessionChange(null, null);
    setQrDataUrl(null);
    toast.info("Left session");
  };

  if (sessionId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session Code</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-primary">
                {sessionCode}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={leaveSession}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          <AnimatePresence>
            {qrDataUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center pt-4 border-t border-border"
              >
                <div className="p-3 bg-white rounded-lg">
                  <img src={qrDataUrl} alt="Session QR Code" className="w-[140px] h-[140px]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Share this code or scan QR to sync devices
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 border border-border">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Create New Session</h3>
            <Button 
              onClick={createSession} 
              disabled={isLoading}
              className="w-full"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Generate Session Code
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Join Existing Session</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="000000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-xl tracking-[0.5em] font-mono"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowScanner(true)} 
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scan
                </Button>
                <Button 
                  onClick={() => joinSession()} 
                  disabled={isLoading || joinCode.length !== 6}
                  className="flex-1 sm:flex-none"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Join
                </Button>
              </div>
            </div>
          </div>
          
          <QRScanner 
            open={showScanner} 
            onClose={() => setShowScanner(false)}
            onScan={(code) => {
              setShowScanner(false);
              joinSession(code);
            }}
          />
        </div>
      </Card>
    </motion.div>
  );
};
