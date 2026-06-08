/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required", language: "plaintext" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Truncate very long code to save tokens
    const truncatedCode = code.length > 2000 ? code.slice(0, 2000) : code;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured", language: "plaintext" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an expert programming-language detector. Identify the language of the snippet — it can be ANY programming, scripting, markup, query, config, or shader language in the world (well-known or obscure: e.g. javascript, typescript, python, rust, go, kotlin, swift, dart, elixir, gleam, zig, nim, crystal, ocaml, fsharp, scala, julia, fortran, cobol, ada, prolog, scheme, racket, lisp, haskell, idris, agda, solidity, move, vyper, cairo, wgsl, hlsl, glsl, verilog, vhdl, tcl, autohotkey, applescript, postscript, latex, vue, svelte, astro, prisma, terraform, hcl, nix, ini, toml, env, etc.).

Rules:
- Reply with ONLY the canonical language name in lowercase (one word, no version, no description, no punctuation, no markdown).
- Use a single common slug (e.g. "c++" -> "cpp", "c#" -> "csharp", "objective-c" -> "objectivec", "f#" -> "fsharp").
- If it is clearly NOT source code or you genuinely cannot tell, reply: plaintext`,
          },
          {
            role: "user",
            content: truncatedCode,
          },
        ],
        max_tokens: 12,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error", language: "plaintext" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    let detectedLanguage = (data.choices?.[0]?.message?.content || "plaintext")
      .trim()
      .toLowerCase()
      .replace(/[`"'.,;:!?]/g, "")
      .split(/\s+/)[0] || "plaintext";

    // Normalize a few common aliases
    const aliases: Record<string, string> = {
      "c++": "cpp",
      "c#": "csharp",
      "f#": "fsharp",
      "objective-c": "objectivec",
      "obj-c": "objectivec",
      "js": "javascript",
      "ts": "typescript",
      "py": "python",
      "rb": "ruby",
      "sh": "shell",
      "bash": "shell",
      "zsh": "shell",
    };
    detectedLanguage = aliases[detectedLanguage] ?? detectedLanguage;

    const language = detectedLanguage || "plaintext";

    return new Response(
      JSON.stringify({ language, isCode: language !== "plaintext" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error detecting language:", error);
    return new Response(
      JSON.stringify({ error: "Failed to detect language", language: "plaintext" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
