/* eslint-disable prefer-rest-params */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_ID = 'G-S8PWWMT089';

export function initGA4() {
  if (typeof window === 'undefined' || window.gtag) return;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: true });
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export function trackGenerateArtwork(styleId: string, referralSource?: string) {
  trackEvent('generate_artwork', {
    funnel_step: 'generate',
    style_id: styleId,
    referral_source: referralSource,
  });
}

export function trackViewArtwork(styleId: string) {
  trackEvent('view_artwork', {
    funnel_step: 'preview',
    style_id: styleId,
  });
}

export function trackEmailCapture(styleId: string) {
  trackEvent('email_capture', {
    funnel_step: 'email',
    style_id: styleId,
  });
}

export function trackBeginCustomization(styleId: string) {
  trackEvent('begin_customization', {
    funnel_step: 'customize',
    style_id: styleId,
  });
}

export function trackBeginCheckout(size: string, value: number) {
  trackEvent('begin_checkout', {
    funnel_step: 'checkout',
    artwork_size: size,
    value,
    currency: 'USD',
  });
}

export function trackPurchase(transactionId: string, value: number, items: any[]) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency: 'USD',
    items,
  });
}
