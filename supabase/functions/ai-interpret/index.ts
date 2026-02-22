import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { chartData } = await req.json();
    if (!chartData?.interpretation) {
      return new Response(
        JSON.stringify({ error: "Missing interpretation data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { interpretation } = chartData;

    const highPriorityAspects = (interpretation.aspectWeights || [])
      .filter((a: any) => a.priority === "critical" || a.priority === "high")
      .map((a: any) => `${a.planet1} ${a.type} ${a.planet2} (${a.orb}° orb)`)
      .join(", ");

    const dignityText =
      interpretation.dignityFlags?.length > 0
        ? interpretation.dignityFlags
            .map((d: any) => `${d.planet} in ${d.dignity}`)
            .join(", ")
        : "none";

    const prompt = `You are an astrologer writing visual art direction for a personalized abstract collage artwork.

Given this natal chart, write exactly 4 sentences describing who this person is at their core and how that should manifest visually. Be specific to this exact chart combination — avoid generic zodiac descriptions.

Sentence 1: Their dominant personality pattern and how it should dominate the composition.
Sentence 2: Their central inner tension and how to show it as visual contrast or conflict in the artwork.
Sentence 3: How their emotional nature (moon) sits underneath their outer presentation (rising).
Sentence 4: One specific visual instruction that captures their most unique chart feature.

Chart facts:
- Dominant feature: ${interpretation.dominantFeature}
- Core pattern: ${interpretation.coreParadox}
- Tight aspects (these shape personality most): ${highPriorityAspects || "none"}
- Dignity tensions: ${dignityText}
- Sun: ${chartData.sun?.sign} in House ${chartData.sun?.house}
- Moon: ${chartData.moon?.sign} in House ${chartData.moon?.house}
- Rising: ${chartData.rising}

Be concise. Avoid repeating adjectives. Each sentence should contain one clear visual instruction.

Output only the 4 sentences. No headers, no preamble, no bullet points.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const narrative = data.choices?.[0]?.message?.content?.trim();

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-interpret error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
