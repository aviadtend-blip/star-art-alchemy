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

    // Sanitize values before interpolating into AI prompts
    const sanitize = (val: string): string => {
      if (!val || typeof val !== 'string') return 'Unknown';
      return val.replace(/[^a-zA-Z0-9\s\-.,()°]/g, '').substring(0, 100);
    };

    // Build chart context for the prompt
    const sunSign = sanitize(chartData.sun?.sign);
    const moonSign = sanitize(chartData.moon?.sign);
    const rising = sanitize(chartData.rising);
    const elementBalance = chartData.element_balance || {};
    const dominantElement = sanitize(
      Object.keys(elementBalance).reduce(
        (a, b) => (elementBalance[a] > elementBalance[b] ? a : b),
        "Fire"
      )
    );

    const prompt = `You created this birth chart artwork. Study the image and write grounded, conversational hotspot notes that explain how each astrological placement shaped what you created.

The person's chart: Sun in ${sunSign} (House ${chartData.sun?.house || '?'}), Moon in ${moonSign} (House ${chartData.moon?.house || '?'}), ${rising} Rising, dominant ${dominantElement} (${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")}).

Write JSON (no markdown, no backticks):

{
  "subjectExplanation": "1-2 sentences, MAX 30 words. Format: 'Your birth chart reveals [key personality insight] — we chose [subject/creature/figure visible in the artwork] as your cosmic guardian because it embodies your [specific chart qualities].' Be specific to their ${sunSign} Sun, ${moonSign} Moon, ${rising} Rising combination. Reference the actual main subject/creature/figure you see in the image.",
  "sun": {
    "artworkElement": "A short name (3-6 words, Title Case) for the specific visual element this hotspot points to.",
    "explanation": "2 sentences max, under 300 characters. Explain how this person's Sun in ${sunSign} influenced this part of the artwork — what subject, object, or scene element was chosen because of it, and what personality trait it reflects. See WRITING RULES.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "moon": {
    "artworkElement": "A short name (3-6 words, Title Case) for the moon-influenced visual element.",
    "explanation": "2 sentences max, under 300 characters. Explain how this person's Moon in ${moonSign} influenced this part of the artwork — what mood, texture, or atmospheric element was chosen because of it, and what emotional pattern it reflects. See WRITING RULES.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "rising": {
    "artworkElement": "A short name (3-6 words, Title Case) for the composition/framing element.",
    "explanation": "2 sentences max, under 300 characters. Explain how this person's ${rising} Rising influenced the overall composition and framing of the artwork — why the scene is arranged the way it is, and what first-impression trait it reflects. See WRITING RULES.",
    "position": { "top": <0-100>, "left": <0-100> }
  },
  "element": {
    "artworkElement": "A short name (3-6 words, Title Case) for the element-influenced visual aspect.",
    "explanation": "2 sentences max, under 300 characters. Explain how this person's dominant ${dominantElement} element influenced the feel and weight of the artwork — what visual density, movement, or stillness was chosen because of it, and what it says about them. See WRITING RULES.",
    "position": { "top": <0-100>, "left": <0-100> }
  }
}

WRITING RULES FOR "explanation" FIELDS:
- Each explanation must answer: "How did this astrological placement shape what's in the artwork?"
- Write in second person ("You...") — talk about the person's traits and connect them to the artwork choices.
- Conversational and grounded. The reader should feel like they could explain this to a friend looking at the artwork on their wall.
- Focus on SUBJECTS, OBJECTS, COMPOSITION, TEXTURES, and MOOD — the things that were influenced by the chart.
- NEVER mention colors or color palette. The colors are determined by the selected art style, not the chart.
- NEVER mention the art style, medium, or artistic technique (e.g. "watercolor", "oil painting", "collage style"). The style is the user's choice, not astrologically driven.
- No mystical fluff. No "the cosmos," no "your journey," no "celestial," no "cosmic blueprint." Speak plainly.
- Max 2 sentences. Max 300 characters. Keep them tight.
- Tone: like a smart friend explaining something true about you, not a horoscope.
- BAD: "The silvered linework reflects the cosmic precision of your Virgo moon, weaving celestial intention into every carefully rendered detail."
- BAD: "The deep blues and purples of this section capture your water-dominant nature." (Don't reference colors!)
- BAD: "The dreamy watercolor technique mirrors your Pisces Moon." (Don't reference art style!)
- GOOD: "You tend to notice the things other people miss — the small inconsistency, the better way to do something. That's your Virgo Moon, and it's why this section is built from fine, precise lines."
- GOOD: "Your Scorpio Rising means people sense your intensity before you say a word. That's why the composition leads with this bold, layered foreground."

STYLE RULES:
- artworkElement MUST name a specific visible element in the artwork (3-6 words, Title Case)
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