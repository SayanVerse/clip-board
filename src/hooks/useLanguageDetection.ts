import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LanguageDetectionResult {
  language: string;
  isCode: boolean;
  isDetecting: boolean;
}

export function useLanguageDetection() {
  const [result, setResult] = useState<LanguageDetectionResult>({
    language: "plaintext",
    isCode: false,
    isDetecting: false,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCodeRef = useRef<string>("");

  const detectLanguage = useCallback(async (code: string) => {
    // Don't detect if code is too short or hasn't changed significantly
    if (code.length < 50) {
      setResult({ language: "plaintext", isCode: false, isDetecting: false });
      return;
    }

    // Check if code changed significantly (more than 20 chars difference)
    if (Math.abs(code.length - lastCodeRef.current.length) < 20 && 
        code.slice(0, 100) === lastCodeRef.current.slice(0, 100)) {
      return;
    }

    lastCodeRef.current = code;
    setResult(prev => ({ ...prev, isDetecting: true }));

    try {
      const { data, error } = await supabase.functions.invoke("detect-language", {
        body: { code },
      });

      if (error) {
        console.error("Language detection error:", error);
        setResult({ language: "plaintext", isCode: false, isDetecting: false });
        return;
      }

      setResult({
        language: data.language || "plaintext",
        isCode: data.isCode || false,
        isDetecting: false,
      });
    } catch (error) {
      console.error("Language detection error:", error);
      setResult({ language: "plaintext", isCode: false, isDetecting: false });
    }
  }, []);

  const detectWithDebounce = useCallback((code: string, delay = 800) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      detectLanguage(code);
    }, delay);
  }, [detectLanguage]);

  return {
    ...result,
    detectLanguage,
    detectWithDebounce,
  };
}
