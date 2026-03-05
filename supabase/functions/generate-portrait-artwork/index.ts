import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
// InstantID model on Replicate
const INSTANTID_VERSION = "5578b9b8a2d7ea9b5b93498cc999ece4229a1c0f";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, face_image_url, sref, personalization, profileCode } = await req.json();

    if (!prompt || !face_image_url) {
      return new Response(
        JSON.stringify({ error: "prompt and face_image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    // Note: The face_image_url must be a publicly accessible URL.
    // The 'user-photos' Supabase Storage bucket must exist with public read access.

    // Submit prediction to Replicate
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
          prompt: prompt,
          negative_prompt: "blurry, bad anatomy, distorted face, ugly, low quality",
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
          num_inference_steps: 30,
          guidance_scale: 5,
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

    // Poll for completion (max 120s)
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
