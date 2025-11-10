import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Link2, LogOut, Camera } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
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
      QRCode.toDataURL(url, { width: 200, margin: 2 })
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
      toast.success(`Session created! Code: ${session.session_code}`);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00b8d4', '#0097a7', '#00acc1'],
      });
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
      toast.success("Joined session successfully!");
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00b8d4', '#0097a7', '#00acc1'],
      });
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      >
        <Card className="p-6 glass rounded-3xl shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Session Code</h3>
              <motion.p 
                className="text-4xl font-bold text-primary tracking-wider"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 15
                }}
              >
                {sessionCode}
              </motion.p>
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={leaveSession}
                className="rounded-2xl"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
          <AnimatePresence>
            {qrDataUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mt-6 flex justify-center"
              >
                <div className="p-4 glass rounded-3xl">
                  <img src={qrDataUrl} alt="Session QR Code" className="rounded-2xl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Share this code or QR code with other devices to sync clipboards
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <Card className="p-8 glass rounded-3xl shadow-elevated">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Create New Session</h3>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={createSession} 
                disabled={isLoading}
                className="w-full rounded-2xl h-12 shadow-lg"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Generate Session Code
              </Button>
            </motion.div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-border/50" />
            </div>
            <div className="relative flex justify-center text-sm uppercase font-medium">
              <span className="glass px-4 py-1 rounded-full text-muted-foreground">Or</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Join Existing Session</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="000000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-bold rounded-2xl h-12 glass-hover border-2"
              />
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => setShowScanner(true)} 
                    variant="outline"
                    className="rounded-2xl h-12 px-6"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => joinSession()} 
                    disabled={isLoading || joinCode.length !== 6}
                    className="rounded-2xl h-12 px-6"
                  >
                    <Link2 className="mr-2 h-5 w-5" />
                    Join
                  </Button>
                </motion.div>
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
