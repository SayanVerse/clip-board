import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Copy, FileUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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
      triggerConfetti();
      
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

  const triggerConfetti = () => {
    const count = 100;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
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
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
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
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl glass"
            >
              <div className="text-center p-8">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  }}
                >
                  <FileUp className="h-16 w-16 text-primary mx-auto mb-4" />
                </motion.div>
                <p className="text-xl font-semibold text-primary">Drop file here</p>
                <p className="text-sm text-muted-foreground mt-2">Up to 20MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type or paste text here... or drag & drop files"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[140px] resize-none pr-12 glass-hover border-2 transition-all duration-300 rounded-3xl"
          />
          {text && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 rounded-2xl"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="flex gap-3">
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => sendText()}
            disabled={!text.trim() || isSending}
            className="w-full rounded-2xl h-12 shadow-lg"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Text
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            variant="secondary"
            className="rounded-2xl h-12 px-6"
          >
            <Upload className="mr-2 h-4 w-4" />
            Send File
          </Button>
        </motion.div>
        
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
    </motion.div>
  );
};
