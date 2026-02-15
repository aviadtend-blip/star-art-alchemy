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
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    const { prompt, predictionId, width = 768, height = 1024 } = await req.json();

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

    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
        input: {
          prompt,
          width,
          height,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
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
