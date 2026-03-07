import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
const INSTANTID_VERSION = "2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789";

const STYLE_PROMPTS: Record<string, string> = {
  'prism-storm': 'abstract expressionist cosmic portrait, bold saturated colors, layered nebula textures, electric magenta and violet hues, explosive painterly strokes',
  'folk-oracle': 'dark folklore portrait, rich earthy tones, candlelit warmth, mystical forest atmosphere, deep amber and burnt sienna, intimate and moody',
  'cosmic-fable': 'retro cosmic illustration portrait, whimsical storybook style, bold graphic shapes, teal and cyan palette, mid-century modern space art',
  'paper-carnival': 'folk art portrait, bright naive illustration, joyful paper collage style, warm yellows and oranges, playful patterns and textures',
  'red-eclipse': 'dramatic woodcut portrait, bold ink lines, crimson and black palette, high contrast, linocut printmaking style, fierce and graphic',
  'cosmic-collision': 'surrealist mixed-media portrait, ink and watercolor washes, nebula dreamscape background, explosive cosmic energy, indigo and purple tones',
};

const DEFAULT_STYLE_PROMPT = 'cosmic mystical portrait, rich celestial atmosphere, painterly and ethereal';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, face_image_url, sref, personalization, profileCode, style_id } = await req.json();

    if (!prompt || !face_image_url) {
      return new Response(
        JSON.stringify({ error: "prompt and face_image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    const styleId = style_id as string | undefined;
    const stylePrompt = (styleId && STYLE_PROMPTS[styleId]) ? STYLE_PROMPTS[styleId] : DEFAULT_STYLE_PROMPT;
    const styledPrompt = `${stylePrompt}, ${prompt}`;

    console.log(`InstantID style: ${styleId || 'default'}, prompt preview: ${styledPrompt.substring(0, 120)}...`);

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: INSTANTID_VERSION,
        input: {
          image: face_image_url,
          prompt: styledPrompt,
          negative_prompt: "blurry, bad anatomy, distorted face, ugly, low quality, cartoon, anime, illustration",
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          num_inference_steps: 30,
          guidance_scale: 7,
          width: 768,
          height: 1024,
        },
      }),
    });

    const prediction = await createResponse.json();
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    const predictionId = prediction.id;
    console.log(`InstantID prediction submitted: ${predictionId}`);

    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } }
      );
      const result = await pollResponse.json();

      if (result.status === "succeeded") {
        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        console.log(`InstantID generation complete: ${outputUrl}`);
        return new Response(
          JSON.stringify({
            output: outputUrl,
            all_outputs: [outputUrl],
            task_id: predictionId,
            actions: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (result.status === "failed" || result.status === "canceled") {
        throw new Error(result.error || "InstantID generation failed");
      }
    }

    throw new Error("Portrait generation timed out after 120 seconds");
  } catch (error) {
    console.error("generate-portrait-artwork error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
