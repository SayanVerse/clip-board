import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Trash2, Code2, Maximize2, X, RefreshCw, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { HistorySkeleton } from "./HistorySkeleton";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { feedback } from "@/hooks/useFeedback";

interface ClipboardItem {
  id: string;
  content_type: "text" | "file" | "code";
  content?: string;
  file_name?: string;
  file_url?: string;
  device_name?: string;
  language?: string;
  created_at: string;
  is_pinned?: boolean;
}

interface ClipboardHistoryProps {
  sessionId: string | null;
  userId?: string;
}

export const ClipboardHistory = ({ sessionId, userId }: ClipboardHistoryProps) => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ClipboardItem | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadHistory();
    const unsubscribe = subscribeToChanges();
    return unsubscribe;
  }, [sessionId, userId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("clipboard_items")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data || []) as ClipboardItem[]);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const filterColumn = userId ? "user_id" : "session_id";
    const filterValue = userId || sessionId;
    
    if (!filterValue) return () => {};

    const channel = supabase
      .channel(`clipboard:${filterValue}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clipboard_items",
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        () => {
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
      feedback.copy();
    } catch (error) {
      toast.error("Failed to copy");
      feedback.error();
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clipboard_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("clipboard_items")
        .update({ is_pinned: !currentPinned })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentPinned ? "Unpinned" : "Pinned");
      loadHistory();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const clearAll = async () => {
    try {
      let query = supabase.from("clipboard_items").delete();
      
      if (userId) {
        query = query.eq("user_id", userId);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        return;
      }

      const { error } = await query;

      if (error) throw error;
      toast.success("History cleared");
    } catch (error) {
      toast.error("Failed to clear");
    }
  };

  const isImage = (fileName?: string) => {
    if (!fileName) return false;
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  const isPDF = (fileName?: string) => {
    if (!fileName) return false;
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const getFileType = (fileName?: string) => {
    if (isImage(fileName)) return 'image';
    if (isPDF(fileName)) return 'pdf';
    return 'other';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <Card className="p-4 md:p-5 border border-border h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">History</h3>
          <p className="text-xs text-muted-foreground">{items.length} items</p>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={loadHistory}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={clearAll}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-200px)]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No items yet</p>
            <p className="text-xs text-muted-foreground">Start by sending text or files</p>
          </div>
        ) : (
          <div className="space-y-2 pr-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  layout
                >
                  <div className={`group p-3 rounded-lg border bg-card hover:bg-accent/30 transition-all duration-100 ${item.is_pinned ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded shrink-0 ${item.is_pinned ? 'bg-primary/20' : 'bg-muted'}`}>
                        {item.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        {!item.is_pinned && item.content_type === "text" && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                        {!item.is_pinned && item.content_type === "code" && <Code2 className="h-3.5 w-3.5 text-muted-foreground" />}
                        {!item.is_pinned && item.content_type === "file" && <Download className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground">{item.device_name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</span>
                          {item.content_type === "code" && item.language && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              {item.language}
                            </span>
                          )}
                        </div>
                        
                        {item.content_type === "text" && (
                          <p className="text-sm break-words line-clamp-2">{item.content}</p>
                        )}
                        
                        {item.content_type === "code" && (
                          expandedCode === item.id ? (
                            <div className="rounded overflow-hidden border border-border mt-1">
                              <Editor
                                height="150px"
                                language={item.language || "plaintext"}
                                value={item.content || ""}
                                theme={theme === "dark" ? "vs-dark" : "light"}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 11,
                                  lineNumbers: "off",
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  wordWrap: "on",
                                  padding: { top: 8, bottom: 8 },
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setExpandedCode(item.id)}
                              className="text-xs text-left w-full p-2 rounded bg-muted/50 hover:bg-muted transition-colors font-mono line-clamp-2"
                            >
                              {item.content}
                            </button>
                          )
                        )}
                        
                        {item.content_type === "file" && (
                          <>
                            <p className="text-sm font-medium truncate">{item.file_name}</p>
                            {getFileType(item.file_name) === 'image' && (
                              <div 
                                className="relative rounded overflow-hidden cursor-pointer mt-2 group/img"
                                onClick={() => setPreviewFile(item)}
                              >
                                <img 
                                  src={item.file_url} 
                                  alt={item.file_name} 
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(item.content_type === "text" || item.content_type === "code") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyText(item.content!)}
                            className="h-7 w-7"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {item.content_type === "file" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(item.file_url, "_blank")}
                            className="h-7 w-7"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePin(item.id, item.is_pinned || false)}
                          className={`h-7 w-7 ${item.is_pinned ? 'text-primary' : ''}`}
                        >
                          {item.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          className="h-7 w-7 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur"
              onClick={() => setPreviewFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {previewFile && (
              <div className="w-full overflow-auto p-4">
                {getFileType(previewFile.file_name) === 'image' ? (
                  <img 
                    src={previewFile.file_url} 
                    alt={previewFile.file_name}
                    className="w-full h-auto rounded-lg"
                  />
                ) : getFileType(previewFile.file_name) === 'pdf' ? (
                  <iframe
                    src={previewFile.file_url}
                    className="w-full h-[80vh] rounded-lg"
                    title={previewFile.file_name}
                  />
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
