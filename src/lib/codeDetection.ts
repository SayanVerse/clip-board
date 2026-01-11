// Code detection patterns for various languages
const codePatterns = [
  // JavaScript/TypeScript
  { pattern: /\b(const|let|var|function|class|import|export|async|await|return)\s+\w+/g, weight: 3 },
  { pattern: /=>\s*[{(]/g, weight: 3 },
  { pattern: /\(\s*\)\s*=>/g, weight: 3 },
  { pattern: /\.(map|filter|reduce|forEach|find|some|every)\s*\(/g, weight: 2 },
  
  // Python
  { pattern: /\bdef\s+\w+\s*\(/g, weight: 3 },
  { pattern: /\bclass\s+\w+(\s*\(.*\))?\s*:/g, weight: 3 },
  { pattern: /\bimport\s+\w+(\s+as\s+\w+)?(\s+from\s+\w+)?/g, weight: 2 },
  { pattern: /\bif\s+.*:\s*$/gm, weight: 2 },
  { pattern: /^\s+(print|return|yield|raise|pass|break|continue)\b/gm, weight: 2 },
  
  // Java/C#/C++
  { pattern: /\b(public|private|protected|static|void|int|string|boolean|class|interface)\s+\w+/gi, weight: 3 },
  { pattern: /\bSystem\.(out\.println|Console\.WriteLine)/g, weight: 3 },
  
  // HTML/JSX
  { pattern: /<\w+(\s+\w+(=["'][^"']*["'])?)*\s*\/?>/g, weight: 2 },
  { pattern: /<\/\w+>/g, weight: 2 },
  { pattern: /className\s*=\s*["']/g, weight: 3 },
  
  // CSS
  { pattern: /\{[\s\S]*?:\s*[^;]+;[\s\S]*?\}/g, weight: 2 },
  { pattern: /\.([\w-]+)\s*\{/g, weight: 2 },
  { pattern: /@(media|keyframes|import|font-face)\s/g, weight: 3 },
  
  // SQL
  { pattern: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|ALTER|DROP)\b/gi, weight: 3 },
  
  // Shell/Bash
  { pattern: /^#!/gm, weight: 3 },
  { pattern: /\$\([^)]+\)/g, weight: 2 },
  { pattern: /\b(echo|grep|sed|awk|curl|wget|npm|yarn|pip|git)\s+/g, weight: 2 },
  
  // JSON
  { pattern: /^\s*\{\s*"[\w]+"\s*:/gm, weight: 3 },
  { pattern: /^\s*\[\s*\{/gm, weight: 2 },
  
  // Common code structures
  { pattern: /;\s*$/gm, weight: 1 },
  { pattern: /\{\s*\n/g, weight: 1 },
  { pattern: /^\s{2,}\w+/gm, weight: 0.5 }, // Indentation
  { pattern: /\/\/.*$/gm, weight: 1 }, // Single-line comments
  { pattern: /\/\*[\s\S]*?\*\//g, weight: 1 }, // Multi-line comments
  { pattern: /#.*$/gm, weight: 0.5 }, // Hash comments
];

// Language detection based on content
const languagePatterns: { language: string; patterns: RegExp[] }[] = [
  {
    language: 'javascript',
    patterns: [
      /\bconst\s+\w+\s*=\s*(async\s*)?\(/g,
      /\bimport\s+.*\s+from\s+['"][^'"]+['"]/g,
      /\bexport\s+(default\s+)?(function|class|const)/g,
      /=>\s*\{/g,
      /\.(then|catch|finally)\s*\(/g,
    ],
  },
  {
    language: 'typescript',
    patterns: [
      /:\s*(string|number|boolean|any|void|never)\b/g,
      /interface\s+\w+\s*\{/g,
      /type\s+\w+\s*=/g,
      /<\w+(\s*,\s*\w+)*>/g,
      /as\s+(string|number|boolean|const)/g,
    ],
  },
  {
    language: 'python',
    patterns: [
      /\bdef\s+\w+\s*\([^)]*\)\s*(->\s*\w+)?:/g,
      /\bclass\s+\w+(\([^)]*\))?:/g,
      /\bimport\s+\w+|from\s+\w+\s+import/g,
      /\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/g,
      /\bprint\s*\(/g,
    ],
  },
  {
    language: 'html',
    patterns: [
      /<!DOCTYPE\s+html>/gi,
      /<html[\s>]/gi,
      /<\/?(div|span|p|a|img|ul|li|table|form|input|button|head|body)\b/gi,
    ],
  },
  {
    language: 'css',
    patterns: [
      /^\s*\.[a-zA-Z][\w-]*\s*\{/gm,
      /^\s*#[a-zA-Z][\w-]*\s*\{/gm,
      /@media\s*\([^)]+\)/g,
      /:\s*(flex|grid|block|inline|none|absolute|relative|fixed)\s*;/g,
    ],
  },
  {
    language: 'json',
    patterns: [
      /^\s*\{\s*"[^"]+"\s*:/gm,
      /^\s*\[\s*\{?\s*"?/gm,
    ],
  },
  {
    language: 'sql',
    patterns: [
      /\bSELECT\s+[\w*,\s]+\s+FROM\b/gi,
      /\bCREATE\s+(TABLE|DATABASE|INDEX)\b/gi,
      /\bINSERT\s+INTO\b/gi,
    ],
  },
  {
    language: 'bash',
    patterns: [
      /^#!/gm,
      /\$\{?\w+\}?/g,
      /\b(echo|export|source|alias)\s+/g,
    ],
  },
];

export interface CodeDetectionResult {
  isCode: boolean;
  confidence: number;
  detectedLanguage: string;
}

export function detectCode(text: string): CodeDetectionResult {
  if (!text || text.trim().length < 10) {
    return { isCode: false, confidence: 0, detectedLanguage: 'plaintext' };
  }

  const lines = text.split('\n');
  const totalChars = text.length;
  
  // Calculate code score
  let totalScore = 0;
  let matchCount = 0;

  for (const { pattern, weight } of codePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matchCount += matches.length;
      totalScore += matches.length * weight;
    }
  }

  // Normalize score based on text length
  const normalizedScore = (totalScore / Math.sqrt(totalChars)) * 10;
  
  // Additional heuristics
  const avgLineLength = totalChars / lines.length;
  const hasIndentation = lines.filter(l => l.match(/^\s{2,}/)).length > lines.length * 0.3;
  const hasBraces = (text.match(/[{}]/g)?.length || 0) > 2;
  const hasOperators = (text.match(/[=<>!+\-*/%&|^~]/g)?.length || 0) > 5;
  
  let confidence = normalizedScore;
  if (hasIndentation) confidence += 10;
  if (hasBraces) confidence += 10;
  if (hasOperators) confidence += 5;
  if (avgLineLength < 100 && avgLineLength > 10) confidence += 5;

  // Cap confidence at 100
  confidence = Math.min(100, confidence);

  // Detect language
  let detectedLanguage = 'plaintext';
  let maxLanguageScore = 0;

  for (const { language, patterns } of languagePatterns) {
    let langScore = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        langScore += matches.length;
      }
    }
    if (langScore > maxLanguageScore) {
      maxLanguageScore = langScore;
      detectedLanguage = language;
    }
  }

  const isCode = confidence >= 25;

  return {
    isCode,
    confidence: Math.round(confidence),
    detectedLanguage: isCode ? detectedLanguage : 'plaintext',
  };
}
