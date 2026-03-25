import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDominantElement, sanitizeAiHotspotAnalysis } from "../_shared/hotspotAnalysis.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, chartData, generationPrompt, promptUsed, styleId } = await req.json();

    if (!imageUrl || !chartData) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl or chartData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch the image and convert to base64
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

    const sanitize = (val: string): string => {
      if (!val || typeof val !== 'string') return 'Unknown';
      return val.replace(/[^a-zA-Z0-9\s\-.,()°]/g, '').substring(0, 100);
    };

    const sunSign = sanitize(chartData.sun?.sign);
    const moonSign = sanitize(chartData.moon?.sign);
    const rising = sanitize(chartData.rising);
    const elementBalance = chartData.element_balance || {};
    const dominantElement = sanitize(getDominantElement(elementBalance));

    const usedPrompt = promptUsed || generationPrompt || null;

    const candidateContext = usedPrompt
      ? `\n\nCANDIDATE CONTEXT (the prompt used to generate this artwork — use as weak hints only, you MUST verify everything against the actual image):\n"""\n${String(usedPrompt).substring(0, 800)}\n"""`
      : '';

    const styleHint = styleId ? `\nStyle ID: "${sanitize(styleId)}" (for context only, do NOT reference art style in explanations).` : '';

    const prompt = `You are analyzing a birth chart artwork. Respond in ONE JSON block covering three logical phases.

PHASE 1 — OBSERVE: Look at the image carefully. Identify 3-6 distinct visible regions, objects, figures, or elements. For each, give a concrete literal label naming what you SEE.

LABEL RULES:
- Labels must name a CONCRETE VISIBLE THING you can point at in the image.
- Use 1-4 words. No articles ("The") at the start. Apostrophes are OK.
- PREFER specific object nouns: figure, person, face, hand, bird, dove, moon, orb, halo, books, staircase, archway, doorway, horn, muzzle, reeds, branches, waterline, reflection, shoreline, wing, mountain, flower, clock face, tower, window, bull, eye, crown, skull, serpent, veil, column, bridge, gate, roots, waves, flame
- GOOD labels: "White Dove", "Bull's Horns", "Writing Hand", "Clock Face", "Stone Archway", "Crescent Moon", "Lower Waterline", "Clasped Hands", "Halo Disk", "Left Bookshelves", "Curving Staircase", "Scattered Petals", "Moon Disk", "Right Reeds", "Lower Reflection"
- If you cannot name a specific object, use a PHYSICAL REGION label combining a direction + visible feature: "Upper Moon Disk", "Lower Water Reflection", "Right Reed Cluster", "Left Book Stack", "Center Archway", "Upper Halo Ring", "Lower Stone Path"
- BANNED labels (NEVER use): "Central Figure", "Secondary Shape", "Outer Edge", "Lower Texture", "Main Subject", "Secondary Detail", "Framing Details", "Overall Surface", "Central Focus", "Emotional Atmosphere", "Composition & Framing", "Overall Feel & Weight", "Primary Element"
- These banned labels are GENERIC CATEGORY NAMES. You must name the ACTUAL THING you see, not its category.

PHASE 2 — MAP: For Sun, Moon, Rising, and Element, try to connect each to one observed region. If support is weak, set regionId to null. NULL IS BETTER THAN A FORCED MATCH.

PHASE 3 — WRITE: For each mapped slot, write a short grounded explanation (2 sentences, max 300 chars). The explanation MUST mention the exact placement (e.g. "Scorpio Sun" or "Sun in Scorpio").

Chart: Sun in ${sunSign} (House ${chartData.sun?.house || '?'}), Moon in ${moonSign} (House ${chartData.moon?.house || '?'}), ${rising} Rising, dominant ${dominantElement} (${Object.entries(elementBalance).map(([k,v]) => `${k}: ${v}`).join(", ")}).${candidateContext}${styleHint}

Return ONLY valid JSON:

{
  "subjectExplanation": "1-2 sentences, 28-40 words. Describe the main visible subject, figure, creature, or scene in plain concrete language. Then connect it to their ${sunSign} Sun, ${moonSign} Moon, or ${rising} Rising. Must reference what you actually SEE in the image.",

  "observedRegions": [
    {
      "id": "r1",
      "literalLabel": "Concrete object or physical region name, 2-6 words (e.g. 'Horned Bull', 'Lower Waterline', 'Stone Archway')",
      "visibleEvidence": "Concrete proof: shape, outline, texture, size, placement (min 15 chars)",
      "position": { "top": <0-100>, "left": <0-100> },
      "focusBox": { "top": <0-100>, "left": <0-100>, "bottom": <0-100>, "right": <0-100> },
      "regionType": "figure|object|texture|background|border"
    }
  ],

  "chartMappings": {
    "sun": {
      "regionId": "r1 or null",
      "artworkElement": "Concrete visible name from the region label, 2-6 words. Or null.",
      "explanation": "2 sentences, max 300 chars. MUST contain '${sunSign} Sun' or 'Sun in ${sunSign}'. Written in second person. Or null.",
      "confidence": 0.0-1.0
    },
    "moon": {
      "regionId": "r2 or null",
      "artworkElement": "Concrete visible name, or null",
      "explanation": "MUST contain '${moonSign} Moon' or 'Moon in ${moonSign}'. Or null.",
      "confidence": 0.0-1.0
    },
    "rising": {
      "regionId": "r3 or null",
      "artworkElement": "Concrete visible name, or null",
      "explanation": "MUST contain '${rising} Rising' or 'Rising in ${rising}'. Or null.",
      "confidence": 0.0-1.0
    },
    "element": {
      "regionId": "r4 or null",
      "artworkElement": "Concrete visible name, or null",
      "explanation": "MUST contain '${dominantElement} dominant' or 'dominant ${dominantElement}' or '${dominantElement} element'. Or null.",
      "confidence": 0.0-1.0
    }
  }
}

RULES:
- subjectExplanation is REQUIRED. It must describe a specific visible subject/scene. It must NOT be generic.
- literalLabel must name a concrete visible thing or physical region. NEVER abstract concepts.
- BANNED TITLE NOUNS: guardian, messenger, sentinel, watcher, sorceress, mechanism, beacon, oracle, harbinger, vessel, tapestry, gateway, portal, emissary
- BANNED EXPLANATION WORDS: represent, symbolize, vibrant, intricate, tapestry, journey, essence, energy, manifest, celestial, cosmic, mystical, ethereal, sacred, divine
- Each explanation must mention the EXACT correct placement (sign + placement type). Wrong sign = instant rejection.
- NEVER mention colors, color palette, art style, medium, or technique.
- Write like a smart friend, not a horoscope. Plain and grounded.
- confidence: 0.9+ = obvious match, 0.7-0.9 = good match, 0.5-0.7 = weak, below 0.5 = use null instead.
- If you can only find 3 regions, return 3. Do NOT pad with abstract filler regions.
- Each slot's regionId must reference an observedRegion id, or be null.
- Multiple slots MAY map to the same region if truly justified, but prefer different regions.

OUTPUT ONLY VALID JSON. No preamble, no commentary, no markdown fencing.`;

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
                  image_url: { url: `data:${contentType};base64,${base64Image}` },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
          max_tokens: 2000,
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

    if (!rawContent) throw new Error("Empty AI response");

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

    // Server-side sanitization
    const chartContext = { sunSign, moonSign, rising, dominantElement };
    const sanitized = sanitizeAiHotspotAnalysis(rawAnalysis, chartContext);

    // Build backward-compatible response shape
    const analysis: Record<string, any> = {
      subjectExplanation: sanitized.subjectExplanation,
      observedRegions: sanitized.observedRegions,
    };

    const placements = ["sun", "moon", "rising", "element"] as const;
    for (const key of placements) {
      const slot = sanitized.slots[key];
      if (slot?.mapped) {
        analysis[key] = {
          artworkElement: slot.artworkElement || null,
          explanation: slot.explanation || null,
          visibleEvidence: slot.visibleEvidence || null,
          position: slot.position || null,
          focusBox: null,
          mapped: true,
          confidence: slot.confidence,
        };
      } else {
        // Pass through partial data (title/position) even when explanation failed
        analysis[key] = {
          artworkElement: slot?.artworkElement || null,
          explanation: null,
          visibleEvidence: slot?.visibleEvidence || null,
          position: slot?.position || null,
          focusBox: null,
          mapped: false,
          confidence: slot?.confidence || 0,
        };
      }
    }

    const mappedCount = placements.filter(k => analysis[k].mapped).length;
    console.log(`[analyze-artwork] Success: ${sanitized.observedRegions.length} regions, ${mappedCount}/4 mapped`);

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
