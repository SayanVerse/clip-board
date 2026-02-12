import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Trash2, Code2, Maximize2, X, RefreshCw, Pin, PinOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { HistorySkeleton } from "./HistorySkeleton";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { feedback } from "@/hooks/useFeedback";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
export const ClipboardHistory = ({
  sessionId,
  userId
}: ClipboardHistoryProps) => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<ClipboardItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    theme
  } = useTheme();
  useEffect(() => {
    loadHistory();
    const unsubscribe = subscribeToChanges();

    // Auto-delete old items for logged-in users (older than 1 week)
    if (userId) {
      deleteOldItems();
    }
    return unsubscribe;
  }, [sessionId, userId]);
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("clipboard_items").select("*").order("is_pinned", {
        ascending: false
      }).order("created_at", {
        ascending: false
      }).limit(50);
      if (userId) {
        query = query.eq("user_id", userId);
      } else if (sessionId) {
        query = query.eq("session_id", sessionId);
      } else {
        setItems([]);
        setIsLoading(false);
        return;
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      setItems((data || []) as ClipboardItem[]);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-cleanup disabled - items persist indefinitely
  const deleteOldItems = async () => {
    // No auto-cleanup - keep all items forever
    return;
  };

  // Download file function - triggers automatic download
  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
      feedback.copy();
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
      feedback.error();
    }
  };
  const subscribeToChanges = () => {
    const filterColumn = userId ? "user_id" : "session_id";
    const filterValue = userId || sessionId;
    if (!filterValue) return () => {};
    const channel = supabase.channel(`clipboard:${filterValue}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "clipboard_items",
      filter: `${filterColumn}=eq.${filterValue}`
    }, () => {
      loadHistory();
    }).subscribe();
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
    setDeletingId(id);

    // Immediately remove from local state for instant UI feedback
    setItems(prev => prev.filter(item => item.id !== id));
    try {
      const {
        error
      } = await supabase.from("clipboard_items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
    } catch (error) {
      // If delete failed, reload to restore the item
      toast.error("Failed to delete");
      loadHistory();
    } finally {
      setDeletingId(null);
    }
  };
  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const {
        error
      } = await supabase.from("clipboard_items").update({
        is_pinned: !currentPinned
      }).eq("id", id);
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
      const {
        error
      } = await query;
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
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const isLongContent = (content?: string) => {
    if (!content) return false;
    return content.length > 200 || content.split('\n').length > 4;
  };
  if (isLoading) {
    return <HistorySkeleton />;
  }
  return <Card className="p-4 md:p-6 h-full shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base">Clipboard History</h3>
          
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {items.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive rounded-full" onClick={clearAll}>
              Clear All
            </Button>}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-220px)]">
        {items.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No items yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start by sending text, code, or files</p>
          </div> : <div className="space-y-3 pr-3">
            <AnimatePresence mode="popLayout">
              {items.map(item => <motion.div key={item.id} initial={{
            opacity: 0,
            y: 20,
            scale: 0.95
          }} animate={{
            opacity: deletingId === item.id ? 0 : 1,
            y: 0,
            scale: deletingId === item.id ? 0.8 : 1,
            x: deletingId === item.id ? 100 : 0
          }} exit={{
            opacity: 0,
            scale: 0.8,
            x: 100
          }} transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1]
          }} layout>
                  <div className={`group p-4 rounded-xl transition-all duration-200 overflow-hidden ${item.is_pinned ? 'bg-accent shadow-[var(--shadow-2)]' : 'bg-card shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]'}`}>
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className={`p-2 rounded-xl shrink-0 ${item.is_pinned ? 'bg-primary/15' : 'bg-muted/60'}`}>
                        {item.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        {!item.is_pinned && item.content_type === "text" && <FileText className="h-4 w-4 text-muted-foreground" />}
                        {!item.is_pinned && item.content_type === "code" && <Code2 className="h-4 w-4 text-muted-foreground" />}
                        {!item.is_pinned && item.content_type === "file" && <Download className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-medium text-muted-foreground">{item.device_name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <span className="text-[11px] text-muted-foreground/80">{formatTime(item.created_at)}</span>
                          {item.content_type === "code" && item.language && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                              {item.language}
                            </span>}
                        </div>
                        
                        {/* Text Content with expand/collapse */}
                        {item.content_type === "text" && <Collapsible open={expandedItems.has(item.id)}>
                            <div className="relative">
                              <p className={`text-sm break-all whitespace-pre-wrap max-w-full overflow-hidden ${!expandedItems.has(item.id) && isLongContent(item.content) ? 'line-clamp-3' : ''}`}>
                                {item.content}
                              </p>
                              {isLongContent(item.content) && <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:text-primary mt-1" onClick={() => toggleExpand(item.id)}>
                                    {expandedItems.has(item.id) ? <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Collapse
                                      </> : <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Expand
                                      </>}
                                  </Button>
                                </CollapsibleTrigger>}
                            </div>
                          </Collapsible>}
                        
                        {/* Code Content with expand/collapse */}
                        {item.content_type === "code" && <Collapsible open={expandedCode === item.id || expandedItems.has(item.id)}>
                            {expandedCode === item.id ? <div className="rounded-xl overflow-hidden border border-border/50 mt-2 max-w-full">
                                <Editor height="180px" language={item.language || "plaintext"} value={item.content || ""} theme={theme === "dark" ? "vs-dark" : "light"} options={{
                        readOnly: true,
                        minimap: {
                          enabled: false
                        },
                        fontSize: 12,
                        lineNumbers: "off",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: "on",
                        padding: {
                          top: 12,
                          bottom: 12
                        }
                      }} />
                              </div> : <div className="relative">
                                <button onClick={() => setExpandedCode(item.id)} className={`text-xs text-left w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors font-mono break-all whitespace-pre-wrap overflow-hidden max-w-full border border-border/30 ${!expandedItems.has(item.id) ? 'line-clamp-3' : ''}`}>
                                  {item.content}
                                </button>
                                {isLongContent(item.content) && <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:text-primary mt-1" onClick={() => toggleExpand(item.id)}>
                                    {expandedItems.has(item.id) ? <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Collapse
                                      </> : <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Expand
                                      </>}
                                  </Button>}
                              </div>}
                          </Collapsible>}
                        
                        {/* File Content */}
                        {item.content_type === "file" && <>
                            <p className="text-sm font-medium truncate">{item.file_name}</p>
                            {getFileType(item.file_name) === 'image' && <div className="relative rounded-xl overflow-hidden cursor-pointer mt-3 group/img border border-border/30" onClick={() => setPreviewFile(item)}>
                                <img src={item.file_url} alt={item.file_name} className="w-full h-36 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="h-5 w-5 text-white" />
                                </div>
                              </div>}
                          </>}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(item.content_type === "text" || item.content_type === "code") && <Button variant="ghost" size="icon" onClick={() => copyText(item.content!)} className="h-8 w-8 rounded-full hover:bg-primary/10">
                            <Copy className="h-4 w-4" />
                          </Button>}
                        {item.content_type === "file" && <Button variant="ghost" size="icon" onClick={() => downloadFile(item.file_url!, item.file_name || 'download')} className="h-8 w-8 rounded-full hover:bg-primary/10">
                            <Download className="h-4 w-4" />
                          </Button>}
                        <Button variant="ghost" size="icon" onClick={() => togglePin(item.id, item.is_pinned || false)} className={`h-8 w-8 rounded-full ${item.is_pinned ? 'text-primary hover:bg-primary/10' : 'hover:bg-muted'}`}>
                          {item.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </div>}
      </ScrollArea>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-2xl overflow-hidden">
          <div className="relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur rounded-full" onClick={() => setPreviewFile(null)}>
              <X className="h-4 w-4" />
            </Button>
            
            {previewFile && <div className="w-full overflow-auto p-6">
                {getFileType(previewFile.file_name) === 'image' ? <img src={previewFile.file_url} alt={previewFile.file_name} className="w-full h-auto rounded-xl" /> : getFileType(previewFile.file_name) === 'pdf' ? <iframe src={previewFile.file_url} className="w-full h-[80vh] rounded-xl" title={previewFile.file_name} /> : null}
              </div>}
          </div>
        </DialogContent>
      </Dialog>
    </Card>;
};