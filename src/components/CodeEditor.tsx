import { Editor } from "@monaco-editor/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  onSend?: () => void;
}

const LANGUAGES = [
  { value: "auto", label: "✨ Auto Detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "sql", label: "SQL" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
  { value: "shell", label: "Shell" },
  { value: "plaintext", label: "Plain Text" },
];

export const CodeEditor = ({ value, onChange, language, onLanguageChange, onSend }: CodeEditorProps) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Language</span>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[180px] rounded-2xl glass-hover">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="rounded-xl">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div 
        className="rounded-3xl overflow-hidden border-2 border-border bg-card"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (onSend) onSend();
          }
        }}
      >
        <Editor
          height="300px"
          language={language === "auto" ? "javascript" : language}
          value={value}
          onChange={(newValue) => onChange(newValue || "")}
          onMount={(editor, monaco) => {
            // Add both Ctrl+Enter and Cmd+Enter for cross-platform support
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              () => {
                if (onSend) onSend();
              }
            );
            editor.addCommand(
              monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter,
              () => {
                if (onSend) onSend();
              }
            );
          }}
          theme={theme === "dark" ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "all",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
            },
          }}
        />
      </div>
    </motion.div>
  );
};
