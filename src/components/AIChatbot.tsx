import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, X, Send, Bot, User, Loader2, Trash2, Maximize2, Minimize2, 
  Copy, ClipboardPaste, History, Plus, Image, Upload, Check, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatPersistence, ChatMessage } from "@/hooks/useChatPersistence";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface AIChatbotProps {
  onSendToClipboard?: (content: string) => void;
}

// Helper function to convert data URL to Blob
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return res.blob();
};

// Helper function to copy image to clipboard
const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    if (!dataUrl.startsWith("data:")) {
      // If it's not a data URL, try to fetch it and convert
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      return true;
    }

    const blob = await dataUrlToBlob(dataUrl);
    // Ensure it's PNG for clipboard compatibility
    const pngBlob = blob.type === "image/png" ? blob : await convertToPng(dataUrl);
    const item = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.error("Failed to copy image:", err);
    return false;
  }
};

// Convert image to PNG blob for clipboard
const convertToPng = async (dataUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create blob"));
      }, "image/png");
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

// Helper function to download image
const downloadImage = (dataUrl: string, filename = "generated-image.png") => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AIChatbot = ({ onSendToClipboard }: AIChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sentToClipboardId, setSentToClipboardId] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    messages,
    currentConversationId,
    startNewConversation,
    addMessage,
    updateLastAssistantMessage,
    switchConversation,
    deleteConversation,
    clearCurrentConversation,
  } = useChatPersistence(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Ensure we have a conversation
  useEffect(() => {
    if (isOpen && !currentConversationId && conversations.length === 0) {
      startNewConversation();
    }
  }, [isOpen, currentConversationId, conversations.length, startNewConversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFilePreview(null);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleCopyImage = async (imageUrl: string, index: number) => {
    try {
      const success = await copyImageToClipboard(imageUrl);
      if (success) {
        setCopiedId(index);
        toast.success("Image copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        toast.error("Failed to copy image");
      }
    } catch (err) {
      toast.error("Failed to copy image");
    }
  };

  const handleDownloadImage = (imageUrl: string) => {
    downloadImage(imageUrl, `generated-image-${Date.now()}.png`);
    toast.success("Image downloaded!");
  };

  const handleSendToClipboard = (content: string, index: number) => {
    if (onSendToClipboard) {
      onSendToClipboard(content);
      setSentToClipboardId(index);
      toast.success("Sent to Clip-Board input!");
      setTimeout(() => setSentToClipboardId(null), 2000);
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    // Ensure we have a conversation
    if (!currentConversationId) {
      startNewConversation();
    }

    let userContent = input.trim();
    let isImageGenRequest = false;
    
    // Check for image generation request
    const imageGenPatterns = [
      /^generate\s+(an?\s+)?image/i,
      /^create\s+(an?\s+)?image/i,
      /^make\s+(an?\s+)?image/i,
      /^draw\s+/i,
      /^imagine\s+/i,
    ];
    isImageGenRequest = imageGenPatterns.some(p => p.test(userContent));

    // Handle file upload
    if (uploadedFile) {
      if (uploadedFile.type.startsWith("image/") && uploadedFilePreview) {
        userContent = `[Image attached: ${uploadedFile.name}]\n\n${userContent}`;
      } else {
        // Read text file content
        try {
          const text = await uploadedFile.text();
          userContent = `[File: ${uploadedFile.name}]\n\`\`\`\n${text.slice(0, 5000)}\n\`\`\`\n\n${userContent}`;
        } catch {
          userContent = `[File: ${uploadedFile.name} - could not read]\n\n${userContent}`;
        }
      }
    }

    const userMessage: ChatMessage = { role: "user", content: userContent, type: "text" };
    addMessage(userMessage);
    setInput("");
    removeUploadedFile();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    // Add placeholder assistant message
    addMessage({ role: "assistant", content: "", type: "text" });

    let assistantContent = "";

    try {
      // Handle image generation
      if (isImageGenRequest) {
        const imagePrompt = userContent.replace(/^(generate|create|make|draw|imagine)\s+(an?\s+)?(image\s+of\s*)?/i, "").trim();
        
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: [{ role: "user", content: imagePrompt }],
            generateImage: true 
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate image");
        }

        const data = await response.json();
        const imageUrl = data.imageUrl;
        
        if (imageUrl) {
          updateLastAssistantMessage(`Here's the generated image:\n\n![Generated Image](${imageUrl})`, imageUrl);
        } else {
          updateLastAssistantMessage("I'm sorry, I couldn't generate the image. Please try again with a different prompt.");
        }
      } else {
        // Regular chat completion
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages.slice(-10), userMessage] }),
        });

        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get response");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                updateLastAssistantMessage(assistantContent);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      updateLastAssistantMessage("I apologize, but I encountered an error processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Chat panel dimensions - ensure proper width constraints for overflow
  const panelClasses = isExpanded
    ? "fixed inset-2 sm:inset-4 md:inset-8 z-[60]"
    : "fixed bottom-4 right-4 z-[60] w-[95vw] max-w-[420px] h-[85vh] max-h-[680px] sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[650px]";

  // Computed max width for message content to prevent overflow
  const messageMaxWidth = isExpanded ? "calc(100% - 4rem)" : "calc(100% - 3rem)";

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
            >
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm"
                onClick={() => setIsExpanded(false)}
              />
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden",
                panelClasses
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border bg-muted/50 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">AI Assistant</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Powered by Gemini</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={handleNewChat}
                    title="New chat"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setShowHistory(!showHistory)}
                    title="Recent chats"
                  >
                    <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={clearCurrentConversation}
                    title="Clear chat"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Minimize" : "Maximize"}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => {
                      setIsOpen(false);
                      setIsExpanded(false);
                      setShowHistory(false);
                    }}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {/* Recent Chats Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-border bg-muted/30 overflow-hidden"
                  >
                    <div className="p-2 sm:p-3 max-h-48 overflow-y-auto">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2">Recent Chats</p>
                      {conversations.length === 0 ? (
                        <p className="text-[10px] sm:text-xs text-muted-foreground italic">No recent chats</p>
                      ) : (
                        <div className="space-y-1">
                          {conversations.map(conv => (
                            <div
                              key={conv.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm",
                                conv.id === currentConversationId
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => {
                                switchConversation(conv.id);
                                setShowHistory(false);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-[11px] sm:text-xs">{conv.title}</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground">{formatDate(conv.updatedAt)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 overflow-hidden" ref={scrollRef}>
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 w-full overflow-hidden">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2 sm:gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 h-fit shrink-0">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm relative group",
                          "max-w-[85%] min-w-0 w-fit overflow-hidden",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-md"
                            : "bg-muted rounded-tl-md"
                        )}
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          whiteSpace: "pre-wrap",
                          maxWidth: isExpanded ? "85%" : "calc(100% - 2.5rem)",
                        }}
                      >
                        {msg.content ? (
                          msg.role === "assistant" ? (
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none overflow-hidden
                                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 
                                [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:my-2 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:bg-background/50
                                [&_code]:text-[10px] [&_code]:sm:text-xs [&_code]:break-all [&_code]:whitespace-pre-wrap
                                [&_p]:my-1.5 [&_p]:break-words [&_p]:leading-relaxed [&_p]:max-w-full
                                [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5
                                [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm
                                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:h-auto"
                              style={{ wordBreak: "break-word", overflowWrap: "anywhere", maxWidth: "100%" }}
                            >
                              {/* Render generated image directly if imageUrl exists */}
                              {msg.imageUrl && (
                                <div className="relative group/img mb-2">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Generated Image" 
                                    className="max-w-full rounded-lg h-auto"
                                    onError={(e) => {
                                      console.error("Image failed to load:", msg.imageUrl?.substring(0, 100));
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 bg-background/80"
                                      onClick={() => handleCopyImage(msg.imageUrl || "", i * 2000)}
                                      title="Copy image"
                                    >
                                      {copiedId === i * 2000 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 bg-background/80"
                                      onClick={() => handleDownloadImage(msg.imageUrl || "")}
                                      title="Download image"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    {onSendToClipboard && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 bg-background/80"
                                        onClick={() => handleSendToClipboard(msg.imageUrl || "", i * 2000)}
                                        title="Send to Clip-Board"
                                      >
                                        <ClipboardPaste className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  pre: ({ children }) => (
                                    <div className="relative group/code overflow-hidden max-w-full">
                                      <pre className="overflow-x-auto max-w-full" style={{ maxWidth: "100%", overflowX: "auto" }}>
                                        {children}
                                      </pre>
                                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 bg-background/80"
                                          onClick={() => {
                                            const code = (children as any)?.props?.children || "";
                                            handleCopy(code, i * 1000);
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        {onSendToClipboard && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 bg-background/80"
                                            onClick={() => {
                                              const code = (children as any)?.props?.children || "";
                                              handleSendToClipboard(code, i * 1000);
                                            }}
                                          >
                                            <ClipboardPaste className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                  // Skip markdown img if imageUrl already rendered above
                                  img: msg.imageUrl ? () => null : ({ src, alt }) => (
                                    <div className="relative group/img">
                                      <img src={src} alt={alt} className="max-w-full rounded-lg h-auto" />
                                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 bg-background/80"
                                          onClick={() => handleCopyImage(src || "", i * 2000)}
                                          title="Copy image"
                                        >
                                          {copiedId === i * 2000 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 bg-background/80"
                                          onClick={() => handleDownloadImage(src || "")}
                                          title="Download image"
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                        {onSendToClipboard && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 bg-background/80"
                                            onClick={() => handleSendToClipboard(src || "", i * 2000)}
                                            title="Send to Clip-Board"
                                          >
                                            <ClipboardPaste className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                              {msg.content}
                            </p>
                          )
                        ) : (
                          isLoading && i === messages.length - 1 && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              <span className="text-muted-foreground text-[11px] sm:text-xs">Thinking...</span>
                            </div>
                          )
                        )}
                        
                        {/* Action buttons for assistant messages */}
                        {msg.role === "assistant" && msg.content && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] sm:text-xs"
                              onClick={() => handleCopy(msg.content, i)}
                            >
                              {copiedId === i ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedId === i ? "Copied" : "Copy"}
                            </Button>
                            {onSendToClipboard && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] sm:text-xs"
                                onClick={() => handleSendToClipboard(msg.content, i)}
                              >
                                {sentToClipboardId === i ? <Check className="h-3 w-3 mr-1" /> : <ClipboardPaste className="h-3 w-3 mr-1" />}
                                {sentToClipboardId === i ? "Sent" : "To Clip-Board"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-muted h-fit shrink-0">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* File preview */}
              {uploadedFile && (
                <div className="px-3 sm:px-4 py-2 border-t border-border bg-muted/30">
                  <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                    {uploadedFilePreview ? (
                      <img src={uploadedFilePreview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeUploadedFile}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-2 sm:p-3 border-t border-border bg-muted/30 shrink-0">
                <div className="flex gap-1.5 sm:gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.txt,.md,.json,.js,.ts,.py,.html,.css"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-[44px] sm:w-[44px] shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything... (Shift+Enter for new line)"
                    disabled={isLoading}
                    className="flex-1 min-h-[36px] sm:min-h-[44px] max-h-[120px] sm:max-h-[150px] resize-none py-2 sm:py-3 text-xs sm:text-sm"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={(!input.trim() && !uploadedFile) || isLoading}
                    size="icon"
                    className="h-9 w-9 sm:h-[44px] sm:w-[44px] shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center">
                  Enter to send • Shift+Enter for new line
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
