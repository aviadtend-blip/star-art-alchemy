import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ASTROLOGY_API_URL = "https://json.freeastrologyapi.com";

// Map zodiac degree ranges to sign names
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getSignFromDegree(fullDegree: number): string {
  const signIndex = Math.floor(fullDegree / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

function getDegreeInSign(fullDegree: number): number {
  return Math.round((fullDegree % 30) * 100) / 100;
}

// Get element for a zodiac sign
function getElement(sign: string): string {
  const elements: Record<string, string> = {
    Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
    Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
    Gemini: "Air", Libra: "Air", Aquarius: "Air",
    Cancer: "Water", Scorpio: "Water", Pisces: "Water",
  };
  return elements[sign] || "Unknown";
}

// Geocode city/nation to lat/lng using Nominatim (free, no key needed)
async function geocode(city: string, nation: string): Promise<{ lat: number; lng: number }> {
  const query = encodeURIComponent(`${city}, ${nation}`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { "User-Agent": "CelestialCanvas/1.0" } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Geocoding failed [${res.status}]: ${text}`);
  }
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error(`Could not find coordinates for "${city}, ${nation}"`);
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Get timezone offset for a location and date using TimeAPI (free, no key)
async function getTimezoneOffset(lat: number, lng: number): Promise<number> {
  try {
    const res = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
    );
    if (res.ok) {
      const data = await res.json();
      // currentUtcOffset is like "+05:30" or "-08:00"
      if (data.currentUtcOffset) {
        const match = data.currentUtcOffset.match(/^([+-])(\d{2}):(\d{2})$/);
        if (match) {
          const sign = match[1] === '+' ? 1 : -1;
          return sign * (parseInt(match[2]) + parseInt(match[3]) / 60);
        }
      }
    }
    await res.text(); // consume body
  } catch (e) {
    console.warn("[calculate-natal-chart] Timezone lookup failed, using UTC:", e);
  }
  return 0; // fallback to UTC
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('FREE_ASTROLOGY_API_KEY');
    if (!API_KEY) {
      throw new Error('FREE_ASTROLOGY_API_KEY is not configured');
    }

    const { year, month, day, hour, minute, city, nation } = await req.json();

    if (!year || !month || !day || !city || !nation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: year, month, day, city, nation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[calculate-natal-chart] Request: ${year}-${month}-${day} ${hour}:${minute} in ${city}, ${nation}`);

    // Step 1: Geocode city
    const { lat, lng } = await geocode(city, nation);
    console.log(`[calculate-natal-chart] Geocoded to lat=${lat}, lng=${lng}`);

    // Step 2: Get timezone offset
    const tzOffset = await getTimezoneOffset(lat, lng);
    console.log(`[calculate-natal-chart] Timezone offset: ${tzOffset}`);

    const requestBody = {
      year: Number(year),
      month: Number(month),
      date: Number(day),
      hours: Number(hour ?? 12),
      minutes: Number(minute ?? 0),
      seconds: 0,
      latitude: lat,
      longitude: lng,
      timezone: tzOffset,
      settings: {
        observation_point: "geocentric",
        ayanamsha: "tropical",
        language: "en",
      },
    };

    // Step 3: Fetch planets
    const planetsRes = await fetch(`${ASTROLOGY_API_URL}/western/planets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!planetsRes.ok) {
      const errorText = await planetsRes.text();
      console.error('[calculate-natal-chart] Planets API error:', planetsRes.status, errorText);
      throw new Error(`Astrology API planets error [${planetsRes.status}]: ${errorText}`);
    }

    const planetsData = await planetsRes.json();
    console.log('[calculate-natal-chart] Planets response received');

    // Step 4: Fetch houses
    const housesBody = {
      ...requestBody,
      settings: {
        ...requestBody.settings,
        house_system: "Placidus",
      },
    };

    const housesRes = await fetch(`${ASTROLOGY_API_URL}/western/houses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(housesBody),
    });

    let housesData = null;
    if (housesRes.ok) {
      housesData = await housesRes.json();
      console.log('[calculate-natal-chart] Houses response received');
    } else {
      const houseErr = await housesRes.text();
      console.warn('[calculate-natal-chart] Houses API error (non-fatal):', houseErr);
    }

    // Step 5: Parse into our canonical format
    const planets = planetsData.output || [];
    
    // Find specific planets
    const findPlanet = (name: string) => {
      return planets.find((p: any) => 
        p.planet?.en?.toLowerCase() === name.toLowerCase()
      );
    };

    const sunData = findPlanet("Sun");
    const moonData = findPlanet("Moon");
    const ascendantData = findPlanet("Ascendant");
    const venusData = findPlanet("Venus");
    const marsData = findPlanet("Mars");
    const mercuryData = findPlanet("Mercury");
    const jupiterData = findPlanet("Jupiter");
    const saturnData = findPlanet("Saturn");

    // Determine houses for planets based on house cusps
    const houseCusps: number[] = [];
    if (housesData?.output) {
      for (const h of housesData.output) {
        houseCusps.push(h.fullDegree || 0);
      }
    }

    function getHouse(fullDegree: number): number {
      if (houseCusps.length < 12) return 1;
      for (let i = 0; i < 12; i++) {
        const nextI = (i + 1) % 12;
        let start = houseCusps[i];
        let end = houseCusps[nextI];
        if (end < start) end += 360;
        let deg = fullDegree;
        if (deg < start) deg += 360;
        if (deg >= start && deg < end) return i + 1;
      }
      return 1;
    }

    const makePlacement = (data: any) => {
      if (!data) return null;
      const deg = data.fullDegree || 0;
      return {
        sign: getSignFromDegree(deg),
        house: getHouse(deg),
        degree: getDegreeInSign(deg),
        isRetrograde: data.isRetro === "true" || data.isRetro === true,
      };
    };

    const sun = makePlacement(sunData) || { sign: "Aries", house: 1, degree: 0 };
    const moon = makePlacement(moonData) || { sign: "Aries", house: 1, degree: 0 };
    const rising = ascendantData ? getSignFromDegree(ascendantData.fullDegree || 0) : "Aries";
    const venus = makePlacement(venusData);
    const mars = makePlacement(marsData);
    const mercury = makePlacement(mercuryData);
    const jupiter = makePlacement(jupiterData);
    const saturn = makePlacement(saturnData);

    // Calculate element balance from main placements
    const elementBalance: Record<string, number> = { Fire: 0, Water: 0, Earth: 0, Air: 0 };
    [sun, moon, { sign: rising }, venus, mars, mercury, jupiter, saturn]
      .filter(Boolean)
      .forEach((p: any) => {
        const el = getElement(p.sign);
        if (el in elementBalance) elementBalance[el]++;
      });

    const result = {
      sun,
      moon,
      rising,
      venus,
      mars,
      mercury,
      jupiter,
      saturn,
      element_balance: elementBalance,
      aspects: [],
      _meta: {
        source: "freeastrologyapi.com",
        coordinates: { lat, lng },
        timezone: tzOffset,
      },
    };

    console.log('[calculate-natal-chart] Chart calculated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[calculate-natal-chart] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
