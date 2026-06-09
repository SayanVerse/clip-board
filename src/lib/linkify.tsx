import React from "react";

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

export function isUrlOnly(text?: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.includes("\n")) return false;
  return URL_REGEX.test(trimmed) && trimmed.replace(URL_REGEX, "").trim().length === 0;
}

export function linkify(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  // Reset regex state
  const re = new RegExp(URL_REGEX.source, "gi");
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const url = match[0];
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={`lk-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-primary underline underline-offset-2 break-all hover:opacity-80"
      >
        {url}
      </a>,
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
