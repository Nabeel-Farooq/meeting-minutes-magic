import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { notes } = await req.json();
    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Notes are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a meeting notes analyst. Extract structured information from raw meeting notes. You must call the extract_summary function with the results.`,
          },
          { role: "user", content: notes },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_summary",
              description: "Extract a structured summary from meeting notes",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A concise 2-3 sentence overview of what was discussed and decided",
                  },
                  actionItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string", description: "The action to be done" },
                        assignee: { type: "string", description: "Person responsible. Use 'Unassigned' if unclear" },
                        deadline: { type: "string", description: "When it's due. Use 'No deadline' if unclear" },
                      },
                      required: ["task", "assignee", "deadline"],
                    },
                  },
                  keyDecisions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important decisions or conclusions reached",
                  },
                },
                required: ["summary", "actionItems", "keyDecisions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_summary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output returned");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-notes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
