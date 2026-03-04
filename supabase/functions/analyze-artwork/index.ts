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

    const prompt = `You created this birth chart artwork. Study the image and write grounded, conversational hotspot notes.

The person's chart: Sun in ${sunSign} (House ${chartData.sun?.house || '?'}), Moon in ${moonSign} (House ${chartData.moon?.house || '?'}), ${rising} Rising, dominant ${dominantElement} (${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")}).

Write JSON (no markdown, no backticks):
{
  "subjectExplanation": "1-2 sentences, MAX 30 words. Format: 'Your birth chart reveals [key personality insight] — we chose [subject/creature/figure visible in the artwork] as your cosmic guardian because it embodies your [specific chart qualities].' Be specific to their ${sunSign} Sun, ${moonSign} Moon, ${rising} Rising combination. Reference the actual main subject/creature/figure you see in the image.",
  "sun": {
    "artworkElement": "A short name (3-6 words) for the specific visual element in the artwork this hotspot points to. Example: 'The gilded central sunburst', 'The blazing crimson petals'",
    "explanation": "2 sentences max about this person's Sun placement. See WRITING RULES below.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "moon": {
    "artworkElement": "A short name (3-6 words) for the moon-inspired visual element. Example: 'The silvered crescent forms', 'The deep indigo undertow'",
    "explanation": "2 sentences max about this person's Moon placement. See WRITING RULES below.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "rising": {
    "artworkElement": "A short name (3-6 words) for the composition/framing element. Example: 'The angular architectural edges', 'The flowing border tendrils'",
    "explanation": "2 sentences max about this person's Rising sign. See WRITING RULES below.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "element": {
    "artworkElement": "A short name (3-6 words) for the color palette element. Example: 'The warm amber-to-crimson wash', 'The oceanic blue depth'",
    "explanation": "2 sentences max about this person's dominant element. See WRITING RULES below.",
    "position": { "top": <0-100>, "left": <0-100> }
  }
}

WRITING RULES FOR "explanation" FIELDS:
- Write in second person ("You...")
- Conversational and grounded. The reader should feel like they could read this once and then naturally explain it to a friend standing in their home looking at the artwork on the wall.
- Most of the sentence should be about the PERSON — their personality, how they move through the world, what they value, how they relate to others — NOT about what's visually on the artwork.
- Only briefly anchor to the artwork element at the end (one clause max), so the reader knows what to point at.
- No mystical fluff. No "the cosmos," no "your journey," no "celestial," no "cosmic blueprint." Speak plainly.
- Max 2 sentences per hotspot. Keep them short.
- Tone: like a smart friend explaining something true about you, not a horoscope.
- BAD example: "The silvered linework reflects the cosmic precision of your Virgo moon, weaving celestial intention into every carefully rendered detail of your birth map."
- GOOD example: "You tend to notice the things other people miss — the small inconsistency, the better way to do something. That's your Virgo Moon, and it's why this section is built from fine, precise lines."

STYLE RULES:
- artworkElement MUST name a specific visible element in the artwork (3-6 words, title case)
- subjectExplanation MUST be max 30 words and reference the actual visible subject/creature/figure
- First person as the artist for subjectExplanation only ("I chose...", "I let...")
- ONLY describe what's ACTUALLY VISIBLE — don't invent elements
- Never use: represent, symbolize, vibrant, intricate, tapestry, journey, essence, energy, manifest, celestial, cosmic

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
      if (!analysis[key]?.explanation || !analysis[key]?.artworkElement) {
        console.error(`Missing ${key}.explanation or ${key}.artworkElement in response`);
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