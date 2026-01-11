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
            content: `You are a code language detector. Analyze the given code and respond ONLY with a single word - the programming language name in lowercase. 
            
Valid responses: javascript, typescript, python, java, cpp, csharp, php, ruby, go, rust, html, css, json, xml, sql, markdown, yaml, shell, swift, kotlin, scala, dart, r, perl, lua, haskell, elixir, clojure, graphql, dockerfile, makefile, plaintext

If uncertain or not code, respond with: plaintext

Do not include any explanation, punctuation, or additional text.`,
          },
          {
            role: "user",
            content: truncatedCode,
          },
        ],
        max_tokens: 20,
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
    const detectedLanguage = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "plaintext";

    // Validate the response is a known language
    const validLanguages = [
      "javascript", "typescript", "python", "java", "cpp", "csharp", "php", "ruby",
      "go", "rust", "html", "css", "json", "xml", "sql", "markdown", "yaml", "shell",
      "swift", "kotlin", "scala", "dart", "r", "perl", "lua", "haskell", "elixir",
      "clojure", "graphql", "dockerfile", "makefile", "plaintext"
    ];

    const language = validLanguages.includes(detectedLanguage) ? detectedLanguage : "plaintext";

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
