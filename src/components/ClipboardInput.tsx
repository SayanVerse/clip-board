import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Copy, FileUp, Code2, Type } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CodeEditor } from "./CodeEditor";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClipboardInputProps {
  sessionId: string;
  deviceName: string;
}

export const ClipboardInput = ({ sessionId, deviceName }: ClipboardInputProps) => {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState<"text" | "code">("text");
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({
    onCtrlV: async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          if (mode === "text") {
            setText(clipboardText);
          } else {
            setCode(clipboardText);
          }
          toast.success("Pasted from clipboard! Sending...");
          await sendContent(clipboardText, mode === "code" ? "code" : "text");
        }
      } catch (error) {
        console.error("Failed to read clipboard:", error);
        toast.error("Couldn't access clipboard. Please paste manually.");
      }
    },
    onEscape: () => {
      if (mode === "text") {
        setText("");
      } else {
        setCode("");
      }
      toast.info("Content cleared");
    },
    enabled: true,
  });

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (document.activeElement === textareaRef.current) return;
      
      const clipboardText = e.clipboardData?.getData("text");
      if (clipboardText && mode === "text") {
        setText(clipboardText);
        await sendText(clipboardText);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [sessionId, deviceName, mode]);

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

  const sendContent = async (content: string, contentType: "text" | "code" = "text") => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("clipboard_items")
        .insert({
          session_id: sessionId,
          content_type: contentType,
          content: content,
          device_name: deviceName,
          language: contentType === "code" ? language : null,
        });

      if (error) throw error;

      toast.success(contentType === "code" ? "Code sent!" : "Text sent!");
      if (contentType === "text") {
        setText("");
      } else {
        setCode("");
      }
      
      await supabase
        .from("sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error sending content:", error);
      toast.error("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const sendText = async (content?: string) => {
    await sendContent(content || text, "text");
  };

  const sendCode = async () => {
    await sendContent(code, "code");
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
    }
  };

  const copyToClipboard = async () => {
    const contentToCopy = mode === "text" ? text : code;
    if (!contentToCopy.trim()) return;
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "code")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-3xl glass p-1">
          <TabsTrigger value="text" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Type className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="code" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Code2 className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
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
                placeholder="Type or paste text... (Ctrl+V to auto-paste & send, Enter to send)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
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
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            onSend={sendCode}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        {mode === "text" ? (
          <>
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
          </>
        ) : (
          <motion.div 
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={sendCode}
              disabled={!code.trim() || isSending}
              className="w-full rounded-2xl h-12 shadow-lg"
            >
              <Code2 className="mr-2 h-4 w-4" />
              Send Code
            </Button>
          </motion.div>
        )}
        
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

      <p className="text-xs text-center text-muted-foreground/70">
        💡 Tip: Press <kbd className="px-2 py-0.5 rounded bg-muted text-xs">{mode === "code" ? "Ctrl+Enter" : "Enter"}</kbd> to send • <kbd className="px-2 py-0.5 rounded bg-muted text-xs">{mode === "code" ? "Enter" : "Shift+Enter"}</kbd> for new line • <kbd className="px-2 py-0.5 rounded bg-muted text-xs">Esc</kbd> to clear
      </p>
    </motion.div>
  );
};
