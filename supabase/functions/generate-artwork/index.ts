import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Apiframe configuration
const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
const APIFRAME_IMAGINE_URL = "https://api.apiframe.ai/imagine";
const APIFRAME_FETCH_URL = "https://api.apiframe.ai/fetch";

// Midjourney style reference for Cosmic Collision aesthetic
const MJ_STYLE_REF = "--p m7426009495576248339";
const MJ_PARAMS = "--ar 3:4";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY not configured");
    }

    console.log(`Prompt length: ${prompt.length}`);
    console.log(`Prompt preview: ${prompt.substring(0, 100)}...`);

    // Build the full Midjourney prompt with style reference
    const fullPrompt = `${prompt} ${MJ_PARAMS} ${MJ_STYLE_REF}`;
    console.log(`Full MJ prompt: ${fullPrompt}`);

    // Step 1: Submit imagine task to Apiframe
    const imagineResponse = await fetch(APIFRAME_IMAGINE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${APIFRAME_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
      }),
    });

    const imagineData = await imagineResponse.json();

    if (imagineData.errors) {
      console.error("Apiframe imagine error:", JSON.stringify(imagineData.errors));
      throw new Error(imagineData.errors[0]?.msg || "Apiframe generation failed");
    }

    const taskId = imagineData.task_id;
    console.log(`Apiframe task submitted: ${taskId}`);

    // Step 2: Poll for completion (max 120 seconds, check every 5 seconds)
    const maxAttempts = 24;
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const fetchResponse = await fetch(APIFRAME_FETCH_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${APIFRAME_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      result = await fetchResponse.json();
      console.log(`Poll attempt ${attempts}: status=${result.status}`);

      if (result.status === "finished") {
        break;
      }

      if (result.status === "failed") {
        console.error("Apiframe task failed:", result.message);
        throw new Error(result.message || "Image generation failed");
      }
    }

    if (!result || result.status !== "finished") {
      throw new Error("Image generation timed out after 120 seconds");
    }

    // Step 3: Return all 4 image URLs
    // image_urls[0] is the primary display image
    // image_urls[1-3] are alternatives for "Reimagine" feature
    const imageUrls = result.image_urls || [];
    console.log(`Generation complete: ${imageUrls.length} images`);

    return new Response(
      JSON.stringify({
        // Primary image for immediate display
        output: imageUrls[0],
        // All 4 variations for reimagine feature
        all_outputs: imageUrls,
        // Task ID for potential upscaling later
        task_id: taskId,
        // Available actions (upscale1-4, variation1-4, reroll)
        actions: result.actions || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
