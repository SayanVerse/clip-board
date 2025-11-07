import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Link2, LogOut } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface SessionManagerProps {
  sessionId: string | null;
  sessionCode: string | null;
  onSessionChange: (sessionId: string | null, sessionCode: string | null) => void;
}

export const SessionManager = ({ sessionId, sessionCode, onSessionChange }: SessionManagerProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async () => {
    if (!joinCode || joinCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const { data: session, error } = await supabase
        .from("sessions")
        .select()
        .eq("session_code", joinCode)
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
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Session Code</h3>
            <p className="text-3xl font-bold text-primary tracking-wider">{sessionCode}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={leaveSession}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        {qrDataUrl && (
          <div className="mt-4 flex justify-center">
            <img src={qrDataUrl} alt="Session QR Code" className="rounded-lg border-2 border-border" />
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Share this code or QR code with other devices to sync clipboards
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Create New Session</h3>
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
          <h3 className="text-lg font-semibold mb-2">Join Existing Session</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 6-digit code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <Button 
              onClick={joinSession} 
              disabled={isLoading || joinCode.length !== 6}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Join
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
