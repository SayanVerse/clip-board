import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Languages, FileText, Code2, CheckCheck, Copy, Loader2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Action = "summarize" | "translate" | "explain" | "grammar";

const LANGS = ["English", "Spanish", "French", "German", "Hindi", "Bengali", "Chinese", "Japanese", "Arabic"];

interface Props {
  content: string;
  contentType: "text" | "code";
}

export const AIClipActions = ({ content, contentType }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState("");

  const run = async (action: Action, targetLang?: string) => {
    setLoading(true);
    setActionLabel(action === "translate" ? `Translate → ${targetLang}` : action);
    try {
      const { data, error } = await supabase.functions.invoke("clip-ai", {
        body: { action, content, targetLang },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult((data as any).result || "");
    } catch (e: any) {
      toast.error(e?.message || "AI action failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success("Copied");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">AI Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {contentType === "code" ? (
            <DropdownMenuItem onClick={() => run("explain")}>
              <Code2 className="h-4 w-4 mr-2" /> Explain code
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => run("summarize")}>
                <FileText className="h-4 w-4 mr-2" /> Summarize
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => run("grammar")}>
                <CheckCheck className="h-4 w-4 mr-2" /> Fix grammar
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs flex items-center gap-1">
            <Languages className="h-3 w-3" /> Translate to
          </DropdownMenuLabel>
          {LANGS.map((l) => (
            <DropdownMenuItem key={l} onClick={() => run("translate", l)}>
              {l}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AnimatePresence>
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI · {actionLabel}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={copy}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setResult(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{result}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
