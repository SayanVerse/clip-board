import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Trash2, Code2, Maximize2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { HistorySkeleton } from "./HistorySkeleton";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ClipboardItem {
  id: string;
  content_type: "text" | "file" | "code";
  content?: string;
  file_name?: string;
  file_url?: string;
  device_name?: string;
  language?: string;
  created_at: string;
}

interface ClipboardHistoryProps {
  sessionId: string;
}

export const ClipboardHistory = ({ sessionId }: ClipboardHistoryProps) => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ClipboardItem | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadHistory();
    subscribeToChanges();
  }, [sessionId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clipboard_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(20);

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
    const channel = supabase
      .channel(`clipboard:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clipboard_items",
          filter: `session_id=eq.${sessionId}`,
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
    } catch (error) {
      toast.error("Failed to copy");
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

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from("clipboard_items")
        .delete()
        .eq("session_id", sessionId);

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

  if (isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <Card className="p-4 md:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">History</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadHistory}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No items yet. Start by sending text or files.
          </p>
        ) : (
          <div className="space-y-3 pr-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {item.content_type === "text" ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {item.device_name || "Unknown"}
                              </span>
                            </div>
                            <p className="text-sm break-words line-clamp-3">{item.content}</p>
                          </>
                        ) : item.content_type === "code" ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <Code2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {item.device_name || "Unknown"}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                {item.language || "plaintext"}
                              </span>
                            </div>
                            {expandedCode === item.id ? (
                              <div className="rounded-lg overflow-hidden border border-border mt-2">
                                <Editor
                                  height="180px"
                                  language={item.language || "plaintext"}
                                  value={item.content || ""}
                                  theme={theme === "dark" ? "vs-dark" : "light"}
                                  options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    wordWrap: "on",
                                  }}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setExpandedCode(item.id)}
                                className="text-sm text-left w-full p-2 rounded bg-muted/50 hover:bg-muted transition-colors font-mono line-clamp-2"
                              >
                                {item.content}
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {item.device_name || "Unknown"}
                              </span>
                            </div>
                            <p className="text-sm font-medium truncate mb-2">{item.file_name}</p>
                            
                            {getFileType(item.file_name) === 'image' && (
                              <div 
                                className="relative rounded-lg overflow-hidden cursor-pointer group"
                                onClick={() => setPreviewFile(item)}
                              >
                                <img 
                                  src={item.file_url} 
                                  alt={item.file_name} 
                                  className="w-full h-40 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            )}
                            
                            {getFileType(item.file_name) === 'pdf' && (
                              <button
                                onClick={() => setPreviewFile(item)}
                                className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">Preview PDF</span>
                              </button>
                            )}
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {(item.content_type === "text" || item.content_type === "code") ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyText(item.content!)}
                              className="h-8 w-8"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {item.content_type === "code" && expandedCode === item.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpandedCode(null)}
                                className="h-8 w-8"
                              >
                                <Code2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(item.file_url, "_blank")}
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
