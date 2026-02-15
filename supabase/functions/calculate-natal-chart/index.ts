import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";
const PROKERALA_API_URL = "https://api.prokerala.com/v2/astrology";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Approximate Lahiri ayanamsha for a given year (accurate to ~0.1°)
function getAyanamsha(year: number): number {
  // Lahiri ayanamsha is roughly 23.85° in 2000 and increases ~50.3" per year
  return 23.85 + (year - 2000) * (50.3 / 3600);
}

function getSignFromTropicalDegree(tropicalLongitude: number): string {
  const normalized = ((tropicalLongitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normalized / 30)];
}

function getDegreeInSign(tropicalLongitude: number): number {
  const normalized = ((tropicalLongitude % 360) + 360) % 360;
  return Math.round((normalized % 30) * 100) / 100;
}

function getElement(sign: string): string {
  const elements: Record<string, string> = {
    Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
    Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
    Gemini: "Air", Libra: "Air", Aquarius: "Air",
    Cancer: "Water", Scorpio: "Water", Pisces: "Water",
  };
  return elements[sign] || "Unknown";
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(PROKERALA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Prokerala OAuth failed [${res.status}]: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

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

async function getTimezoneOffset(lat: number, lng: number): Promise<number> {
  try {
    const res = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
    );
    if (res.ok) {
      const data = await res.json();
      const offset = data.currentUtcOffset;
      if (offset && typeof offset === 'object') {
        return (offset.hours ?? 0) + (offset.minutes ?? 0) / 60;
      } else if (typeof offset === 'string') {
        const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
        if (match) {
          return (match[1] === '+' ? 1 : -1) * (parseInt(match[2]) + parseInt(match[3]) / 60);
        }
      } else if (typeof offset === 'number') {
        return offset;
      }
    } else {
      await res.text();
    }
  } catch (e) {
    console.warn("[calculate-natal-chart] Timezone lookup failed:", e);
  }
  return 0;
}

function formatTzOffset(offset: number): string {
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLIENT_ID = Deno.env.get('PROKERALA_CLIENT_ID');
    if (!CLIENT_ID) throw new Error('PROKERALA_CLIENT_ID is not configured');
    const CLIENT_SECRET = Deno.env.get('PROKERALA_CLIENT_SECRET');
    if (!CLIENT_SECRET) throw new Error('PROKERALA_CLIENT_SECRET is not configured');

    const { year, month, day, hour, minute, city, nation } = await req.json();
    if (!year || !month || !day || !city || !nation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: year, month, day, city, nation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[calculate-natal-chart] ${year}-${month}-${day} ${hour}:${minute} in ${city}, ${nation}`);

    // Geocode + timezone
    const { lat, lng } = await geocode(city, nation);
    const tzOffset = await getTimezoneOffset(lat, lng);
    console.log(`[calculate-natal-chart] coords=${lat},${lng} tz=${tzOffset}`);

    // OAuth token
    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);

    // Build datetime in ISO 8601
    const h = Number(hour ?? 12);
    const m = Number(minute ?? 0);
    const datetime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00${formatTzOffset(tzOffset)}`;
    const coordinates = `${lat},${lng}`;

    // Call Prokerala planet-position API
    const params = new URLSearchParams({
      ayanamsa: "1",
      coordinates,
      datetime,
    });

    const planetRes = await fetch(`${PROKERALA_API_URL}/planet-position?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!planetRes.ok) {
      const errText = await planetRes.text();
      throw new Error(`Prokerala API error [${planetRes.status}]: ${errText}`);
    }

    const planetData = await planetRes.json();
    const positions = planetData.data?.planet_position || [];
    
    // Ayanamsha to convert sidereal → tropical
    const ayanamsha = getAyanamsha(Number(year));
    console.log(`[calculate-natal-chart] Ayanamsha for ${year}: ${ayanamsha.toFixed(2)}°`);

    const findPlanet = (name: string) =>
      positions.find((p: any) => p.name?.toLowerCase() === name.toLowerCase());

    const makePlacement = (planet: any) => {
      if (!planet) return null;
      const sidereal = planet.longitude || 0;
      const tropical = sidereal + ayanamsha;
      return {
        sign: getSignFromTropicalDegree(tropical),
        house: planet.position || 1,
        degree: getDegreeInSign(tropical),
        isRetrograde: planet.is_retrograde || false,
      };
    };

    const sun = makePlacement(findPlanet("Sun")) || { sign: "Aries", house: 1, degree: 0 };
    const moon = makePlacement(findPlanet("Moon")) || { sign: "Aries", house: 1, degree: 0 };
    const venus = makePlacement(findPlanet("Venus"));
    const mars = makePlacement(findPlanet("Mars"));
    const mercury = makePlacement(findPlanet("Mercury"));
    const jupiter = makePlacement(findPlanet("Jupiter"));
    const saturn = makePlacement(findPlanet("Saturn"));

    // Ascendant — check if it's in the planet positions
    let rising = "Aries";
    const ascData = findPlanet("Ascendant");
    if (ascData) {
      const tropical = (ascData.longitude || 0) + ayanamsha;
      rising = getSignFromTropicalDegree(tropical);
    }

    // Element balance
    const elementBalance: Record<string, number> = { Fire: 0, Water: 0, Earth: 0, Air: 0 };
    [sun, moon, { sign: rising }, venus, mars, mercury, jupiter, saturn]
      .filter(Boolean)
      .forEach((p: any) => {
        const el = getElement(p.sign);
        if (el in elementBalance) elementBalance[el]++;
      });

    const result = {
      sun, moon, rising, venus, mars, mercury, jupiter, saturn,
      element_balance: elementBalance,
      aspects: [],
      _meta: { source: "prokerala.com", coordinates: { lat, lng }, timezone: tzOffset },
    };

    console.log("[calculate-natal-chart] Success:", JSON.stringify({ sun: result.sun, moon: result.moon, rising: result.rising }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[calculate-natal-chart] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
