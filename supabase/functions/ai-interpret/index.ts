import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sanitize values before interpolating into AI prompts
function sanitizeForPrompt(value: string): string {
  if (!value || typeof value !== 'string') return 'Unknown';
  return value.replace(/[^a-zA-Z0-9\s\-.,()°]/g, '').substring(0, 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { chartData, isPortraitEdition, gender } = await req.json();
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
    const suggestedSubjects: string[] = interpretation.suggestedSubjects || [];
    const subjectDirective = suggestedSubjects.length > 0
      ? `\n\nThe main subject of the artwork MUST be one of the following figures: ${suggestedSubjects.join(', ')}. Choose whichever fits the chart's personality best. Do NOT use everyday objects (typewriters, shoes, tools), small or mundane animals (frogs, insects, rodents), or anything the person would not feel proud to be represented by. The subject must feel like a symbol of power, grace, or cosmic identity — something the person would want hanging on their wall as a portrait of who they are.`
      : '';

    const prompt = `You are a mythic scene painter. Given a birth chart, write ONE paragraph of 60-80 words describing a scene for artwork generation.${subjectDirective}

The scene MUST be built from the chart's Big Three:
- The SUBJECT must directly embody the Sun sign: ${sanitizeForPrompt(chartData.sun?.sign)}${isPortraitEdition ? ' — IMPORTANT: the subject MUST be a human figure (a person) whose appearance, clothing, posture or adornments channel the sign. No creatures, no animals, no abstract forms as the main subject — a human face must be clearly visible and central in the composition.' : ' — can be a figure, creature, mythic form or abstract embodiment of the sign.'}${gender && gender !== 'prefer_not_to_say' ? ` The central figure should be ${sanitizeForPrompt(gender)}.` : ''}
- The ENVIRONMENT/LANDSCAPE must reflect the Moon sign: ${sanitizeForPrompt(chartData.moon?.sign)}
- The MOOD and SURFACE TEXTURE must channel the Rising sign: ${sanitizeForPrompt(chartData.rising)}

Additional chart features to weave in:
- Dominant feature: ${interpretation.dominantFeature || 'none'}
- Core tension: ${interpretation.coreParadox}
- Key aspects: ${highPriorityAspects || 'none notable'}
- Dignity issues: ${dignityText}

RULES:
- Every visual choice must trace back to a specific chart placement — no generic fantasy
- Use concrete materials, textures, and forms — not abstract concepts
- Do NOT mention colors or palettes — the style handles that
- Do NOT use astrology jargon in the output
- Forbidden words: energy, essence, vibrant, intricate, dynamic, balance, harmony, journey, tapestry, represent, symbolize, ethereal, celestial

Output ONLY the scene paragraph. Nothing else.`;

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
