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

    const { place_id } = await req.json();
    if (!place_id) {
      return new Response(
        JSON.stringify({ error: 'place_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      place_id,
      fields: 'geometry,address_components,formatted_address',
      key: API_KEY,
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places Detail API error [${res.status}]: ${text}`);
    }

    const data = await res.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places Detail status: ${data.status} - ${data.error_message || ''}`);
    }

    const result = data.result;
    const lat = result.geometry?.location?.lat;
    const lng = result.geometry?.location?.lng;

    // Extract city and country from address components
    let city = '';
    let nation = '';
    for (const comp of result.address_components || []) {
      if (comp.types.includes('locality')) city = comp.long_name;
      if (comp.types.includes('country')) nation = comp.short_name;
    }

    return new Response(JSON.stringify({
      lat,
      lng,
      city,
      nation,
      formatted_address: result.formatted_address,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[google-places-detail] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
