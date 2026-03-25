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
    const { imageUrl, chartData, generationPrompt } = await req.json();

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

    const creativeBriefSection = generationPrompt
      ? `\n\nCREATIVE BRIEF (the original prompt used to generate this artwork):\n"""\n${String(generationPrompt).substring(0, 800)}\n"""\nThis tells you exactly what was requested. Use it as CANDIDATE context — but you must still verify each element is actually visible in the image. If the brief mentions something you can't see, do NOT include it.`
      : '';

    const prompt = `You are analyzing a birth chart artwork. Your job has TWO PHASES in a single response.

PHASE 1 — OBSERVE: Look at the image carefully. Identify 2-4 distinct visual regions or elements that are clearly, unambiguously visible. For each one, give a neutral description and note its approximate position. Do NOT invent elements. If you can only confidently identify 2 regions, return 2. Never pad to 4.

PHASE 2 — MAP: For each of the four chart placements (Sun, Moon, Rising, Element), try to match it to one of your observed regions. If no observed region fits a placement well, set that mapping to null. It is BETTER to return null than to force a bad match.

The person's chart: Sun in ${sunSign} (House ${chartData.sun?.house || '?'}), Moon in ${moonSign} (House ${chartData.moon?.house || '?'}), ${rising} Rising, dominant ${dominantElement} (${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")}).${creativeBriefSection}

Respond with ONLY valid JSON (no markdown, no backticks):

{
  "subjectExplanation": "1-2 sentences, MAX 30 words. Describe the main visible subject/figure and briefly connect it to their ${sunSign} Sun / ${moonSign} Moon / ${rising} Rising combination. Reference what you ACTUALLY SEE.",

  "observedRegions": [
    {
      "regionId": "r1",
      "neutralLabel": "Short neutral description of what you see (e.g. 'A cloaked figure facing forward', 'Flowering vines along the left edge', 'A crescent shape in the upper sky')",
      "visibleEvidence": "What specifically makes this visible — shape, texture, placement (e.g. 'dark silhouette occupying center 40% of image, clear head and shoulder outline')",
      "position": { "top": <0-100>, "left": <0-100> },
      "focusBox": { "top": <0-100>, "left": <0-100>, "bottom": <0-100>, "right": <0-100> }
    }
  ],

  "chartMappings": {
    "sun": {
      "regionId": "r1 or null if no good match",
      "artworkElement": "3-6 word Title Case name for this element, or null",
      "explanation": "2 sentences max, under 300 chars. How their Sun in ${sunSign} connects to THIS visible element. Written in second person ('You...'). Or null if no match."
    },
    "moon": {
      "regionId": "r2 or null",
      "artworkElement": "3-6 word Title Case name, or null",
      "explanation": "2 sentences max, under 300 chars. How their Moon in ${moonSign} connects to THIS visible element. Or null."
    },
    "rising": {
      "regionId": "r3 or null",
      "artworkElement": "3-6 word Title Case name, or null",
      "explanation": "2 sentences max, under 300 chars. How their ${rising} Rising connects to the composition/framing. Or null."
    },
    "element": {
      "regionId": "r4 or null",
      "artworkElement": "3-6 word Title Case name, or null",
      "explanation": "2 sentences max, under 300 chars. How their dominant ${dominantElement} element connects to the feel/weight of the artwork. Or null."
    }
  }
}

PHASE 1 RULES (observedRegions):
- Return 2-4 regions. NEVER invent elements to reach 4.
- neutralLabel must describe what is LITERALLY VISIBLE — no interpretation yet.
- visibleEvidence must cite specific visual proof (shape, outline, texture, contrast).
- If you cannot write convincing visibleEvidence, do NOT include that region.
- Positions: approximate center as percentage (0=top/left, 100=bottom/right).
- focusBox: tight bounding rectangle. top < bottom, left < right.

PHASE 2 RULES (chartMappings):
- Each mapping's regionId MUST reference an observedRegion, or be null.
- Multiple mappings MAY reference the same region if appropriate.
- NULL IS GOOD. A null mapping is vastly better than a forced, unconvincing match.
- explanation must connect the person's specific chart placement to the VISIBLE element.
- Write in second person ("You..."). Talk about them, connect to the artwork.

WRITING RULES FOR ALL "explanation" FIELDS:
- Answer: "How did this astrological placement shape what's in the artwork?"
- Conversational and grounded. Like a smart friend, not a horoscope.
- Focus on SUBJECTS, OBJECTS, COMPOSITION, TEXTURES, and MOOD.${generationPrompt ? '\n- The creative brief tells you what was intended — use it to make PRECISE connections, but only for elements you can actually see.' : ''}
- NEVER mention colors or color palette (colors come from the style, not the chart).
- NEVER mention art style, medium, or technique (e.g. "watercolor", "collage").
- No mystical fluff. No "the cosmos," "your journey," "celestial," "cosmic blueprint."
- Max 2 sentences. Max 300 characters. Keep them tight.
- BANNED WORDS: represent, symbolize, vibrant, intricate, tapestry, journey, essence, energy, manifest, celestial, cosmic
- BAD: "The silvered linework reflects the cosmic precision of your Virgo moon."
- BAD: "The deep blues capture your water-dominant nature." (no color references!)
- GOOD: "You tend to notice what others miss — the small inconsistency, the better way. That's your Virgo Moon, and it's why this section is built from fine, precise lines."
- GOOD: "Your Scorpio Rising means people sense your intensity before you say a word. That's why the composition leads with this bold, layered foreground."

OUTPUT ONLY VALID JSON. No preamble, no commentary.`;

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
          max_tokens: 1500,
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

    let rawAnalysis;
    try {
      rawAnalysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", cleaned);
      throw new Error("AI returned invalid JSON");
    }

    // ─── VALIDATE & TRANSFORM ───
    const regions = rawAnalysis.observedRegions;
    if (!Array.isArray(regions) || regions.length < 1) {
      throw new Error("No observed regions returned");
    }

    // Build a lookup map of observed regions by ID
    const regionMap: Record<string, any> = {};
    for (const r of regions) {
      if (r.regionId) regionMap[r.regionId] = r;
    }

    const mappings = rawAnalysis.chartMappings || {};

    // Validate each mapping: reject weak evidence, unknown region refs
    const placements = ["sun", "moon", "rising", "element"] as const;
    for (const key of placements) {
      const m = mappings[key];
      if (!m) {
        mappings[key] = { regionId: null, artworkElement: null, explanation: null };
        continue;
      }

      if (m.regionId && !regionMap[m.regionId]) {
        console.warn(`[analyze-artwork] ${key} references unknown region ${m.regionId}, nulling`);
        m.regionId = null;
        m.artworkElement = null;
        m.explanation = null;
      }

      if (m.regionId) {
        const region = regionMap[m.regionId];
        if (!region.visibleEvidence || region.visibleEvidence.length < 15) {
          console.warn(`[analyze-artwork] ${key} region ${m.regionId} has weak evidence, nulling`);
          m.regionId = null;
          m.artworkElement = null;
          m.explanation = null;
        }
      }
    }

    // Hard-truncate explanations exceeding 300 chars
    for (const key of placements) {
      const text: string = mappings[key]?.explanation;
      if (text && text.length > 300) {
        const truncated = text.substring(0, 297).replace(/\s+\S*$/, '');
        mappings[key].explanation = truncated + '…';
        console.warn(`[analyze-artwork] Truncated ${key}.explanation from ${text.length} chars`);
      }
    }

    // Build final response (backward-compatible shape)
    const analysis: Record<string, any> = {
      subjectExplanation: rawAnalysis.subjectExplanation || null,
      observedRegions: regions,
    };

    for (const key of placements) {
      const m = mappings[key];
      const region = m?.regionId ? regionMap[m.regionId] : null;

      analysis[key] = {
        artworkElement: m?.artworkElement || null,
        explanation: m?.explanation || null,
        visibleEvidence: region?.visibleEvidence || null,
        position: region?.position || null,
        focusBox: region?.focusBox || null,
        mapped: m?.regionId !== null && m?.regionId !== undefined,
      };
    }

    console.log(`[analyze-artwork] Success: ${regions.length} regions observed, ${placements.filter(k => analysis[k].mapped).length}/4 mapped`);

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
