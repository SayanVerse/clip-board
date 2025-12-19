import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Link2, LogOut, Camera, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { QRScanner } from "./QRScanner";
import { FancyQRCode } from "./FancyQRCode";
import { feedback } from "@/hooks/useFeedback";

interface SessionManagerProps {
  sessionId: string | null;
  sessionCode: string | null;
  onSessionChange: (sessionId: string | null, sessionCode: string | null) => void;
  initialCode?: string | null;
}

export const SessionManager = ({ sessionId, sessionCode, onSessionChange, initialCode }: SessionManagerProps) => {
  const [joinCode, setJoinCode] = useState(initialCode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Auto-join when initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.length === 4 && !sessionId) {
      joinSession(initialCode);
      // Clear the URL parameter after joining
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [initialCode, sessionId]);

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
      feedback.success();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
      feedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async (codeToJoin?: string) => {
    const code = codeToJoin || joinCode;
    if (!code || code.length !== 4) {
      toast.error("Please enter a valid 4-digit code");
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
        feedback.error();
        return;
      }

      if (new Date(session.expires_at) < new Date()) {
        toast.error("This session has expired");
        feedback.error();
        return;
      }

      onSessionChange(session.id, session.session_code);
      toast.success("Joined session");
      feedback.success();
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
      feedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const leaveSession = () => {
    onSessionChange(null, null);
    toast.info("Left session");
  };

  const copyCode = async () => {
    if (!sessionCode) return;
    try {
      await navigator.clipboard.writeText(sessionCode);
      toast.success("Code copied");
      feedback.copy();
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareLink = async () => {
    if (!sessionCode) return;
    const url = `${window.location.origin}?code=${sessionCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Clip-Board Session", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
      feedback.copy();
    } catch {
      toast.error("Failed to share");
    }
  };

  if (sessionId) {
    const qrUrl = `${window.location.origin}?code=${sessionCode}`;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Session Code</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {sessionCode}
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7"
                  onClick={copyCode}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7"
                  onClick={shareLink}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={leaveSession}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <AnimatePresence>
            {sessionCode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center pt-3 border-t border-border"
              >
                <FancyQRCode value={qrUrl} size={140} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Share code or scan QR to sync
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
      <Card className="p-5 border border-border">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-medium mb-2">Create Session</h3>
            <Button 
              onClick={createSession} 
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Generate Code
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or join</span>
            </div>
          </div>

          <div>
            <div className="flex gap-2">
              <Input
                placeholder="0000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="text-center text-lg tracking-[0.5em] font-mono h-9"
              />
              <Button 
                onClick={() => setShowScanner(true)} 
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={() => joinSession()} 
              disabled={isLoading || joinCode.length !== 4}
              className="w-full mt-2"
              size="sm"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Join Session
            </Button>
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
