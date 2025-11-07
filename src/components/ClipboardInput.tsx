import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Copy, FileUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClipboardInputProps {
  sessionId: string;
  deviceName: string;
}

export const ClipboardInput = ({ sessionId, deviceName }: ClipboardInputProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
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
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-3xl transition-all duration-300",
          isDragging && "ring-4 ring-primary/50 scale-[1.02]"
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl glass animate-bounce-in">
            <div className="text-center p-8">
              <FileUp className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-xl font-semibold text-primary">Drop file here</p>
              <p className="text-sm text-muted-foreground mt-2">Up to 20MB</p>
            </div>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type or paste text here... or drag & drop files"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[140px] resize-none pr-12 glass-hover border-2 transition-all duration-300 rounded-3xl"
          />
          {text && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 hover:scale-110 transition-transform"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={() => sendText()}
          disabled={!text.trim() || isSending}
          className="flex-1 rounded-2xl hover:scale-[1.02] transition-all duration-300 shadow-lg"
        >
          <Send className="mr-2 h-4 w-4" />
          Send Text
        </Button>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          variant="secondary"
          className="rounded-2xl hover:scale-[1.02] transition-all duration-300"
        >
          <Upload className="mr-2 h-4 w-4" />
          Send File
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>
    </div>
  );
};
