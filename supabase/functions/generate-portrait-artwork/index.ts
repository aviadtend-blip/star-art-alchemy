import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceExpensiveUsageLimit } from "../_shared/expensiveUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

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

    const limitResponse = await enforceExpensiveUsageLimit({
      req,
      functionName: "generate-portrait-artwork",
      corsHeaders,
    });
    if (limitResponse) {
      return limitResponse;
    }

    if (!APIFRAME_API_KEY || !REPLICATE_API_TOKEN) {
      throw new Error("Missing required API keys");
    }

    // ── STEP 1: Generate artwork via Apiframe/Midjourney ──────────────────────
    console.log("Portrait Step 1: Generating birth chart artwork via Midjourney...");

    const mjPrompt = personalization
      ? `${prompt} ${personalization}`
      : prompt;

    const imagineBody: Record<string, unknown> = {
      prompt: mjPrompt,
      aspect_ratio: "3:4",
      process_mode: "fast",
    };
    if (sref) imagineBody.sref = sref;
    if (profileCode) imagineBody.profile = profileCode;

    const imagineResponse = await fetch("https://api.apiframe.pro/imagine", {
      method: "POST",
      headers: {
        Authorization: APIFRAME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imagineBody),
    });

    if (!imagineResponse.ok) {
      const err = await imagineResponse.text();
      throw new Error(`Apiframe imagine failed: ${err}`);
    }

    const imagineData = await imagineResponse.json();
    const taskId = imagineData.task_id;
    if (!taskId) throw new Error("No task_id from Apiframe");

    console.log(`Apiframe task submitted: ${taskId}`);

    // Poll Apiframe for Midjourney completion (max 120s)
    let mjImageUrl: string | null = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const fetchResponse = await fetch("https://api.apiframe.pro/fetch", {
        method: "POST",
        headers: {
          Authorization: APIFRAME_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      const fetchData = await fetchResponse.json();
      console.log(`Apiframe poll ${i + 1}: status=${fetchData.status}`);

      if (fetchData.status === "finished") {
        const images = fetchData.image_urls || fetchData.task_result;
        mjImageUrl = Array.isArray(images) ? images[0] : images;
        break;
      }

      if (fetchData.status === "error" || fetchData.status === "failed") {
        throw new Error(fetchData.error_messages?.[0] || "Midjourney generation failed");
      }
    }

    if (!mjImageUrl) throw new Error("Midjourney generation timed out");
    console.log(`Step 1 complete. Artwork URL: ${mjImageUrl}`);

    // ── STEP 2: Face swap via easel/advanced-face-swap on Replicate ───────────
    console.log("Portrait Step 2: Blending face into artwork via easel/advanced-face-swap...");

    const swapResponse = await fetch("https://api.replicate.com/v1/models/easel/advanced-face-swap/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          swap_image: face_image_url,
          target_image: mjImageUrl,
          hair_source: "target",
        },
      }),
    });

    const swapPrediction = await swapResponse.json();
    if (swapPrediction.error) throw new Error(`Face swap error: ${swapPrediction.error}`);

    const swapId = swapPrediction.id;
    console.log(`Face swap prediction submitted: ${swapId}`);

    // Poll for face swap completion (max 60s)
    // Extended timeout: cold starts on Replicate can take 60-90s before processing begins
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
        console.log(`Portrait generation complete: ${finalUrl}`);
        return new Response(
          JSON.stringify({
            output: finalUrl,
            all_outputs: [finalUrl],
            task_id: taskId,
            actions: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (result.status === "failed" || result.status === "canceled") {
        throw new Error(result.error || "Face swap failed");
      }
    }

    throw new Error("Face swap timed out after 180 seconds");

  } catch (error) {
    console.error("generate-portrait-artwork error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
