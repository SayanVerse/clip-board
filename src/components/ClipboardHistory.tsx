import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Trash2, Code2, Maximize2, X } from "lucide-react";
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
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying:", error);
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
      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting:", error);
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
      console.error("Error clearing:", error);
      toast.error("Failed to clear history");
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="p-4 md:p-6 glass rounded-3xl shadow-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-semibold">Clipboard History</h3>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadHistory}
                className="rounded-2xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                Refresh
              </Button>
            </motion.div>
            {items.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  className="rounded-2xl"
                >
                  Clear All
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {items.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-8"
            >
              No clipboard items yet. Start by sending text or files!
            </motion.p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    layout
                  >
                    <Card className="p-5 glass-hover rounded-3xl transition-all duration-300 shadow-md hover:shadow-lg border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {item.content_type === "text" ? (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <motion.div 
                                  className="p-2 rounded-xl bg-primary/10"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                </motion.div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {item.device_name || "Unknown device"}
                                </span>
                              </div>
                              <p className="text-sm break-words line-clamp-3 leading-relaxed">{item.content}</p>
                            </>
                          ) : item.content_type === "code" ? (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <motion.div 
                                  className="p-2 rounded-xl bg-primary/10"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <Code2 className="h-4 w-4 text-primary flex-shrink-0" />
                                </motion.div>
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {item.device_name || "Unknown device"}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                                    {item.language || "plaintext"}
                                  </span>
                                </div>
                              </div>
                              {expandedCode === item.id ? (
                                <div className="rounded-2xl overflow-hidden border border-border mt-2 bg-card">
                                  <Editor
                                    height="200px"
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
                                <motion.button
                                  onClick={() => setExpandedCode(item.id)}
                                  className="text-sm text-left w-full p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors font-mono line-clamp-2"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  {item.content}
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <motion.div 
                                  className="p-2 rounded-xl bg-primary/10"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <Download className="h-4 w-4 text-primary flex-shrink-0" />
                                </motion.div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {item.device_name || "Unknown device"}
                                </span>
                              </div>
                              <p className="text-sm font-semibold truncate mb-3">{item.file_name}</p>
                              
                              {getFileType(item.file_name) === 'image' && (
                                <motion.div 
                                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => setPreviewFile(item)}
                                >
                                  <img 
                                    src={item.file_url} 
                                    alt={item.file_name} 
                                    className="w-full h-48 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="h-8 w-8 text-white" />
                                  </div>
                                </motion.div>
                              )}
                              
                              {getFileType(item.file_name) === 'pdf' && (
                                <motion.button
                                  onClick={() => setPreviewFile(item)}
                                  className="w-full p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center gap-2"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  <FileText className="h-5 w-5" />
                                  <span className="text-sm font-medium">Preview PDF</span>
                                </motion.button>
                              )}
                            </>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-3 font-medium">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {(item.content_type === "text" || item.content_type === "code") ? (
                            <>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyText(item.content!)}
                                  className="rounded-2xl"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              {item.content_type === "code" && expandedCode === item.id && (
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setExpandedCode(null)}
                                    className="rounded-2xl"
                                  >
                                    <Code2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              )}
                            </>
                          ) : (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(item.file_url, "_blank")}
                                className="rounded-2xl"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          )}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem(item.id)}
                              className="rounded-2xl hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </Card>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur"
              onClick={() => setPreviewFile(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {previewFile && (
              <div className="w-full h-full overflow-auto p-4">
                {getFileType(previewFile.file_name) === 'image' ? (
                  <img 
                    src={previewFile.file_url} 
                    alt={previewFile.file_name}
                    className="w-full h-auto rounded-2xl"
                  />
                ) : getFileType(previewFile.file_name) === 'pdf' ? (
                  <iframe
                    src={previewFile.file_url}
                    className="w-full h-[80vh] rounded-2xl"
                    title={previewFile.file_name}
                  />
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
