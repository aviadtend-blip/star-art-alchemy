import { buildEmailOrderResumeUrl } from "./emailOrderResume.js";

export const KLAVIYO_DEFAULTS = {
  nurtureBranch: "preview_only",
  peakSeason: "default",
  discountCode: "COSMIC10",
  discountAmount: 10,
  productUrl: "https://celestialartworks.com/shop",
  captureSource: "preview_download",
  greetingName: "there",
};

const SIGN_INTERPRETATIONS = {
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

export function getSignInterpretation(planet, sign) {
  if (!sign) return "";
  return SIGN_INTERPRETATIONS[sign]?.[planet] || "";
}

function coerceDate(value, fallback) {
  if (!value) return fallback ?? null;
  return value instanceof Date ? value : new Date(value);
}

function toIsoString(value) {
  return value ? value.toISOString() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildArtworkVariationUrl(input, primaryArtworkUrl) {
  return normalizeText(input.artworkVariationUrl) || primaryArtworkUrl;
}

function buildProductUrl(input) {
  const explicitProductUrl = normalizeText(input.productUrl);

  return buildEmailOrderResumeUrl({
    artworkId: input.artworkId,
    sessionId: input.sessionId,
    fallbackUrl: explicitProductUrl || KLAVIYO_DEFAULTS.productUrl,
  });
}

export function buildKlaviyoProfileProperties(input) {
  const now = coerceDate(input.captureTimestamp, new Date());
  const artworkExpiryDate = coerceDate(
    input.artworkExpiryDate,
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  );
  const cosmic10Expiry = coerceDate(
    input.cosmic10Expiry,
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  );
  const artworkUrl = normalizeText(input.artworkUrl);
  const explicitEmailMockupUrl = normalizeText(input.emailMockupUrl);
  const emailMockupMediumUrl = normalizeText(input.emailMockupMediumUrl);
  const emailMockupUrl = explicitEmailMockupUrl || emailMockupMediumUrl || artworkUrl;
  const primaryArtworkUrl = artworkUrl || emailMockupUrl;
  const artworkVariationUrl = buildArtworkVariationUrl(input, primaryArtworkUrl);
  const emailMockupSmallUrl = normalizeText(input.emailMockupSmallUrl) || emailMockupUrl || primaryArtworkUrl;
  const normalizedEmailMockupMediumUrl = emailMockupMediumUrl || emailMockupUrl || primaryArtworkUrl;
  const emailMockupLargeUrl = normalizeText(input.emailMockupLargeUrl) || emailMockupUrl || primaryArtworkUrl;
  const nurtureBranch = normalizeText(input.nurtureBranch) || KLAVIYO_DEFAULTS.nurtureBranch;
  const peakSeason = normalizeText(input.peakSeason) || KLAVIYO_DEFAULTS.peakSeason;
  const firstName = normalizeText(input.firstName);
  const greetingName = firstName || KLAVIYO_DEFAULTS.greetingName;
  const productUrl = buildProductUrl(input);

  return {
    sun_sign: normalizeText(input.sunSign),
    moon_sign: normalizeText(input.moonSign),
    rising_sign: normalizeText(input.risingSign),
    sun: normalizeText(input.sunSign),
    moon: normalizeText(input.moonSign),
    rising: normalizeText(input.risingSign),
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
    email_mockup_medium: normalizedEmailMockupMediumUrl,
    email_mockup_large: emailMockupLargeUrl,
    artwork_id: normalizeText(input.artworkId),
    session_id: normalizeText(input.sessionId),
    peak_season: peakSeason,
    dominant_element: normalizeText(input.dominantElement),
    element_balance: input.elementBalance ?? null,
    artwork_expiry_date: toIsoString(artworkExpiryDate),
    expiry_date: toIsoString(artworkExpiryDate),
    cosmic10_expiry: toIsoString(cosmic10Expiry),
    nurture_branch: nurtureBranch,
    discount_code_active: KLAVIYO_DEFAULTS.discountCode,
    discount_code: KLAVIYO_DEFAULTS.discountCode,
    discount_amount: KLAVIYO_DEFAULTS.discountAmount,
    capture_timestamp: now.toISOString(),
    capture_date: now.toISOString(),
    greeting_name: greetingName,
    first_name_fallback: greetingName,
    product_url: productUrl,
    sun_sign_interpretation: getSignInterpretation("Sun", input.sunSign),
    moon_sign_interpretation: getSignInterpretation("Moon", input.moonSign),
    rising_sign_interpretation: getSignInterpretation("Rising", input.risingSign),
    delivery_cutoff_date: normalizeText(input.deliveryCutoffDate),
    season_gifting_copy: normalizeText(input.seasonGiftingCopy),
  };
}

export function buildKlaviyoIdentifyAttributes(input) {
  return {
    email: normalizeText(input.email).toLowerCase(),
    first_name: normalizeText(input.firstName) || KLAVIYO_DEFAULTS.greetingName,
    properties: buildKlaviyoProfileProperties(input),
  };
}

export function buildEmailCapturedEventProperties(input) {
  const profileProperties = buildKlaviyoProfileProperties(input);

  return {
    ...profileProperties,
    email: normalizeText(input.email).toLowerCase(),
    capture_source: normalizeText(input.captureSource) || KLAVIYO_DEFAULTS.captureSource,
    event_name: "Email Captured",
    event_timestamp: profileProperties.capture_timestamp,
  };
}

export function buildEmailCapturedEventAttributes(input) {
  return {
    email: normalizeText(input.email).toLowerCase(),
    first_name: normalizeText(input.firstName) || KLAVIYO_DEFAULTS.greetingName,
    properties: buildEmailCapturedEventProperties(input),
  };
}
