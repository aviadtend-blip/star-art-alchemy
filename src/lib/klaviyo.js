/**
 * Klaviyo client-side integration for Celestial Artworks.
 *
 * Uses the Klaviyo onsite.js snippet and the client-side push API
 * to identify profiles, track events, and power email flows.
 */

const KLAVIYO_PUBLIC_KEY = import.meta.env.VITE_KLAVIYO_PUBLIC_KEY;

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
