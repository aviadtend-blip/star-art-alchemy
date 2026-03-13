/**
 * Klaviyo client-side integration for Celestial Artworks.
 *
 * Uses the Klaviyo onsite.js snippet and the client-side push API
 * to identify profiles, track events, and power email flows.
 */

import {
  buildEmailCapturedEventProperties,
  buildKlaviyoIdentifyAttributes,
} from "./klaviyoContract.js";

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
  sessionId,
  captureTimestamp,
  peakSeason,
  dominantElement,
  elementBalance,
}) {
  const identifyAttributes = buildKlaviyoIdentifyAttributes({
    email,
    firstName,
    sunSign,
    moonSign,
    risingSign,
    artworkUrl,
    emailMockupUrl,
    artworkId,
    sessionId,
    captureTimestamp,
    peakSeason,
    dominantElement,
    elementBalance,
  });

  withKlaviyo((kl) => {
    kl.push([
      'identify',
      {
        $email: identifyAttributes.email,
        $first_name: identifyAttributes.first_name,
        ...identifyAttributes.properties,
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
  sessionId,
  captureTimestamp,
  peakSeason,
  dominantElement,
  elementBalance,
}) {
  const normalizedPeakSeason = peakSeason || detectPeakSeason();

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
    sessionId,
    captureTimestamp,
    peakSeason: normalizedPeakSeason,
    dominantElement,
    elementBalance,
  });

  trackEvent(
    'Email Captured',
    buildEmailCapturedEventProperties({
      email,
      firstName,
      sunSign,
      moonSign,
      risingSign,
      artworkUrl,
      emailMockupUrl,
      artworkId,
      sessionId,
      captureTimestamp,
      peakSeason: normalizedPeakSeason,
      dominantElement,
      elementBalance,
    }),
  );
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
