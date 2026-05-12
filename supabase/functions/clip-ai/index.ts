import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Action = "summarize" | "translate" | "explain" | "grammar";

const PROMPTS: Record<Action, (lang?: string) => string> = {
  summarize: () =>
    "Summarize the following content concisely in 2-4 sentences. Output only the summary, no preamble.",
  translate: (lang) =>
    `Translate the following text to ${lang || "English"}. Output only the translation, no preamble or notes.`,
  explain: () =>
    "Explain what the following code does in clear, simple language. Cover the purpose, key logic, and any notable details. Use markdown.",
  grammar: () =>
    "Fix grammar, spelling, and punctuation in the following text. Preserve the original meaning, tone, and language. Output only the corrected text.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, content, targetLang } = await req.json();
    if (!action || !content || !PROMPTS[action as Action]) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = PROMPTS[action as Action](targetLang);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: String(content).slice(0, 20000) },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const result = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clip-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
