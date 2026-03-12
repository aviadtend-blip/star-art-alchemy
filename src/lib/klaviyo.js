/**
 * Klaviyo client-side integration for Celestial Artworks.
 *
 * Uses the Klaviyo onsite.js snippet and the client-side push API
 * to identify profiles, track events, and power email flows.
 */

const KLAVIYO_PUBLIC_KEY = import.meta.env.VITE_KLAVIYO_PUBLIC_KEY;

/* ------------------------------------------------------------------ */
/*  Sign interpretation lookup                                         */
/* ------------------------------------------------------------------ */

const SIGN_INTERPRETATIONS = {
  Aries: { Sun: "Your Aries Sun burns with the fire of a pioneer, igniting every room you enter with raw courage. You lead with instinct, not permission, carving paths where none existed. Your artwork channels this fearless energy into bold, unapologetic forms.", Moon: "Your Aries Moon feels emotions like a struck match — instant, bright, and impossible to ignore. Beneath your surface lies a fierce need for emotional independence. The artwork captures this inner spark, the fire that never asks to be lit.", Rising: "Your Aries Rising walks into the world like a declaration of intent. People sense your courage before you speak a word. This ascendant energy shapes the artwork's boldest edges, its forward momentum frozen in color." },
  Taurus: { Sun: "Your Taurus Sun is rooted in the earth like an ancient oak, drawing beauty from stillness and patience. You understand that the most valuable things take time to grow. Your artwork reflects this reverence for permanence and sensory richness.", Moon: "Your Taurus Moon craves emotional landscapes that feel like velvet — soft, rich, and deeply comforting. Security is not a luxury for you; it is oxygen. The artwork holds this tenderness in its warmest, most grounded tones.", Rising: "Your Taurus Rising radiates quiet magnetism, an effortless elegance that draws others in. The world sees you as a sanctuary of calm and beauty. This steady presence anchors the artwork's composition with timeless grace." },
  Gemini: { Sun: "Your Gemini Sun lives in the electric space between ideas, weaving stories from thin air with effortless wit. Curiosity is your compass, and every conversation is a doorway. Your artwork dances with this quicksilver intelligence.", Moon: "Your Gemini Moon processes feelings through words, forever narrating the inner world to make sense of it. Emotional restlessness fuels your search for meaning in the everyday. The artwork captures this mercurial inner dialogue in shifting patterns.", Rising: "Your Gemini Rising greets the world with sparkling curiosity and a disarming smile. People experience you as endlessly interesting, a mind in perpetual motion. This energy animates the artwork's most dynamic, layered elements." },
  Cancer: { Sun: "Your Cancer Sun carries the memory of every tide — protective, nurturing, and deeply intuitive. Home is not a place for you; it is a feeling you create wherever you go. Your artwork radiates this luminous, sheltering warmth.", Moon: "Your Cancer Moon is the ocean itself — vast, cyclical, and impossibly deep. You feel the world's emotions as your own, a gift that is both beautiful and overwhelming. The artwork holds space for this profound emotional depth.", Rising: "Your Cancer Rising wraps the world in an aura of gentle protection. Others sense your empathy before you offer it. This nurturing first impression softens the artwork's edges with moonlit tenderness." },
  Leo: { Sun: "Your Leo Sun blazes with the confidence of someone who was born to create and be witnessed. Generosity pours from you like sunlight — warm, abundant, and life-giving. Your artwork glows with this radiant, sovereign energy.", Moon: "Your Leo Moon needs to love and be loved with theatrical devotion. Your emotional world is a stage, and every feeling deserves a standing ovation. The artwork captures this magnificent inner fire, unapologetically luminous.", Rising: "Your Leo Rising enters every room like the sun cresting the horizon. Charisma is your birthright, and presence is your gift. This commanding energy gives the artwork its most regal, golden quality." },
  Virgo: { Sun: "Your Virgo Sun finds the sacred in the details, turning precision into a form of devotion. You heal the world by noticing what others overlook. Your artwork is woven with this meticulous, quietly brilliant energy.", Moon: "Your Virgo Moon seeks emotional clarity the way a gardener tends soil — with patience, care, and purpose. You process feelings through service and quiet acts of love. The artwork reflects this understated emotional intelligence.", Rising: "Your Virgo Rising meets the world with composed elegance and a discerning eye. Others trust your judgment instinctively. This refined perception shapes the artwork's most intentional, carefully placed details." },
  Libra: { Sun: "Your Libra Sun seeks harmony the way a compass seeks north — it is not a choice, but a calling. Beauty, fairness, and connection are the pillars of your world. Your artwork breathes with this elegant equilibrium.", Moon: "Your Libra Moon feels most at peace when the emotional landscape is balanced and beautiful. Conflict unsettles you deeply, because you sense the world's potential for grace. The artwork holds this longing for harmony in its symmetry.", Rising: "Your Libra Rising greets others with effortless charm and a natural sense of diplomacy. The world sees you as a bridge between opposites. This balancing energy gives the artwork its most harmonious, inviting composition." },
  Scorpio: { Sun: "Your Scorpio Sun does not skim the surface — you dive to the depths where truth lives, unafraid of what you find. Transformation is your element, and intensity is your language. Your artwork pulses with this magnetic, unflinching power.", Moon: "Your Scorpio Moon feels everything at full voltage — love, loss, loyalty, and rage. Emotional half-measures are impossible for you. The artwork channels this profound inner intensity into its darkest, most compelling layers.", Rising: "Your Scorpio Rising meets the world with penetrating eyes and an aura of mystery. People sense your depth before you reveal a thing. This magnetic presence gives the artwork its most haunting, unforgettable quality." },
  Sagittarius: { Sun: "Your Sagittarius Sun chases the horizon with the joy of someone who knows the journey is the destination. Freedom and meaning are your twin flames. Your artwork carries this expansive, adventurous spirit across every element.", Moon: "Your Sagittarius Moon processes emotions through philosophy and wanderlust. When feelings arise, you seek meaning, not comfort. The artwork reflects this restless inner optimism, a fire that always points toward something greater.", Rising: "Your Sagittarius Rising walks into the world with infectious enthusiasm and a wide-open heart. Others feel inspired simply by your presence. This adventurous energy gives the artwork its most expansive, boundary-breaking quality." },
  Capricorn: { Sun: "Your Capricorn Sun builds empires from discipline and quiet ambition, one stone at a time. You understand that legacy is earned through endurance, not luck. Your artwork stands with this monumental, grounded authority.", Moon: "Your Capricorn Moon processes emotions with the patience of a mountain weathering centuries. Feelings are not obstacles — they are raw material for wisdom. The artwork carries this stoic emotional strength in its most structured forms.", Rising: "Your Capricorn Rising meets the world with composed authority and understated power. People respect you before they know your story. This commanding presence gives the artwork its most architectural, enduring quality." },
  Aquarius: { Sun: "Your Aquarius Sun sees the world not as it is, but as it could be — and refuses to settle for less. Innovation and independence are your oxygen. Your artwork crackles with this visionary, boundary-dissolving energy.", Moon: "Your Aquarius Moon feels emotions from a satellite's distance — observing, analyzing, and ultimately transforming them into insight. Detachment is your superpower, not your weakness. The artwork captures this cool, electric emotional frequency.", Rising: "Your Aquarius Rising greets the world as a friendly enigma, equal parts warmth and eccentricity. Others are drawn to your originality without fully understanding it. This unconventional energy gives the artwork its most surprising, future-facing elements." },
  Pisces: { Sun: "Your Pisces Sun dissolves the boundaries between self and cosmos, feeling everything with oceanic depth. Empathy is your art, and imagination is your homeland. Your artwork shimmers with this transcendent, dreamlike sensitivity.", Moon: "Your Pisces Moon is a vast inner sea where feelings flow without borders — beautiful, overwhelming, and endlessly creative. You absorb the world's emotions and alchemize them into something sacred. The artwork holds this boundless emotional universe.", Rising: "Your Pisces Rising meets the world through a veil of enchantment, as though you arrived from somewhere gentler. Others sense your otherworldly compassion instantly. This ethereal presence gives the artwork its most luminous, mystical quality." },
};

function getSignInterpretation(planet, sign) {
  return SIGN_INTERPRETATIONS[sign]?.[planet] || '';
}

/* ------------------------------------------------------------------ */
/*  1. Script injection                                                */
/* ------------------------------------------------------------------ */

export function initKlaviyo() {
  if (!KLAVIYO_PUBLIC_KEY) {
    console.warn('[klaviyo] VITE_KLAVIYO_PUBLIC_KEY not set — skipping init');
    return;
  }

  if (document.querySelector('script[src*="klaviyo.com/onsite/js"]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_PUBLIC_KEY}`;
  document.head.appendChild(script);
}

/* ------------------------------------------------------------------ */
/*  2. Readiness helper                                                */
/* ------------------------------------------------------------------ */

export function withKlaviyo(callback) {
  if (typeof window === 'undefined') return;

  let attempts = 0;
  const maxAttempts = 40; // ~10 s

  const poll = setInterval(() => {
    attempts++;
    if (window.klaviyo) {
      clearInterval(poll);
      callback(window.klaviyo);
    } else if (attempts >= maxAttempts) {
      clearInterval(poll);
      console.warn('[klaviyo] Timed out waiting for window.klaviyo');
    }
  }, 250);
}

/* ------------------------------------------------------------------ */
/*  3. Peak-season detection                                           */
/* ------------------------------------------------------------------ */

export function detectPeakSeason() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-indexed
  const d = now.getDate();

  if ((m === 4) || (m === 5 && d <= 15)) return 'mothers_day';
  if ((m === 1 && d >= 15) || (m === 2 && d <= 20)) return 'valentines';
  if ((m === 11) || (m === 12 && d <= 25)) return 'holiday';
  return 'default';
}

/* ------------------------------------------------------------------ */
/*  4. Identify profile                                                */
/* ------------------------------------------------------------------ */

export function identifyProfile({
  email,
  firstName,
  sunSign,
  moonSign,
  risingSign,
  artworkUrl,
  emailMockupUrl,
  artworkId,
  captureTimestamp,
  peakSeason,
  dominantElement,
  elementBalance,
}) {
  const now = new Date();
  const artworkExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const cosmic10Expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const captureTs = captureTimestamp || now.toISOString();

  withKlaviyo((kl) => {
    kl.push([
      'identify',
      {
        $email: email,
        $first_name: firstName,
        sun_sign: sunSign,
        moon_sign: moonSign,
        rising_sign: risingSign,
        artwork_url: artworkUrl,
        artwork_variation_url: artworkUrl,
        artwork_download_url: artworkUrl,
        email_mockup_url: emailMockupUrl,
        email_mockup_small: emailMockupUrl,
        email_mockup_medium: emailMockupUrl,
        email_mockup_large: emailMockupUrl,
        artwork_id: artworkId,
        capture_timestamp: captureTs,
        capture_date: captureTs,
        peak_season: peakSeason || detectPeakSeason(),
        dominant_element: dominantElement,
        element_balance: elementBalance,
        artwork_expiry_date: artworkExpiry.toISOString(),
        expiry_date: artworkExpiry.toISOString(),
        cosmic10_expiry: cosmic10Expiry.toISOString(),
        nurture_branch: 'preview_only',
        discount_code_active: 'COSMIC10',
        product_url: 'https://celestialartworks.com/shop',
        sun_sign_interpretation: sunSign ? getSignInterpretation('Sun', sunSign) : '',
        moon_sign_interpretation: moonSign ? getSignInterpretation('Moon', moonSign) : '',
        rising_sign_interpretation: risingSign ? getSignInterpretation('Rising', risingSign) : '',
        delivery_cutoff_date: '',
        season_gifting_copy: '',
      },
    ]);
  });
}

/* ------------------------------------------------------------------ */
/*  5. Generic event tracking                                          */
/* ------------------------------------------------------------------ */

export function trackEvent(eventName, properties = {}) {
  withKlaviyo((kl) => {
    kl.push(['track', eventName, properties]);
  });
}

/* ------------------------------------------------------------------ */
/*  6. Track "Email Captured"                                          */
/* ------------------------------------------------------------------ */

export function trackEmailCaptured({
  email,
  firstName,
  sunSign,
  moonSign,
  risingSign,
  artworkUrl,
  emailMockupUrl,
  artworkId,
  captureTimestamp,
  peakSeason,
  dominantElement,
  elementBalance,
}) {
  // Ensure the profile is identified first
  identifyProfile({
    email,
    firstName,
    sunSign,
    moonSign,
    risingSign,
    artworkUrl,
    emailMockupUrl,
    artworkId,
    captureTimestamp,
    peakSeason,
    dominantElement,
    elementBalance,
  });

  trackEvent('Email Captured', {
    email,
    sun_sign: sunSign,
    moon_sign: moonSign,
    rising_sign: risingSign,
    artwork_url: artworkUrl,
    email_mockup_url: emailMockupUrl,
    artwork_id: artworkId,
    discount_code: 'COSMIC10',
    capture_source: 'preview_download',
    peak_season: peakSeason || detectPeakSeason(),
    dominant_element: dominantElement,
    element_balance: elementBalance,
  });
}

/* ------------------------------------------------------------------ */
/*  7. Track "Checkout Started"                                        */
/* ------------------------------------------------------------------ */

export function trackCheckoutStarted({ email, artworkUrl, size, price, checkoutUrl }) {
  const now = new Date().toISOString();

  trackEvent('Checkout Started', {
    email,
    artwork_url: artworkUrl,
    size,
    price,
    checkout_url: checkoutUrl,
    checkout_started_at: now,
  });

  // Update profile nurture branch
  withKlaviyo((kl) => {
    kl.push([
      'identify',
      {
        $email: email,
        nurture_branch: 'checkout_abandoner',
        checkout_started_at: now,
      },
    ]);
  });
}
