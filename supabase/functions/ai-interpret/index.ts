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
      ? `\n\nThe artwork must weave together multiple visual elements that represent this person's chart. Include one figure from the following list as ONE element of the composition — not the dominant focal point: ${suggestedSubjects.join(', ')}. This figure should occupy no more than a third of the visual weight. The rest of the composition should be filled with symbolic objects, textures, environments, and atmospheric details drawn from the chart's aspects, element balance, and planetary tensions. Think of it as a rich collage where the figure lives AMONG the other symbols, not above them. Do NOT create a portrait centered on the figure — create a world that contains the figure.`
      : '';

    const prompt = `You are a mythic scene painter. Given a birth chart, write ONE paragraph of 4 sentences (60-80 words total) describing a scene for artwork generation.${subjectDirective}

Chart's Big Three:
- Sun sign: ${sanitizeForPrompt(chartData.sun?.sign)}${isPortraitEdition ? ' — IMPORTANT: the subject MUST be a human figure (a person) whose appearance, clothing, posture or adornments channel the sign. No creatures, no animals, no abstract forms as the main subject — a human face must be clearly visible and central in the composition.' : ''}${gender && gender !== 'prefer_not_to_say' ? ` The central figure should be ${sanitizeForPrompt(gender)}.` : ''}
- Moon sign: ${sanitizeForPrompt(chartData.moon?.sign)}
- Rising sign: ${sanitizeForPrompt(chartData.rising)}

Additional chart features to weave in:
- Dominant feature: ${interpretation.dominantFeature || 'none'}
- Core tension: ${interpretation.coreParadox}
- Key aspects: ${highPriorityAspects || 'none notable'}
- Dignity issues: ${dignityText}

Write exactly 4 sentences following this structure:
Sentence 1: Describe the overall environment, atmosphere, and landscape of the scene — driven by the dominant element and modality. This sets the world the artwork lives in.
Sentence 2: Describe 2-3 symbolic objects, textures, or natural elements scattered through the scene that represent the chart's key aspects and tensions. Be concrete — name materials, surfaces, and forms.
Sentence 3: Place the suggested figure naturally within this environment as one element among many — partially obscured, mid-action, or integrated into the surroundings rather than posed front-and-center.
Sentence 4: Describe one vivid visual detail that captures the person's most unique chart feature — a lighting effect, a crack in a surface, a color shift, something that couldn't belong to anyone else's artwork.

RULES:
- Every visual choice must trace back to a specific chart placement — no generic fantasy
- Use concrete materials, textures, and forms — not abstract concepts
- Do NOT mention colors or palettes — the style handles that
- Do NOT use astrology jargon in the output
- Forbidden words: energy, essence, vibrant, intricate, dynamic, balance, harmony, journey, tapestry, represent, symbolize, ethereal, celestial

Output ONLY the scene paragraph. Nothing else.`;

    console.log("[DEBUG] gender:", chartData.gender, "| suggestedSubjects:", JSON.stringify(suggestedSubjects), "| prompt preview:", prompt.substring(0, 200));

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
