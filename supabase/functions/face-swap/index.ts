import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target_image_url, face_image_url } = await req.json();

    if (!target_image_url || !face_image_url) {
      return new Response(
        JSON.stringify({ error: "target_image_url and face_image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    console.log("Starting face swap...");
    console.log(`Target: ${target_image_url.substring(0, 80)}...`);
    console.log(`Face: ${face_image_url.substring(0, 80)}...`);

    // Submit face swap prediction
    const swapResponse = await fetch(
      "https://api.replicate.com/v1/models/easel/advanced-face-swap/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          // Ask Replicate to prefer keeping the model warm
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: {
            swap_image: face_image_url,
            target_image: target_image_url,
            hair_source: "target",
          },
        }),
      }
    );

    const swapPrediction = await swapResponse.json();

    // If Prefer: wait returned a completed result directly
    if (swapPrediction.status === "succeeded" && swapPrediction.output) {
      const finalUrl = Array.isArray(swapPrediction.output)
        ? swapPrediction.output[0]
        : swapPrediction.output;
      console.log(`Face swap completed immediately: ${finalUrl}`);
      return new Response(
        JSON.stringify({ output: finalUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (swapPrediction.error) {
      throw new Error(`Face swap error: ${swapPrediction.error}`);
    }

    const swapId = swapPrediction.id;
    console.log(`Face swap prediction submitted: ${swapId}`);

    // Poll for completion (max ~180s at 2s intervals = 90 polls)
    // Extended to handle Replicate cold starts which can take 60-90s
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${swapId}`,
        { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } }
      );
      const result = await pollResponse.json();
      console.log(`Face swap poll ${i + 1}: status=${result.status}`);

      if (result.status === "succeeded") {
        const finalUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        console.log(`Face swap complete: ${finalUrl}`);
        return new Response(
          JSON.stringify({ output: finalUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (result.status === "failed" || result.status === "canceled") {
        throw new Error(result.error || "Face swap failed");
      }
    }

    throw new Error("Face swap timed out after 180 seconds");
  } catch (error) {
    console.error("face-swap error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

