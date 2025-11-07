import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClipboardItem {
  id: string;
  content_type: "text" | "file";
  content?: string;
  file_name?: string;
  file_url?: string;
  device_name?: string;
  created_at: string;
}

interface ClipboardHistoryProps {
  sessionId: string;
}

export const ClipboardHistory = ({ sessionId }: ClipboardHistoryProps) => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card">
        <p className="text-center text-muted-foreground">Loading history...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Clipboard History</h3>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No clipboard items yet. Start by sending text or files!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 bg-background hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {item.content_type === "text" ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {item.device_name || "Unknown device"}
                          </span>
                        </div>
                        <p className="text-sm break-words line-clamp-3">{item.content}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {item.device_name || "Unknown device"}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{item.file_name}</p>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {item.content_type === "text" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyText(item.content!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(item.file_url, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
