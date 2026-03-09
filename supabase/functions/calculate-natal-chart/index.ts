import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";
const PROKERALA_API_URL = "https://api.prokerala.com/v2/astrology";
const FREE_ASTROLOGY_API_URL = "https://json.freeastrologyapi.com/western/planets";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getAyanamsha(year: number): number {
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

function getModality(sign: string): string {
  const modalities: Record<string, string> = {
    Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
    Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
    Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
  };
  return modalities[sign] || "Unknown";
}

// Planetary dignities: domicile, exaltation, detriment, fall
const DIGNITIES: Record<string, { domicile: string[]; exaltation: string[]; detriment: string[]; fall: string[] }> = {
  Sun:     { domicile: ["Leo"], exaltation: ["Aries"], detriment: ["Aquarius"], fall: ["Libra"] },
  Moon:    { domicile: ["Cancer"], exaltation: ["Taurus"], detriment: ["Capricorn"], fall: ["Scorpio"] },
  Mercury: { domicile: ["Gemini", "Virgo"], exaltation: ["Virgo"], detriment: ["Sagittarius", "Pisces"], fall: ["Pisces"] },
  Venus:   { domicile: ["Taurus", "Libra"], exaltation: ["Pisces"], detriment: ["Aries", "Scorpio"], fall: ["Virgo"] },
  Mars:    { domicile: ["Aries", "Scorpio"], exaltation: ["Capricorn"], detriment: ["Taurus", "Libra"], fall: ["Cancer"] },
  Jupiter: { domicile: ["Sagittarius", "Pisces"], exaltation: ["Cancer"], detriment: ["Gemini", "Virgo"], fall: ["Capricorn"] },
  Saturn:  { domicile: ["Capricorn", "Aquarius"], exaltation: ["Libra"], detriment: ["Cancer", "Leo"], fall: ["Aries"] },
};

function getDignity(planetName: string, sign: string): string | null {
  const d = DIGNITIES[planetName];
  if (!d) return null;
  if (d.domicile.includes(sign)) return "Domicile";
  if (d.exaltation.includes(sign)) return "Exaltation";
  if (d.detriment.includes(sign)) return "Detriment";
  if (d.fall.includes(sign)) return "Fall";
  return null;
}

class UpstreamApiError extends Error {
  status: number;
  provider: string;

  constructor(provider: string, status: number, message: string) {
    super(message);
    this.name = "UpstreamApiError";
    this.provider = provider;
    this.status = status;
  }
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
    throw new UpstreamApiError("prokerala", res.status, `Prokerala OAuth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

function normalizeSign(signRaw: string | undefined | null): string | null {
  if (!signRaw) return null;
  const normalized = String(signRaw).trim().toLowerCase();
  const found = ZODIAC_SIGNS.find((s) => s.toLowerCase() === normalized);
  return found ?? null;
}

function coerceNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function normalizeFreeAstrologyPositions(payload: any): any[] {
  const candidates = [
    payload?.output,
    payload?.data,
    payload?.planets,
    payload?.output?.planets,
    payload?.data?.planets,
  ];

  let list: any[] = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      list = candidate;
      break;
    }
  }

  const mapped = list
    .map((item: any) => {
      const name = item?.name ?? item?.planet ?? item?.planet_name ?? item?.object;
      const sign = normalizeSign(item?.sign ?? item?.zodiac_sign ?? item?.current_sign);
      const degreeInSign = coerceNumber(item?.degree_in_sign, item?.degree, item?.norm_degree, item?.normDegree);
      let longitude = coerceNumber(item?.longitude, item?.full_degree, item?.fullDegree, item?.sidereal_longitude, item?.tropical_longitude);

      if (longitude == null && sign && degreeInSign != null) {
        longitude = ZODIAC_SIGNS.indexOf(sign) * 30 + degreeInSign;
      }

      if (!name || longitude == null) return null;

      return {
        name: String(name),
        longitude,
        sign,
        position: coerceNumber(item?.house, item?.current_house, item?.house_number, item?.position) ?? 1,
        is_retrograde: Boolean(item?.is_retrograde ?? item?.retrograde ?? false),
      };
    })
    .filter(Boolean);

  const ascCandidate = payload?.output?.ascendant ?? payload?.data?.ascendant ?? payload?.ascendant;
  if (ascCandidate) {
    const ascSign = normalizeSign(ascCandidate?.sign ?? ascCandidate?.zodiac_sign ?? ascCandidate?.current_sign);
    const ascDegree = coerceNumber(ascCandidate?.degree_in_sign, ascCandidate?.degree, ascCandidate?.norm_degree);
    const ascLongitude = coerceNumber(ascCandidate?.longitude, ascCandidate?.full_degree) ??
      (ascSign && ascDegree != null ? ZODIAC_SIGNS.indexOf(ascSign) * 30 + ascDegree : null);

    if (ascLongitude != null) {
      mapped.push({
        name: "Ascendant",
        longitude: ascLongitude,
        sign: ascSign,
        position: coerceNumber(ascCandidate?.house, ascCandidate?.current_house, ascCandidate?.house_number) ?? 1,
        is_retrograde: false,
      });
    }
  }

  return mapped;
}

async function fetchPlanetPositions(
  clientId: string | null,
  clientSecret: string | null,
  freeAstrologyApiKey: string | null,
  params: URLSearchParams,
): Promise<{ positions: any[]; source: string; longitudeMode: "sidereal" | "tropical" }> {
  let prokeralaError: unknown = null;

  if (clientId && clientSecret) {
    try {
      const accessToken = await getAccessToken(clientId, clientSecret);
      const planetRes = await fetch(`${PROKERALA_API_URL}/planet-position?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!planetRes.ok) {
        const errText = await planetRes.text();
        throw new UpstreamApiError("prokerala", planetRes.status, `Prokerala API error [${planetRes.status}]: ${errText}`);
      }

      const planetData = await planetRes.json();
      const positions = planetData.data?.planet_position || [];
      if (!Array.isArray(positions) || positions.length === 0) {
        throw new Error("Prokerala returned empty planet positions");
      }

      return { positions, source: "prokerala.com", longitudeMode: "sidereal" };
    } catch (error) {
      prokeralaError = error;
      const status = error instanceof UpstreamApiError ? error.status : 0;
      const shouldFallback = status === 403 || status === 429;
      if (!shouldFallback) throw error;
      console.warn("[calculate-natal-chart] Prokerala unavailable, trying Free Astrology API fallback", error);
    }
  }

  if (!freeAstrologyApiKey) {
    if (prokeralaError) throw prokeralaError;
    throw new Error("No natal chart provider credentials are configured");
  }

  const body = {
    year: Number(params.get("datetime")?.slice(0, 4)),
    month: Number(params.get("datetime")?.slice(5, 7)),
    date: Number(params.get("datetime")?.slice(8, 10)),
    hours: Number(params.get("datetime")?.slice(11, 13)),
    minutes: Number(params.get("datetime")?.slice(14, 16)),
    seconds: 0,
    latitude: Number(params.get("coordinates")?.split(",")[0]),
    longitude: Number(params.get("coordinates")?.split(",")[1]),
    observation_point: "topocentric",
    ayanamsha: "tropical",
    language: "en",
  };

  const freeRes = await fetch(FREE_ASTROLOGY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": freeAstrologyApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!freeRes.ok) {
    const errText = await freeRes.text();
    throw new UpstreamApiError("freeastrology", freeRes.status, `Free Astrology API error [${freeRes.status}]: ${errText}`);
  }

  const freeData = await freeRes.json();
  const positions = normalizeFreeAstrologyPositions(freeData);

  if (positions.length === 0) {
    throw new Error("Free Astrology API returned no readable planet positions");
  }

  return { positions, source: "freeastrologyapi.com", longitudeMode: "tropical" };
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

async function getTimezoneOffset(lat: number, lng: number, year: number, month: number, day: number, hour: number, minute: number): Promise<number> {
  // Build a UTC timestamp for the birth date to get historical timezone
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const timestamp = Math.floor(utcDate.getTime() / 1000);

  // Try Google Maps Time Zone API first (accurate historical offsets)
  const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${googleApiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          // Google returns rawOffset + dstOffset in seconds
          const totalOffsetSeconds = (data.rawOffset || 0) + (data.dstOffset || 0);
          const totalOffsetHours = totalOffsetSeconds / 3600;
          console.log(`[calculate-natal-chart] Google TZ: raw=${data.rawOffset}s dst=${data.dstOffset}s total=${totalOffsetHours}h (${data.timeZoneId})`);
          return totalOffsetHours;
        } else {
          console.warn(`[calculate-natal-chart] Google TZ API status: ${data.status} - ${data.errorMessage || ''}`);
        }
      } else {
        const text = await res.text();
        console.warn(`[calculate-natal-chart] Google TZ API HTTP ${res.status}: ${text}`);
      }
    } catch (e) {
      console.warn("[calculate-natal-chart] Google TZ lookup failed:", e);
    }
  }

  // Fallback to timeapi.io (current offset only, less accurate for historical dates)
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

  // Final fallback: estimate timezone from longitude (15° per hour)
  // This is approximate (±1 hour) but far better than UTC which can be off by 12 hours
  const estimatedOffset = Math.round(lng / 15);
  console.log(`[calculate-natal-chart] Using longitude-based TZ estimate: ${estimatedOffset}h (lng=${lng})`);
  return estimatedOffset;
}

function formatTzOffset(offset: number): string {
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Calculate aspects between planets based on angular distance
function calculateAspects(placements: { name: string; longitude: number }[]): any[] {
  const ASPECT_TYPES = [
    { name: "Conjunction", angle: 0, orb: 8, symbol: "☌" },
    { name: "Sextile", angle: 60, orb: 6, symbol: "⚹" },
    { name: "Square", angle: 90, orb: 7, symbol: "□" },
    { name: "Trine", angle: 120, orb: 8, symbol: "△" },
    { name: "Opposition", angle: 180, orb: 8, symbol: "☍" },
  ];

  const aspects: any[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const diff = Math.abs(placements[i].longitude - placements[j].longitude);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const aspect of ASPECT_TYPES) {
        const orbActual = Math.abs(angle - aspect.angle);
        if (orbActual <= aspect.orb) {
          aspects.push({
            planet1: placements[i].name,
            planet2: placements[j].name,
            aspect: aspect.name,
            symbol: aspect.symbol,
            angle: Math.round(angle * 100) / 100,
            orb: Math.round(orbActual * 100) / 100,
          });
          break;
        }
      }
    }
  }
  return aspects;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLIENT_ID = Deno.env.get('PROKERALA_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('PROKERALA_CLIENT_SECRET');
    const FREE_ASTROLOGY_API_KEY = Deno.env.get('FREE_ASTROLOGY_API_KEY');

    if ((!CLIENT_ID || !CLIENT_SECRET) && !FREE_ASTROLOGY_API_KEY) {
      throw new Error('No natal chart provider credentials are configured');
    }

    const { year, month, day, hour, minute, city, nation, lat: preLat, lng: preLng } = await req.json();
    if (!year || !month || !day || !city || !nation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: year, month, day, city, nation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[calculate-natal-chart] ${year}-${month}-${day} ${hour}:${minute} in ${city}, ${nation}`);

    const { lat, lng } = (preLat != null && preLng != null)
      ? { lat: preLat, lng: preLng }
      : await geocode(city, nation);

    const h = Number(hour ?? 12);
    const m = Number(minute ?? 0);
    const tzOffset = await getTimezoneOffset(lat, lng, Number(year), Number(month), Number(day), h, m);
    console.log(`[calculate-natal-chart] coords=${lat},${lng} tz=${tzOffset}`);

    const datetime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00${formatTzOffset(tzOffset)}`;
    const coordinates = `${lat},${lng}`;

    const params = new URLSearchParams({
      ayanamsa: "1",
      coordinates,
      datetime,
    });

    const { positions, source, longitudeMode } = await fetchPlanetPositions(
      CLIENT_ID,
      CLIENT_SECRET,
      FREE_ASTROLOGY_API_KEY,
      params,
    );

    const ayanamsha = getAyanamsha(Number(year));
    console.log(`[calculate-natal-chart] Ayanamsha for ${year}: ${ayanamsha.toFixed(2)}°`);

    const findPlanet = (name: string) =>
      positions.find((p: any) => p.name?.toLowerCase() === name.toLowerCase());

    const toTropicalLongitude = (longitude: number) =>
      longitudeMode === "sidereal" ? longitude + ayanamsha : longitude;

    const makePlacement = (planet: any, planetName: string) => {
      if (!planet) return null;
      const tropical = toTropicalLongitude(planet.longitude || 0);
      const sign = normalizeSign(planet.sign) ?? getSignFromTropicalDegree(tropical);
      return {
        sign,
        house: planet.position || 1,
        degree: getDegreeInSign(tropical),
        isRetrograde: planet.is_retrograde || false,
        dignity: getDignity(planetName, sign),
      };
    };

    const sun = makePlacement(findPlanet("Sun"), "Sun") || { sign: "Aries", house: 1, degree: 0, isRetrograde: false, dignity: null };
    const moon = makePlacement(findPlanet("Moon"), "Moon") || { sign: "Aries", house: 1, degree: 0, isRetrograde: false, dignity: null };
    const venus = makePlacement(findPlanet("Venus"), "Venus");
    const mars = makePlacement(findPlanet("Mars"), "Mars");
    const mercury = makePlacement(findPlanet("Mercury"), "Mercury");
    const jupiter = makePlacement(findPlanet("Jupiter"), "Jupiter");
    const saturn = makePlacement(findPlanet("Saturn"), "Saturn");

    // Ascendant
    let rising = "Aries";
    const ascData = findPlanet("Ascendant");
    if (ascData) {
      const tropical = (ascData.longitude || 0) + ayanamsha;
      rising = getSignFromTropicalDegree(tropical);
    }

    // Element balance
    const allPlacements = [sun, moon, { sign: rising }, venus, mars, mercury, jupiter, saturn].filter(Boolean) as any[];
    const elementBalance: Record<string, number> = { Fire: 0, Water: 0, Earth: 0, Air: 0 };
    allPlacements.forEach((p) => {
      const el = getElement(p.sign);
      if (el in elementBalance) elementBalance[el]++;
    });

    // Modality balance
    const modalityBalance: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    allPlacements.forEach((p) => {
      const mod = getModality(p.sign);
      if (mod in modalityBalance) modalityBalance[mod]++;
    });

    // Dominant element & modality
    const dominantElement = Object.entries(elementBalance).sort((a, b) => b[1] - a[1])[0][0];
    const dominantModality = Object.entries(modalityBalance).sort((a, b) => b[1] - a[1])[0][0];

    // Calculate aspects from tropical longitudes
    const planetLongitudes: { name: string; longitude: number }[] = [];
    const planetNames = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
    for (const name of planetNames) {
      const p = findPlanet(name);
      if (p) {
        planetLongitudes.push({ name, longitude: (p.longitude || 0) + ayanamsha });
      }
    }
    const aspects = calculateAspects(planetLongitudes);
    console.log(`[calculate-natal-chart] Found ${aspects.length} aspects`);

    // Stellium detection: 3+ planets in the same sign
    const planetSignMap: Record<string, { name: string; house: number }[]> = {};
    const namedPlacements = [
      { name: "Sun", data: sun }, { name: "Moon", data: moon },
      { name: "Mercury", data: mercury }, { name: "Venus", data: venus },
      { name: "Mars", data: mars }, { name: "Jupiter", data: jupiter },
      { name: "Saturn", data: saturn },
    ];
    for (const { name, data } of namedPlacements) {
      if (!data) continue;
      if (!planetSignMap[data.sign]) planetSignMap[data.sign] = [];
      planetSignMap[data.sign].push({ name, house: data.house });
    }
    const stelliums = Object.entries(planetSignMap)
      .filter(([_, planets]) => planets.length >= 3)
      .map(([sign, planets]) => ({
        sign,
        house: planets[0].house,
        planets: planets.map(p => p.name),
      }));

    const result = {
      sun, moon, rising, venus, mars, mercury, jupiter, saturn,
      element_balance: elementBalance,
      modality_balance: modalityBalance,
      dominant_element: dominantElement,
      dominant_modality: dominantModality,
      aspects,
      stelliums,
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
