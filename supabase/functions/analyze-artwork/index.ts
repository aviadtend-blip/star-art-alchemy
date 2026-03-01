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

    const prompt = `You are the artist who created this birth chart artwork. Study the image and write punchy, mystical artist's notes.

The person's chart: Sun in ${sunSign}, Moon in ${moonSign}, ${rising} Rising, dominant ${dominantElement} (${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")}).

Write JSON (no markdown, no backticks):
{
  "subjectExplanation": "1-2 sentences, MAX 30 words. Format: 'Your birth chart reveals [key personality insight] — we chose [subject/creature/figure visible in the artwork] as your cosmic guardian because it embodies your [specific chart qualities].' Be specific to their ${sunSign} Sun, ${moonSign} Moon, ${rising} Rising combination. Reference the actual main subject/creature/figure you see in the image.",
  "sun": {
    "explanation": "1-2 SHORT punchy sentences. What you see in the sun/central element and how their ${sunSign} Sun inspired it. Mystical tone, not academic.",
    "insight": "1 sentence — a specific visual detail you're proud of.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "moon": {
    "explanation": "1-2 SHORT punchy sentences about the moon element and mood, inspired by Moon in ${moonSign}.",
    "insight": "1 sentence — a specific creative decision.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "rising": {
    "explanation": "1-2 SHORT punchy sentences about composition/framing inspired by ${rising} Rising.",
    "insight": "1 sentence — a compositional choice.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "element": {
    "explanation": "1-2 SHORT punchy sentences about the color palette, inspired by ${dominantElement}-dominant chart.",
    "insight": "1 sentence — how the colors work together.",
    "position": { "top": <0-100>, "left": <0-100> }
  }
}

STYLE RULES:
- Each explanation must be readable in 3-4 seconds. Max 25 words per sentence.
- subjectExplanation MUST be max 30 words and reference the actual visible subject/creature/figure
- Mystical and warm, NOT academic or verbose. Example: "Your fire-dominant chart blazes through in amber and crimson — pure passion made visible."
- Use dashes, fragments, and poetic compression. Avoid filler words.
- First person as the artist ("I chose...", "I let...")
- ONLY describe what's ACTUALLY VISIBLE — don't invent elements
- Never use: represent, symbolize, vibrant, intricate, tapestry, journey, essence, energy, manifest

POSITION RULES:
- Position = approximate center of each element as percentage (0=top/left, 100=bottom/right)
- Keep at least 15 percentage points apart vertically
- Output ONLY valid JSON, no preamble`;


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