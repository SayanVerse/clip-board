import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Copy, Code2, Type, FileUp, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CodeEditor } from "./CodeEditor";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { feedback } from "@/hooks/useFeedback";
import { UploadProgress } from "./UploadProgress";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";

interface ClipboardInputProps {
  sessionId: string | null;
  deviceName: string;
  userId?: string;
}

export const ClipboardInput = ({ sessionId, deviceName, userId }: ClipboardInputProps) => {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState<"text" | "code">("text");
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // AI-powered language detection
  const { 
    language: detectedLanguage, 
    isCode: codeDetected, 
    isDetecting,
    detectWithDebounce 
  } = useLanguageDetection();

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
          toast.success("Pasted from clipboard");
          await sendContent(clipboardText, mode === "code" ? "code" : "text");
        }
      } catch (error) {
        console.error("Failed to read clipboard:", error);
        toast.error("Couldn't access clipboard");
        feedback.error();
      }
    },
    onEscape: () => {
      if (mode === "text") {
        setText("");
      } else {
        setCode("");
      }
      toast.info("Cleared");
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
  }, [sessionId, userId, deviceName, mode]);

  // Trigger AI detection when code changes in code mode (auto-detect by default)
  useEffect(() => {
    if (mode === "code" && code.length > 30) {
      detectWithDebounce(code, 1000);
    }
  }, [code, mode, detectWithDebounce]);

  // Auto-update language when AI detects it in code mode
  useEffect(() => {
    if (mode === "code" && detectedLanguage && detectedLanguage !== "plaintext") {
      setLanguage(detectedLanguage);
    }
  }, [detectedLanguage, mode]);

  const sendContent = async (content: string, contentType: "text" | "code" = "text", detectedLang?: string) => {
    if (!content.trim()) return;
    if (!sessionId && !userId) {
      toast.error("No active session");
      return;
    }

    setIsSending(true);
    try {
      const langToUse = contentType === "code" ? (detectedLang || language) : null;
      
      const { error } = await supabase
        .from("clipboard_items")
        .insert({
          content_type: contentType,
          content: content,
          device_name: deviceName,
          language: langToUse,
          user_id: userId || undefined,
          session_id: sessionId || undefined,
        });

      if (error) throw error;

      toast.success(contentType === "code" ? `Code sent (${langToUse})` : "Text sent");
      feedback.send();
      
      if (contentType === "text") {
        setText("");
      } else {
        setCode("");
      }
      
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({ last_activity: new Date().toISOString() })
          .eq("id", sessionId);
      }
    } catch (error) {
      console.error("Error sending content:", error);
      toast.error("Failed to send");
      feedback.error();
    } finally {
      setIsSending(false);
    }
  };

  const sendText = async (content?: string) => {
    const textToSend = content || text;
    
    // In text mode, if code is detected, send as code with detected language
    if (codeDetected && detectedLanguage !== "plaintext") {
      await sendContent(textToSend, "code", detectedLanguage);
    } else {
      await sendContent(textToSend, "text");
    }
  };

  const sendCode = async () => {
    await sendContent(code, "code", language);
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
      feedback.error();
      return;
    }

    if (!sessionId && !userId) {
      toast.error("No active session");
      return;
    }

    setIsSending(true);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = userId || sessionId;
      const filePath = `${folder}/${timestamp}_${sanitizedFileName}`;
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      
      const { error: uploadError } = await supabase.storage
        .from("clipboard-files")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      
      if (uploadError) throw uploadError;

      setUploadProgress(95);

      const { data: { publicUrl } } = supabase.storage
        .from("clipboard-files")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("clipboard_items")
        .insert({
          content_type: "file",
          file_name: file.name,
          file_url: publicUrl,
          device_name: deviceName,
          user_id: userId || undefined,
          session_id: sessionId || undefined,
        });

      if (insertError) throw insertError;

      setUploadProgress(100);
      toast.success("File uploaded");
      feedback.send();
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName(undefined);
      }, 1500);
      
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({ last_activity: new Date().toISOString() })
          .eq("id", sessionId);
      }
    } catch (error: unknown) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload";
      toast.error(errorMessage);
      feedback.error();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadFileName(undefined);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-detect code when text changes in text mode
  const handleTextChange = (value: string) => {
    setText(value);
    
    if (value.length > 50) {
      detectWithDebounce(value, 800);
    }
  };

  const switchToCodeMode = () => {
    setCode(text);
    setText("");
    setMode("code");
    if (detectedLanguage && detectedLanguage !== "plaintext") {
      setLanguage(detectedLanguage);
    }
    toast.success(`Switched to code mode (${detectedLanguage})`);
  };

  const copyToClipboard = async () => {
    const contentToCopy = mode === "text" ? text : code;
    if (!contentToCopy.trim()) return;
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      toast.success("Copied");
      feedback.copy();
    } catch (error) {
      toast.error("Failed to copy");
      feedback.error();
    }
  };

  return (
    <Card className="p-4 border border-border">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "code")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-3 h-9">
          <TabsTrigger value="text" className="text-xs">
            <Type className="h-3.5 w-3.5 mr-1.5" />
            Text
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <Code2 className="h-3.5 w-3.5 mr-1.5" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-0">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative transition-all duration-200",
              isDragging && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-primary/5 border-2 border-dashed border-primary"
                >
                  <div className="text-center">
                    <FileUp className="h-8 w-8 text-primary mx-auto mb-1" />
                    <p className="text-sm font-medium text-primary">Drop file</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type or paste text..."
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                className="min-h-[100px] resize-none pr-10 text-sm"
              />
              {text && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {/* AI Code detection banner */}
              <AnimatePresence>
                {(codeDetected || isDetecting) && text.length > 50 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-2 left-2 right-2"
                  >
                    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                        {isDetecting ? (
                          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        )}
                        <span className="text-xs text-primary font-medium">
                          {isDetecting ? "Detecting..." : `${detectedLanguage} detected`}
                        </span>
                      </div>
                      {codeDetected && !isDetecting && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs text-primary hover:text-primary"
                          onClick={switchToCodeMode}
                        >
                          Switch to Code Mode
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <div className="relative">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onSend={sendCode}
            />
            {/* Auto-detect indicator in code mode */}
            <AnimatePresence>
              {isDetecting && code.length > 30 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1 right-24 flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full"
                >
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  <span className="text-xs text-primary">Detecting...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-3">
        {mode === "text" ? (
          <>
            <Button
              onClick={() => sendText()}
              disabled={!text.trim() || isSending}
              size="sm"
              className="flex-1"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {codeDetected ? `Send as ${detectedLanguage}` : "Send"}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              variant="outline"
              size="sm"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              File
            </Button>
          </>
        ) : (
          <Button
            onClick={sendCode}
            disabled={!code.trim() || isSending}
            size="sm"
            className="flex-1"
          >
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            Send ({language})
          </Button>
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
      
      {/* Upload Progress */}
      <UploadProgress
        isUploading={isUploading}
        progress={uploadProgress}
        fileName={uploadFileName}
        onCancel={() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadFileName(undefined);
        }}
      />
    </Card>
  );
};
