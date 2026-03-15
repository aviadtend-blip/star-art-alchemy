import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceExpensiveUsageLimit } from "../_shared/expensiveUsage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Apiframe configuration
const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
const APIFRAME_IMAGINE_URL = "https://api.apiframe.ai/imagine";
const APIFRAME_FETCH_URL = "https://api.apiframe.ai/fetch";

// Default personalization fallback (used when style has no specific --p code)
const DEFAULT_PERSONALIZATION = "jv7b3wn";
// Default sref fallback
const DEFAULT_SREF = "3498857616";
const MJ_PARAMS = "--ar 3:4";

// Submit imagine task with retry and exponential backoff
async function submitImagineWithRetry(
  fullPrompt: string,
  maxRetries = 2,
  baseDelay = 3000
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`[generate-artwork] Retry attempt ${attempt}, waiting ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const imagineResponse = await fetch(APIFRAME_IMAGINE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${APIFRAME_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      const imagineData = await imagineResponse.json();

      if (imagineData.errors) {
        throw new Error(imagineData.errors[0]?.msg || "Apiframe generation failed");
      }

      return imagineData.task_id;
    } catch (err) {
      lastError = err;
      console.error(`[generate-artwork] Imagine attempt ${attempt + 1} failed:`, err.message);
    }
  }

  throw lastError || new Error("Image generation failed after retries");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY not configured");
    }

    // ──── MODE: POLL ────
    // If task_id is provided, just check status and return
    if (body.task_id) {
      const fetchResponse = await fetch(APIFRAME_FETCH_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${APIFRAME_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: body.task_id }),
      });

      const result = await fetchResponse.json();

      if (result.status === "finished") {
        const imageUrls = result.image_urls || [];
        return new Response(
          JSON.stringify({
            status: "finished",
            output: imageUrls[0],
            all_outputs: imageUrls,
            task_id: body.task_id,
            actions: result.actions || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (result.status === "failed") {
        return new Response(
          JSON.stringify({
            status: "failed",
            error: result.message || "Image generation failed",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Still processing
      return new Response(
        JSON.stringify({
          status: result.status || "processing",
          percentage: result.percentage ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──── MODE: SUBMIT ────
    const { prompt, sref, personalization, profileCode } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const limitResponse = await enforceExpensiveUsageLimit({
      req,
      functionName: "generate-artwork",
      corsHeaders,
    });
    if (limitResponse) {
      return limitResponse;
    }

    console.log(`Prompt length: ${prompt.length}`);
    console.log(`Prompt preview: ${prompt.substring(0, 100)}...`);

    // Build the full Midjourney prompt with style reference and personalization
    const styleRef = sref || DEFAULT_SREF;
    let personalizationFlag = '';
    if (profileCode) {
      personalizationFlag = `--profile ${profileCode}`;
    } else {
      const pCode = personalization || DEFAULT_PERSONALIZATION;
      personalizationFlag = `--p ${pCode}`;
    }
    const fullPrompt = `${prompt} ${MJ_PARAMS} --sref ${styleRef} ${personalizationFlag}`;
    console.log(`Full MJ prompt: ${fullPrompt}`);

    // Submit imagine task and return task_id immediately
    const taskId = await submitImagineWithRetry(fullPrompt);
    console.log(`Apiframe task submitted: ${taskId}`);

    return new Response(
      JSON.stringify({
        status: "submitted",
        task_id: taskId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
