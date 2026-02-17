import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

    const { input, type } = await req.json();

    if (!input || input.length < 2) {
      return new Response(JSON.stringify({ predictions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Places Autocomplete (New) API
    const params = new URLSearchParams({
      input,
      types: type || '(cities)',
      key: API_KEY,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places API error [${res.status}]: ${text}`);
    }

    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API status: ${data.status} - ${data.error_message || ''}`);
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
    }));

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[google-places-autocomplete] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
