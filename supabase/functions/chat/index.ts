import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: { role: string; content: string }[];
  generateImage?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, generateImage }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle image generation
    if (generateImage) {
      const imagePrompt = messages[messages.length - 1]?.content || "A beautiful image";
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Generate a high-quality image: ${imagePrompt}`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        console.error("Image generation error:", response.status, await response.text());
        return new Response(
          JSON.stringify({ error: "Failed to generate image" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      return new Response(
        JSON.stringify({ imageUrl, message: data.choices?.[0]?.message?.content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular chat completion
    const systemPrompt = `You are a highly capable AI assistant, similar to ChatGPT or Gemini. You can help with virtually anything:

## Your Capabilities:
- **General Knowledge**: Answer questions on any topic accurately and comprehensively
- **Code Assistance**: Write, debug, explain, and optimize code in any programming language
- **Writing**: Help with essays, emails, creative writing, summaries, and more
- **Analysis**: Break down complex problems, analyze data, and provide insights
- **Math & Science**: Solve equations, explain concepts, help with homework
- **Languages**: Translate, explain grammar, help learn new languages
- **Research**: Synthesize information and provide well-sourced answers
- **Creative Tasks**: Brainstorm ideas, write stories, create content

## Response Guidelines:
1. **Use Markdown formatting** for all responses:
   - Use **bold** for emphasis on key terms
   - Use \`inline code\` for commands, function names, variables
   - Use code blocks with language specification for code:
   \`\`\`python
   def example():
       return "Hello"
   \`\`\`
   - Use bullet points and numbered lists for organization
   - Use headers (##, ###) to structure longer responses
   - Use > blockquotes for important notes or warnings

2. **Be thorough but concise** - provide complete answers without unnecessary padding

3. **For code requests**:
   - Always include the programming language in code blocks
   - Add helpful comments in the code
   - Explain the approach before or after the code
   - Suggest improvements or alternatives when relevant

4. **For explanations**:
   - Start with a brief summary
   - Then provide detailed explanation
   - Use examples to illustrate concepts
   - End with key takeaways if appropriate

5. **Be honest** - if you're unsure about something, say so

6. **Be helpful and professional** - aim to genuinely help the user accomplish their goals`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
