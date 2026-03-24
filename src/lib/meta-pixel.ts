/* eslint-disable prefer-rest-params */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const META_PIXEL_ID = '2200935197403683';

export function initMetaPixel() {
  if (typeof window === 'undefined' || window.fbq) return;

  const n: any = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  const script = document.createElement('script');
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.async = true;
  document.head.appendChild(script);

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function getFunnelType(): 'digital' | 'canvas' {
  if (typeof window === 'undefined') return 'canvas';
  const path = window.location.pathname;
  return path === '/d' || path.startsWith('/d/') ? 'digital' : 'canvas';
}

export function trackMetaGenerateArtwork(styleId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'GenerateArtwork', { style_id: styleId, funnel_type: getFunnelType() });
  }
}

export function trackMetaViewArtwork(styleId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: 'Birth Chart Artwork',
      content_category: styleId,
      content_type: 'product',
      funnel_type: getFunnelType(),
    });
  }
}

export function trackMetaEmailCapture(styleId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', { content_name: 'Email Capture', content_category: styleId, funnel_type: getFunnelType() });
  }
}

export function trackMetaBeginCheckout(value: number, currency: string = 'USD') {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', { value, currency, funnel_type: getFunnelType() });
  }
}

export function trackMetaDigitalDownload(styleId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'DigitalDownload', { style_id: styleId, funnel_type: getFunnelType() });
  }
}

export function trackMetaCanvasUpsellClick(styleId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'CanvasUpsellClick', { style_id: styleId, funnel_type: getFunnelType() });
  }
}

export function trackMetaPurchase(value: number, currency: string = 'USD', orderId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value,
      currency,
      content_type: 'product',
      content_name: 'Birth Chart Artwork',
      order_id: orderId,
      funnel_type: getFunnelType(),
    });
  }
}
