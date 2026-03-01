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

    const prompt = `You are a visual storyteller who translates astrological birth charts into vivid scene descriptions for artwork generation.

Given this natal chart data, write 1-2 sentences in exactly 60-80 words describing a vivid cosmic scene that captures who this person is. MAXIMUM 80 words.

RULES:
- Describe a SCENE with a subject, environment, and mood — NOT art materials or craft supplies
- The subject should be a symbolic creature, figure, or entity that embodies their chart
- The environment should reflect their inner world and tensions
- Use the chart's unique features (stelliums, tight aspects, dignities) to drive SPECIFIC visual choices
- Do NOT mention colors or color palettes — the style handles that
- Do NOT use generic zodiac descriptions ("passionate fire sign") — be specific to THIS chart
- Do NOT include technical astrology terms in the output
- Write in a poetic but concrete visual style
- Forbidden words: energy, essence, vibrant, intricate, dynamic, balance, harmony, journey, tapestry, represent, symbolize, ethereal, celestial

Chart data:
- Sun: ${chartData.sun?.sign} in House ${chartData.sun?.house}
- Moon: ${chartData.moon?.sign} in House ${chartData.moon?.house}
- Rising: ${chartData.rising}
- Dominant feature: ${interpretation.dominantFeature}
- Core tension: ${interpretation.coreParadox}
- Key aspects: ${highPriorityAspects}
- Dignity issues: ${dignityText}

Output ONLY the 2-3 sentence scene description. Nothing else.`;

    console.log("AI interpret prompt built, calling gateway...");

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
    console.log("AI narrative received:", narrative);

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
