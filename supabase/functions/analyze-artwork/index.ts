import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, chartData } = await req.json();

    if (!imageUrl || !chartData) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl or chartData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch the image and convert to base64 (chunked to avoid stack overflow)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64Image = btoa(binary);
    const contentType = imageResponse.headers.get("content-type") || "image/png";

    // Build chart context for the prompt
    const sunSign = chartData.sun?.sign || "Unknown";
    const moonSign = chartData.moon?.sign || "Unknown";
    const rising = chartData.rising || "Unknown";
    const elementBalance = chartData.element_balance || {};
    const dominantElement = Object.keys(elementBalance).reduce(
      (a, b) => (elementBalance[a] > elementBalance[b] ? a : b),
      "Fire"
    );

    const prompt = `You are the artist who created this birth chart artwork. Look at the actual image carefully and write artist's notes explaining your creative choices.

The person's birth chart has:
- Sun in ${sunSign}
- Moon in ${moonSign}
- ${rising} Rising
- Dominant element: ${dominantElement} (balance: ${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")})

Study the image closely. Identify the actual visual elements you see — the colors, shapes, flowers, textures, composition, moon forms, sun forms, patterns, and mood.

Write your response as JSON with this exact structure (no markdown, no backticks, just raw JSON):
{
  "sun": {
    "explanation": "2-3 sentences as the artist explaining what you chose for the sun/central element and why their Sun in ${sunSign} inspired those specific visual choices. Reference what you ACTUALLY see in the image.",
    "insight": "1-2 sentences about a specific visual technique or detail you're proud of in the sun area, and why it matters for this placement.",
    "position": { "top": <number 0-100>, "left": <number 0-100> }
  },
  "moon": {
    "explanation": "2-3 sentences as the artist explaining the moon element, atmospheric quality, and emotional texture you created, inspired by their Moon in ${moonSign}. Reference what you ACTUALLY see.",
    "insight": "1-2 sentences about a specific creative decision in the moon/atmosphere area.",
    "position": { "top": <number 0-100>, "left": <number 0-100> }
  },
  "rising": {
    "explanation": "2-3 sentences as the artist explaining the overall composition style, framing, and aesthetic approach inspired by their ${rising} Rising. Reference the actual layout and style you see.",
    "insight": "1-2 sentences about a compositional choice that reflects this rising sign.",
    "position": { "top": <number 0-100>, "left": <number 0-100> }
  },
  "element": {
    "explanation": "2-3 sentences as the artist explaining the color palette and overall energy, inspired by their ${dominantElement}-dominant chart. Reference the actual colors and tones you see.",
    "insight": "1-2 sentences about how the color relationships work throughout the piece.",
    "position": { "top": <number 0-100>, "left": <number 0-100> }
  }
}

POSITION RULES:
- For each element, set "position" to the approximate center of where that element appears in the image as a percentage (0=top/left edge, 100=bottom/right edge).
- "sun" position: where the main sun or central bright focal element is located.
- "moon" position: where the moon, crescent, or secondary celestial body is located.
- "rising" position: pick a notable compositional or border/framing detail that reflects the rising sign style.
- "element" position: pick a region where the dominant color palette is most visible or concentrated.
- Spread the four positions so they don't overlap — keep at least 15 percentage points apart vertically.

CRITICAL RULES:
- Write in first person as the artist ("I chose...", "I wanted...", "I used...")
- ONLY describe what is ACTUALLY VISIBLE in the image — do not invent elements that aren't there
- Connect each visual choice back to the specific astrological placement that inspired it
- Be specific about colors, shapes, textures, and composition you can see
- Keep it warm and passionate but not cheesy — like a real artist at a gallery opening
- Never use the words: represent, symbolize, vibrant, intricate, tapestry, journey, essence
- Output ONLY valid JSON, no preamble, no markdown fencing`;

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
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${contentType};base64,${base64Image}`,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1200,
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
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error("Empty AI response");
    }

    // Parse the JSON response — strip any markdown fencing if the model added it
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", cleaned);
      throw new Error("AI returned invalid JSON");
    }

    // Validate structure
    const required = ["sun", "moon", "rising", "element"];
    for (const key of required) {
      if (!analysis[key]?.explanation || !analysis[key]?.insight) {
        console.error(`Missing ${key}.explanation or ${key}.insight in response`);
        throw new Error(`Incomplete analysis: missing ${key}`);
      }
    }

    console.log("[analyze-artwork] Successfully analyzed artwork");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-artwork error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});