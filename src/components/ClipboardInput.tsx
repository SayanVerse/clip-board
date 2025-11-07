import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Copy } from "lucide-react";
import { toast } from "sonner";

interface ClipboardInputProps {
  sessionId: string;
  deviceName: string;
}

export const ClipboardInput = ({ sessionId, deviceName }: ClipboardInputProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (document.activeElement === textareaRef.current) return;
      
      const clipboardText = e.clipboardData?.getData("text");
      if (clipboardText) {
        setText(clipboardText);
        await sendText(clipboardText);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [sessionId, deviceName]);

  const sendText = async (content?: string) => {
    const textToSend = content || text;
    if (!textToSend.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("clipboard_items")
        .insert({
          session_id: sessionId,
          content_type: "text",
          content: textToSend,
          device_name: deviceName,
        });

      if (error) throw error;

      toast.success("Text sent!");
      setText("");
      
      await supabase
        .from("sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error sending text:", error);
      toast.error("Failed to send text");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }

    setIsSending(true);
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${sessionId}/${timestamp}_${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("clipboard-files")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("clipboard-files")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("clipboard_items")
        .insert({
          session_id: sessionId,
          content_type: "file",
          file_name: file.name,
          file_url: publicUrl,
          device_name: deviceName,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      toast.success("File sent!");
      
      await supabase
        .from("sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async () => {
    if (!text.trim()) return;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Type or paste text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px] resize-none pr-12"
        />
        {text && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => sendText()}
          disabled={!text.trim() || isSending}
          className="flex-1"
        >
          <Send className="mr-2 h-4 w-4" />
          Send Text
        </Button>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          variant="secondary"
        >
          <Upload className="mr-2 h-4 w-4" />
          Send File
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};
