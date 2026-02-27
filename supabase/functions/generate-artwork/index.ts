import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
    console.log('[generate-artwork] Token present:', !!REPLICATE_API_TOKEN, 'Length:', REPLICATE_API_TOKEN?.length, 'Starts with:', REPLICATE_API_TOKEN?.substring(0, 4));
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    const { prompt, predictionId, width = 768, height = 1024, aspectRatio, model } = await req.json();

    // --- Poll mode: check status of an existing prediction ---
    if (predictionId) {
      console.log('[generate-artwork] Polling prediction:', predictionId);
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        { headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` } }
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('[generate-artwork] Poll error:', pollResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: `Replicate poll error: ${pollResponse.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prediction = await pollResponse.json();
      if (prediction.status === 'succeeded' && prediction.output) {
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        return new Response(
          JSON.stringify({ imageUrl, status: 'succeeded' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ predictionId: prediction.id, status: prediction.status, error: prediction.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Create mode: start a new prediction ---
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-artwork] Starting prediction with prompt length:', prompt.length);
    console.log('[generate-artwork] Model:', model || 'default');

    const replicateModel = model || 'aviadtend-blip/galaxy-bloom';
    const inputPayload: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio || '3:4',
      num_outputs: 1,
      num_inference_steps: 6,
      guidance_scale: 1.5,
      output_format: 'png',
      output_quality: 90,
      lora_scale: 0.8,
    };

    // First, fetch the latest version of the model (works for both public and private)
    console.log('[generate-artwork] Fetching latest version for model:', replicateModel);
    const versionsRes = await fetch(
      `https://api.replicate.com/v1/models/${replicateModel}/versions`,
      { headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` } }
    );

    let createUrl: string;
    let createBody: Record<string, unknown>;

    if (versionsRes.ok) {
      const versionsData = await versionsRes.json();
      const latestVersion = versionsData.results?.[0]?.id;
      if (latestVersion) {
        console.log('[generate-artwork] Using version:', latestVersion);
        createUrl = 'https://api.replicate.com/v1/predictions';
        createBody = { version: latestVersion, input: inputPayload };
      } else {
        // No versions found, try model endpoint as fallback
        createUrl = `https://api.replicate.com/v1/models/${replicateModel}/predictions`;
        createBody = { input: inputPayload };
      }
    } else {
      // Versions endpoint failed, try model endpoint directly
      console.log('[generate-artwork] Versions endpoint failed, trying model endpoint');
      createUrl = `https://api.replicate.com/v1/models/${replicateModel}/predictions`;
      createBody = { input: inputPayload };
    }

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify(createBody),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[generate-artwork] Replicate API error:', createResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Replicate API error: ${createResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prediction = await createResponse.json();
    console.log('[generate-artwork] Prediction status:', prediction.status);

    if (prediction.status === 'succeeded' && prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return new Response(
        JSON.stringify({ imageUrl, status: 'succeeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ predictionId: prediction.id, status: prediction.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-artwork] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
