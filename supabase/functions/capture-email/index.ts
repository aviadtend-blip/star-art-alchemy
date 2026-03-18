import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Inlined from src/lib/emailOrderResume.js ──
const EMAIL_ORDER_RESUME_URL = "https://celestialartworks.com/generate/size";

function _normalizeText(value: any): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildEmailOrderResumeUrl({ artworkId, sessionId, fallbackUrl = "" }: { artworkId?: string; sessionId?: string; fallbackUrl?: string }): string {
  const params = new URLSearchParams();
  const normalizedArtworkId = _normalizeText(artworkId);
  const normalizedSessionId = _normalizeText(sessionId);
  if (normalizedArtworkId) params.set("artwork_id", normalizedArtworkId);
  if (normalizedSessionId) params.set("session_id", normalizedSessionId);
  if ([...params.keys()].length === 0) return _normalizeText(fallbackUrl);
  return `${EMAIL_ORDER_RESUME_URL}?${params.toString()}`;
}

// ── Inlined from src/lib/klaviyoContract.js ──
const KLAVIYO_DEFAULTS = {
  nurtureBranch: "preview_only",
  peakSeason: "default",
  discountCode: "COSMIC10",
  discountAmount: 10,
  productUrl: "https://celestialartworks.com/shop",
  captureSource: "preview_download",
  greetingName: "there",
};

const SIGN_INTERPRETATIONS: Record<string, Record<string, string>> = {
  Aries: { Sun: "Your Aries Sun burns with the fire of a pioneer, igniting every room you enter with raw courage. You lead with instinct, not permission, carving paths where none existed. Your artwork channels this fearless energy into bold, unapologetic forms.", Moon: "Your Aries Moon feels emotions like a struck match - instant, bright, and impossible to ignore. Beneath your surface lies a fierce need for emotional independence. The artwork captures this inner spark, the fire that never asks to be lit.", Rising: "Your Aries Rising walks into the world like a declaration of intent. People sense your courage before you speak a word. This ascendant energy shapes the artwork's boldest edges, its forward momentum frozen in color." },
  Taurus: { Sun: "Your Taurus Sun is rooted in the earth like an ancient oak, drawing beauty from stillness and patience. You understand that the most valuable things take time to grow. Your artwork reflects this reverence for permanence and sensory richness.", Moon: "Your Taurus Moon craves emotional landscapes that feel like velvet - soft, rich, and deeply comforting. Security is not a luxury for you; it is oxygen. The artwork holds this tenderness in its warmest, most grounded tones.", Rising: "Your Taurus Rising radiates quiet magnetism, an effortless elegance that draws others in. The world sees you as a sanctuary of calm and beauty. This steady presence anchors the artwork's composition with timeless grace." },
  Gemini: { Sun: "Your Gemini Sun lives in the electric space between ideas, weaving stories from thin air with effortless wit. Curiosity is your compass, and every conversation is a doorway. Your artwork dances with this quicksilver intelligence.", Moon: "Your Gemini Moon processes feelings through words, forever narrating the inner world to make sense of it. Emotional restlessness fuels your search for meaning in the everyday. The artwork captures this mercurial inner dialogue in shifting patterns.", Rising: "Your Gemini Rising greets the world with sparkling curiosity and a disarming smile. People experience you as endlessly interesting, a mind in perpetual motion. This energy animates the artwork's most dynamic, layered elements." },
  Cancer: { Sun: "Your Cancer Sun carries the memory of every tide - protective, nurturing, and deeply intuitive. Home is not a place for you; it is a feeling you create wherever you go. Your artwork radiates this luminous, sheltering warmth.", Moon: "Your Cancer Moon is the ocean itself - vast, cyclical, and impossibly deep. You feel the world's emotions as your own, a gift that is both beautiful and overwhelming. The artwork holds space for this profound emotional depth.", Rising: "Your Cancer Rising wraps the world in an aura of gentle protection. Others sense your empathy before you offer it. This nurturing first impression softens the artwork's edges with moonlit tenderness." },
  Leo: { Sun: "Your Leo Sun blazes with the confidence of someone who was born to create and be witnessed. Generosity pours from you like sunlight - warm, abundant, and life-giving. Your artwork glows with this radiant, sovereign energy.", Moon: "Your Leo Moon needs to love and be loved with theatrical devotion. Your emotional world is a stage, and every feeling deserves a standing ovation. The artwork captures this magnificent inner fire, unapologetically luminous.", Rising: "Your Leo Rising enters every room like the sun cresting the horizon. Charisma is your birthright, and presence is your gift. This commanding energy gives the artwork its most regal, golden quality." },
  Virgo: { Sun: "Your Virgo Sun finds the sacred in the details, turning precision into a form of devotion. You heal the world by noticing what others overlook. Your artwork is woven with this meticulous, quietly brilliant energy.", Moon: "Your Virgo Moon seeks emotional clarity the way a gardener tends soil - with patience, care, and purpose. You process feelings through service and quiet acts of love. The artwork reflects this understated emotional intelligence.", Rising: "Your Virgo Rising meets the world with composed elegance and a discerning eye. Others trust your judgment instinctively. This refined perception shapes the artwork's most intentional, carefully placed details." },
  Libra: { Sun: "Your Libra Sun seeks harmony the way a compass seeks north - it is not a choice, but a calling. Beauty, fairness, and connection are the pillars of your world. Your artwork breathes with this elegant equilibrium.", Moon: "Your Libra Moon feels most at peace when the emotional landscape is balanced and beautiful. Conflict unsettles you deeply, because you sense the world's potential for grace. The artwork holds this longing for harmony in its symmetry.", Rising: "Your Libra Rising greets others with effortless charm and a natural sense of diplomacy. The world sees you as a bridge between opposites. This balancing energy gives the artwork its most harmonious, inviting composition." },
  Scorpio: { Sun: "Your Scorpio Sun does not skim the surface - you dive to the depths where truth lives, unafraid of what you find. Transformation is your element, and intensity is your language. Your artwork pulses with this magnetic, unflinching power.", Moon: "Your Scorpio Moon feels everything at full voltage - love, loss, loyalty, and rage. Emotional half-measures are impossible for you. The artwork channels this profound inner intensity into its darkest, most compelling layers.", Rising: "Your Scorpio Rising meets the world with penetrating eyes and an aura of mystery. People sense your depth before you reveal a thing. This magnetic presence gives the artwork its most haunting, unforgettable quality." },
  Sagittarius: { Sun: "Your Sagittarius Sun chases the horizon with the joy of someone who knows the journey is the destination. Freedom and meaning are your twin flames. Your artwork carries this expansive, adventurous spirit across every element.", Moon: "Your Sagittarius Moon processes emotions through philosophy and wanderlust. When feelings arise, you seek meaning, not comfort. The artwork reflects this restless inner optimism, a fire that always points toward something greater.", Rising: "Your Sagittarius Rising walks into the world with infectious enthusiasm and a wide-open heart. Others feel inspired simply by your presence. This adventurous energy gives the artwork its most expansive, boundary-breaking quality." },
  Capricorn: { Sun: "Your Capricorn Sun builds empires from discipline and quiet ambition, one stone at a time. You understand that legacy is earned through endurance, not luck. Your artwork stands with this monumental, grounded authority.", Moon: "Your Capricorn Moon processes emotions with the patience of a mountain weathering centuries. Feelings are not obstacles - they are raw material for wisdom. The artwork carries this stoic emotional strength in its most structured forms.", Rising: "Your Capricorn Rising meets the world with composed authority and understated power. People respect you before they know your story. This commanding presence gives the artwork its most architectural, enduring quality." },
  Aquarius: { Sun: "Your Aquarius Sun sees the world not as it is, but as it could be - and refuses to settle for less. Innovation and independence are your oxygen. Your artwork crackles with this visionary, boundary-dissolving energy.", Moon: "Your Aquarius Moon feels emotions from a satellite's distance - observing, analyzing, and ultimately transforming them into insight. Detachment is your superpower, not your weakness. The artwork captures this cool, electric emotional frequency.", Rising: "Your Aquarius Rising greets the world as a friendly enigma, equal parts warmth and eccentricity. Others are drawn to your originality without fully understanding it. This unconventional energy gives the artwork its most surprising, future-facing elements." },
  Pisces: { Sun: "Your Pisces Sun dissolves the boundaries between self and cosmos, feeling everything with oceanic depth. Empathy is your art, and imagination is your homeland. Your artwork shimmers with this transcendent, dreamlike sensitivity.", Moon: "Your Pisces Moon is a vast inner sea where feelings flow without borders - beautiful, overwhelming, and endlessly creative. You absorb the world's emotions and alchemize them into something sacred. The artwork holds this boundless emotional universe.", Rising: "Your Pisces Rising meets the world through a veil of enchantment, as though you arrived from somewhere gentler. Others sense your otherworldly compassion instantly. This ethereal presence gives the artwork its most luminous, mystical quality." },
};

function getSignInterpretation(planet: string, sign?: string): string {
  if (!sign) return "";
  return SIGN_INTERPRETATIONS[sign]?.[planet] || "";
}

function _coerceDate(value: any, fallback?: Date | null): Date | null {
  if (!value) return fallback ?? null;
  return value instanceof Date ? value : new Date(value);
}

function _toIsoString(value: Date | null): string {
  return value ? value.toISOString() : "";
}

function _toDisplayDate(value: Date | null): string {
  if (!value) return "";
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const yy = String(value.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function _buildArtworkVariationUrl(input: any, primaryArtworkUrl: string): string {
  return _normalizeText(input.artworkVariationUrl) || primaryArtworkUrl;
}

function _buildProductUrl(input: any): string {
  const explicitProductUrl = _normalizeText(input.productUrl);
  return buildEmailOrderResumeUrl({
    artworkId: input.artworkId,
    sessionId: input.sessionId,
    fallbackUrl: explicitProductUrl || KLAVIYO_DEFAULTS.productUrl,
  });
}

function buildKlaviyoProfileProperties(input: any) {
  const now = _coerceDate(input.captureTimestamp, new Date())!;
  const artworkExpiryDate = _coerceDate(input.artworkExpiryDate, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
  const cosmic10Expiry = _coerceDate(input.cosmic10Expiry, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const artworkUrl = _normalizeText(input.artworkUrl);
  const explicitEmailMockupUrl = _normalizeText(input.emailMockupUrl);
  const emailMockupMediumUrl = _normalizeText(input.emailMockupMediumUrl);
  const emailMockupSmallUrl = _normalizeText(input.emailMockupSmallUrl);
  const emailMockupLargeUrl = _normalizeText(input.emailMockupLargeUrl);
  const emailMockupUrl = explicitEmailMockupUrl || emailMockupMediumUrl || artworkUrl;
  const primaryArtworkUrl = artworkUrl || emailMockupUrl;
  const artworkVariationUrl = _buildArtworkVariationUrl(input, primaryArtworkUrl);
  const nurtureBranch = _normalizeText(input.nurtureBranch) || KLAVIYO_DEFAULTS.nurtureBranch;
  const peakSeason = _normalizeText(input.peakSeason) || KLAVIYO_DEFAULTS.peakSeason;
  const firstName = _normalizeText(input.firstName);
  const greetingName = firstName || KLAVIYO_DEFAULTS.greetingName;
  const productUrl = _buildProductUrl(input);

  return {
    sun_sign: _normalizeText(input.sunSign),
    moon_sign: _normalizeText(input.moonSign),
    rising_sign: _normalizeText(input.risingSign),
    sun: _normalizeText(input.sunSign),
    moon: _normalizeText(input.moonSign),
    rising: _normalizeText(input.risingSign),
    artwork_url: primaryArtworkUrl,
    artwork_variation_url: artworkVariationUrl,
    artwork_download_url: primaryArtworkUrl,
    artwork_primary_url: primaryArtworkUrl,
    artwork_image_url: primaryArtworkUrl,
    image_url: primaryArtworkUrl,
    preview_image_url: emailMockupUrl || primaryArtworkUrl,
    download_url: primaryArtworkUrl,
    email_mockup_url: emailMockupUrl || primaryArtworkUrl,
    email_mockup_small: emailMockupSmallUrl,
    email_mockup_medium: emailMockupMediumUrl,
    email_mockup_large: emailMockupLargeUrl,
    artwork_id: _normalizeText(input.artworkId),
    session_id: _normalizeText(input.sessionId),
    peak_season: peakSeason,
    dominant_element: _normalizeText(input.dominantElement),
    element_balance: input.elementBalance ?? null,
    artwork_expiry_date: _toIsoString(artworkExpiryDate),
    expiry_date: _toIsoString(artworkExpiryDate),
    cosmic10_expiry: _toIsoString(cosmic10Expiry),
    nurture_branch: nurtureBranch,
    discount_code_active: KLAVIYO_DEFAULTS.discountCode,
    discount_code: KLAVIYO_DEFAULTS.discountCode,
    discount_amount: KLAVIYO_DEFAULTS.discountAmount,
    capture_timestamp: now.toISOString(),
    capture_date: now.toISOString(),
    capture_date_display: _toDisplayDate(now),
    expiry_date_display: _toDisplayDate(artworkExpiryDate),
    greeting_name: greetingName,
    first_name_fallback: greetingName,
    product_url: productUrl,
    sun_sign_interpretation: getSignInterpretation("Sun", input.sunSign),
    moon_sign_interpretation: getSignInterpretation("Moon", input.moonSign),
    rising_sign_interpretation: getSignInterpretation("Rising", input.risingSign),
    delivery_cutoff_date: _normalizeText(input.deliveryCutoffDate),
    season_gifting_copy: _normalizeText(input.seasonGiftingCopy),
    email_story_subject_explanation: _normalizeText(input.emailStorySubjectExplanation),
    email_story_sun_title: _normalizeText(input.emailStorySunTitle),
    email_story_sun_copy: _normalizeText(input.emailStorySunCopy),
    email_story_sun_crop_url: _normalizeText(input.emailStorySunCropUrl),
    email_story_moon_title: _normalizeText(input.emailStoryMoonTitle),
    email_story_moon_copy: _normalizeText(input.emailStoryMoonCopy),
    email_story_moon_crop_url: _normalizeText(input.emailStoryMoonCropUrl),
    email_story_rising_title: _normalizeText(input.emailStoryRisingTitle),
    email_story_rising_copy: _normalizeText(input.emailStoryRisingCopy),
    email_story_rising_crop_url: _normalizeText(input.emailStoryRisingCropUrl),
  };
}

function buildKlaviyoIdentifyAttributes(input: any) {
  return {
    email: _normalizeText(input.email).toLowerCase(),
    first_name: _normalizeText(input.firstName) || KLAVIYO_DEFAULTS.greetingName,
    properties: buildKlaviyoProfileProperties(input),
  };
}

function buildEmailCapturedEventProperties(input: any) {
  const profileProperties = buildKlaviyoProfileProperties(input);
  return {
    ...profileProperties,
    email: _normalizeText(input.email).toLowerCase(),
    capture_source: _normalizeText(input.captureSource) || KLAVIYO_DEFAULTS.captureSource,
    event_name: "Email Captured",
    event_timestamp: profileProperties.capture_timestamp,
  };
}

function buildEmailCapturedEventAttributes(input: any) {
  return {
    email: _normalizeText(input.email).toLowerCase(),
    first_name: _normalizeText(input.firstName) || KLAVIYO_DEFAULTS.greetingName,
    properties: buildEmailCapturedEventProperties(input),
  };
}
// ── End inlined dependencies ──

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function summarizeStoryFields(input: Record<string, unknown>) {
  return {
    email_story_subject_explanation: _normalizeText(input.emailStorySubjectExplanation),
    email_story_sun_title: _normalizeText(input.emailStorySunTitle),
    email_story_sun_copy: _normalizeText(input.emailStorySunCopy),
    email_story_sun_crop_url: _normalizeText(input.emailStorySunCropUrl),
    email_story_moon_title: _normalizeText(input.emailStoryMoonTitle),
    email_story_moon_copy: _normalizeText(input.emailStoryMoonCopy),
    email_story_moon_crop_url: _normalizeText(input.emailStoryMoonCropUrl),
    email_story_rising_title: _normalizeText(input.emailStoryRisingTitle),
    email_story_rising_copy: _normalizeText(input.emailStoryRisingCopy),
    email_story_rising_crop_url: _normalizeText(input.emailStoryRisingCropUrl),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const requestBody = await req.json();
    const {
      email,
      firstName,
      sunSign,
      moonSign,
      risingSign,
      artworkUrl,
      artworkVariationUrl,
      emailMockupUrl,
      emailMockupSmallUrl,
      emailMockupMediumUrl,
      emailMockupLargeUrl,
      artworkId,
      sessionId,
      peakSeason,
      dominantElement,
      elementBalance,
      emailStorySubjectExplanation,
      emailStorySunTitle,
      emailStorySunCopy,
      emailStorySunCropUrl,
      emailStoryMoonTitle,
      emailStoryMoonCopy,
      emailStoryMoonCropUrl,
      emailStoryRisingTitle,
      emailStoryRisingCopy,
      emailStoryRisingCropUrl,
    } = requestBody;

    if (!email) {
      throw new Error("Missing email");
    }

    console.log(`[capture-email] Processing capture for ${email}`);
    console.log("[capture-email] Incoming Email 2 story fields:", summarizeStoryFields(requestBody));

    const now = new Date();
    const artworkExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const cosmic10Expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const resolvedArtworkUrl = await resolveEmailSafeArtworkUrl({
      supabase,
      artworkUrl,
      artworkId,
      sessionId,
      supabaseUrl: SUPABASE_URL,
    });

    const isMockupUrl = (url?: string) => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      if (trimmed === resolvedArtworkUrl) return false;
      if (trimmed === artworkUrl) return false;
      return trimmed.startsWith("http");
    };

    const validMockupSmall = isMockupUrl(emailMockupSmallUrl) ? emailMockupSmallUrl.trim() : "";
    const validMockupMedium = isMockupUrl(emailMockupMediumUrl) ? emailMockupMediumUrl.trim() : "";
    const validMockupLarge = isMockupUrl(emailMockupLargeUrl) ? emailMockupLargeUrl.trim() : "";
    const validMockupPrimary = validMockupMedium || validMockupSmall || validMockupLarge || "";

    console.log(`[capture-email] Mockup validation:`, {
      receivedSmall: emailMockupSmallUrl || "(empty)",
      receivedMedium: emailMockupMediumUrl || "(empty)",
      receivedLarge: emailMockupLargeUrl || "(empty)",
      validSmall: validMockupSmall || "(none)",
      validMedium: validMockupMedium || "(none)",
      validLarge: validMockupLarge || "(none)",
      artworkUrl: resolvedArtworkUrl || "(empty)",
      mockupsAreReal: !!(validMockupSmall && validMockupMedium && validMockupLarge),
    });

    const { data: capture, error: upsertError } = await supabase
      .from("email_captures")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          first_name: firstName || null,
          sun_sign: sunSign || null,
          moon_sign: moonSign || null,
          rising_sign: risingSign || null,
          artwork_url: resolvedArtworkUrl || null,
          email_mockup_url: validMockupPrimary || null,
          artwork_id: artworkId || null,
          session_id: sessionId || null,
          peak_season: peakSeason || "default",
          dominant_element: dominantElement || null,
          element_balance: elementBalance || null,
          capture_timestamp: now.toISOString(),
          artwork_expiry_date: artworkExpiryDate.toISOString(),
          cosmic10_expiry: cosmic10Expiry.toISOString(),
          nurture_branch: "preview_only",
          status: "active",
          converted: false,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error("[capture-email] Upsert error:", upsertError);
      throw new Error(`DB upsert failed: ${upsertError.message}`);
    }

    const captureId = capture?.id;
    console.log(`[capture-email] Upserted capture: ${captureId}`);

    const KLAVIYO_COMPANY_ID = "XEPXRf";

    try {
      await syncToKlaviyoClientAPI({
        companyId: KLAVIYO_COMPANY_ID,
        email: email.trim().toLowerCase(),
        firstName,
        sunSign,
        moonSign,
        risingSign,
        artworkUrl: resolvedArtworkUrl,
        artworkVariationUrl,
        emailMockupUrl: validMockupPrimary,
        emailMockupSmallUrl: validMockupSmall,
        emailMockupMediumUrl: validMockupMedium,
        emailMockupLargeUrl: validMockupLarge,
        artworkId,
        sessionId,
        peakSeason,
        dominantElement,
        elementBalance,
        artworkExpiryDate,
        cosmic10Expiry,
        captureTimestamp: now,
        emailStorySubjectExplanation,
        emailStorySunTitle,
        emailStorySunCopy,
        emailStorySunCropUrl,
        emailStoryMoonTitle,
        emailStoryMoonCopy,
        emailStoryMoonCropUrl,
        emailStoryRisingTitle,
        emailStoryRisingCopy,
        emailStoryRisingCropUrl,
      });
    } catch (klaviyoErr) {
      console.warn("[capture-email] Klaviyo Client API sync failed (non-blocking):", klaviyoErr);
    }

    return new Response(
      JSON.stringify({ success: true, captureId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[capture-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function buildProxyImageUrl(supabaseUrl: string, url?: string | null) {
  if (!url) return "";
  return `${supabaseUrl}/functions/v1/proxy-image?url=${encodeURIComponent(url)}`;
}

async function findStoredArtworkUrl({
  supabase,
  artworkId,
  sessionId,
}: {
  supabase: ReturnType<typeof createClient>;
  artworkId?: string;
  sessionId?: string;
}) {
  if (artworkId) {
    const { data } = await supabase
      .from("artworks")
      .select("artwork_url")
      .eq("id", artworkId)
      .maybeSingle();

    if (data?.artwork_url) return data.artwork_url;
  }

  if (sessionId) {
    const { data } = await supabase
      .from("artworks")
      .select("artwork_url")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.artwork_url) return data.artwork_url;
  }

  return "";
}

async function resolveEmailSafeArtworkUrl({
  supabase,
  artworkUrl,
  artworkId,
  sessionId,
  supabaseUrl,
}: {
  supabase: ReturnType<typeof createClient>;
  artworkUrl?: string;
  artworkId?: string;
  sessionId?: string;
  supabaseUrl: string;
}) {
  if (artworkUrl?.includes("supabase.co")) return artworkUrl;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const storedUrl = await findStoredArtworkUrl({ supabase, artworkId, sessionId });
    if (storedUrl) return storedUrl;

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }

  return buildProxyImageUrl(supabaseUrl, artworkUrl);
}

interface KlaviyoClientSyncParams {
  companyId: string;
  email: string;
  firstName?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  artworkUrl?: string;
  artworkVariationUrl?: string;
  emailMockupUrl?: string;
  emailMockupSmallUrl?: string;
  emailMockupMediumUrl?: string;
  emailMockupLargeUrl?: string;
  artworkId?: string;
  sessionId?: string;
  peakSeason?: string;
  dominantElement?: string;
  elementBalance?: any;
  artworkExpiryDate: Date;
  cosmic10Expiry: Date;
  captureTimestamp: Date;
  emailStorySubjectExplanation?: string;
  emailStorySunTitle?: string;
  emailStorySunCopy?: string;
  emailStorySunCropUrl?: string;
  emailStoryMoonTitle?: string;
  emailStoryMoonCopy?: string;
  emailStoryMoonCropUrl?: string;
  emailStoryRisingTitle?: string;
  emailStoryRisingCopy?: string;
  emailStoryRisingCropUrl?: string;
}

async function syncToKlaviyoClientAPI(params: KlaviyoClientSyncParams) {
  const {
    companyId,
    email,
    firstName,
    sunSign,
    moonSign,
    risingSign,
    artworkUrl,
    artworkVariationUrl,
    emailMockupUrl,
    emailMockupSmallUrl,
    emailMockupMediumUrl,
    emailMockupLargeUrl,
    artworkId,
    sessionId,
    peakSeason,
    dominantElement,
    elementBalance,
    artworkExpiryDate,
    cosmic10Expiry,
    captureTimestamp,
    emailStorySubjectExplanation,
    emailStorySunTitle,
    emailStorySunCopy,
    emailStorySunCropUrl,
    emailStoryMoonTitle,
    emailStoryMoonCopy,
    emailStoryMoonCropUrl,
    emailStoryRisingTitle,
    emailStoryRisingCopy,
    emailStoryRisingCropUrl,
  } = params;

  const revision = "2024-10-15";
  const clientHeaders = {
    "Content-Type": "application/json",
    revision,
  };

  const klaviyoInput = {
    email,
    firstName,
    sunSign,
    moonSign,
    risingSign,
    artworkUrl,
    artworkVariationUrl,
    emailMockupUrl,
    emailMockupSmallUrl,
    emailMockupMediumUrl,
    emailMockupLargeUrl,
    artworkId,
    sessionId,
    peakSeason,
    dominantElement,
    elementBalance,
    artworkExpiryDate,
    cosmic10Expiry,
    captureTimestamp,
    emailStorySubjectExplanation,
    emailStorySunTitle,
    emailStorySunCopy,
    emailStorySunCropUrl,
    emailStoryMoonTitle,
    emailStoryMoonCopy,
    emailStoryMoonCropUrl,
    emailStoryRisingTitle,
    emailStoryRisingCopy,
    emailStoryRisingCropUrl,
  };

  const identifyAttributes = buildKlaviyoIdentifyAttributes(klaviyoInput);
  const eventAttributes = buildEmailCapturedEventAttributes(klaviyoInput);

  console.log("[capture-email] Final Email 2 story payload sent to Klaviyo:", {
    profile: {
      email_story_subject_explanation: identifyAttributes.properties.email_story_subject_explanation,
      email_story_sun_title: identifyAttributes.properties.email_story_sun_title,
      email_story_sun_copy: identifyAttributes.properties.email_story_sun_copy,
      email_story_sun_crop_url: identifyAttributes.properties.email_story_sun_crop_url,
      email_story_moon_title: identifyAttributes.properties.email_story_moon_title,
      email_story_moon_copy: identifyAttributes.properties.email_story_moon_copy,
      email_story_moon_crop_url: identifyAttributes.properties.email_story_moon_crop_url,
      email_story_rising_title: identifyAttributes.properties.email_story_rising_title,
      email_story_rising_copy: identifyAttributes.properties.email_story_rising_copy,
      email_story_rising_crop_url: identifyAttributes.properties.email_story_rising_crop_url,
    },
    event: {
      email_story_subject_explanation: eventAttributes.properties.email_story_subject_explanation,
      email_story_sun_title: eventAttributes.properties.email_story_sun_title,
      email_story_sun_copy: eventAttributes.properties.email_story_sun_copy,
      email_story_sun_crop_url: eventAttributes.properties.email_story_sun_crop_url,
      email_story_moon_title: eventAttributes.properties.email_story_moon_title,
      email_story_moon_copy: eventAttributes.properties.email_story_moon_copy,
      email_story_moon_crop_url: eventAttributes.properties.email_story_moon_crop_url,
      email_story_rising_title: eventAttributes.properties.email_story_rising_title,
      email_story_rising_copy: eventAttributes.properties.email_story_rising_copy,
      email_story_rising_crop_url: eventAttributes.properties.email_story_rising_crop_url,
    },
  });

  const identifyPayload = {
    data: {
      type: "profile",
      attributes: identifyAttributes,
    },
  };

  const identifyRes = await fetch(
    `https://a.klaviyo.com/client/profiles/?company_id=${companyId}`,
    {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify(identifyPayload),
    }
  );

  if (identifyRes.ok || identifyRes.status === 202) {
    console.log("[capture-email] Klaviyo Client API: profile identified");
  } else {
    const body = await identifyRes.text();
    console.warn(`[capture-email] Klaviyo identify failed (${identifyRes.status}): ${body}`);
  }

  const eventPayload = {
    data: {
      type: "event",
      attributes: {
        profile: {
          data: {
            type: "profile",
            attributes: {
              email,
              first_name: eventAttributes.first_name,
              properties: identifyAttributes.properties,
            },
          },
        },
        metric: {
          data: {
            type: "metric",
            attributes: { name: "Email Captured" },
          },
        },
        properties: eventAttributes.properties,
        time: captureTimestamp.toISOString(),
        unique_id: `email-capture-${captureTimestamp.getTime()}-${Math.random().toString(36).slice(2, 11)}`,
      },
    },
  };

  const eventRes = await fetch(
    `https://a.klaviyo.com/client/events/?company_id=${companyId}`,
    {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify(eventPayload),
    }
  );

  if (eventRes.ok || eventRes.status === 202) {
    console.log("[capture-email] Klaviyo Client API: 'Email Captured' event tracked");
  } else {
    const body = await eventRes.text();
    console.warn(`[capture-email] Klaviyo event failed (${eventRes.status}): ${body}`);
  }
}
