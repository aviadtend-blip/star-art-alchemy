/**
 * emailStoryGallery.js
 * Generates 4:3 horizontal close-up crops for Email 2 (The Story Behind Your Art).
 * Crops the full artwork around the Sun, Moon, and Rising hotspot centers
 * and uploads them to Supabase storage.
 *
 * Returns:
 * {
 *   sunCropUrl: string,
 *   moonCropUrl: string,
 *   risingCropUrl: string,
 * }
 */

import { supabase } from '@/integrations/supabase/client';
import { getStoryCropCenter } from '@/lib/emailStoryHotspots';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

// 4:3 crop — horizontal close-up
// The crop width is 40% of the image width; height = width * (3/4)
const CROP_WIDTH_FRACTION = 0.40;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadArtworkViaProxy(src) {
  const needsProxy = src.startsWith('http') && !src.startsWith(window.location.origin);
  if (!needsProxy) return loadImage(src);
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ url: src }),
  });
  if (!response.ok) {
    throw new Error(`Proxy failed: ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl);
    image._objectUrl = objectUrl;
    return image;
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function revokeImageObjectUrl(image) {
  if (image?._objectUrl) {
    URL.revokeObjectURL(image._objectUrl);
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) { resolve(blob); return; }
        reject(new Error('Canvas export failed'));
      },
      'image/jpeg',
      0.88,
    );
  });
}

/**
 * Crops the artwork centered around (cx, cy) with a 4:3 ratio.
 * cx, cy are fractions of image width/height.
 */
function cropArtwork(artworkImg, cx, cy) {
  const srcW = artworkImg.naturalWidth;
  const srcH = artworkImg.naturalHeight;

  // Crop dimensions in source pixels
  const cropW = Math.round(srcW * CROP_WIDTH_FRACTION);
  const cropH = Math.round(cropW * (3 / 4));

  // Center of crop in source pixels
  const centerX = Math.round(srcW * cx);
  const centerY = Math.round(srcH * cy);

  // Top-left of crop, clamped
  const sx = Math.max(0, Math.min(centerX - Math.round(cropW / 2), srcW - cropW));
  const sy = Math.max(0, Math.min(centerY - Math.round(cropH / 2), srcH - cropH));

  // Output canvas at a reasonable size for email
  const outW = 600;
  const outH = Math.round(outW * (3 / 4));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(artworkImg, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvasToBlob(canvas);
}

async function uploadStoryCrop({ blob, artworkId, sessionId, planet }) {
  const captureId = artworkId || sessionId || crypto.randomUUID();
  const filePath = `email-story-crops/${captureId}/${crypto.randomUUID()}-${planet.toLowerCase()}.jpg`;
  const { data, error } = await supabase.storage
    .from('artworks')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(data.path);
  return urlData?.publicUrl || '';
}

/**
 * Main export: generates Sun, Moon, Rising crops and uploads them.
 * @param {{ artworkSrc: string, sunSign: string, moonSign: string, risingSign: string, artworkId?: string, sessionId?: string }} params
 * @returns {Promise<{ sunCropUrl: string, moonCropUrl: string, risingCropUrl: string }>}
 */
export async function createEmailStoryGallery({ artworkSrc, sunSign, moonSign, risingSign, artworkId, sessionId }) {
  const emptyResult = { sunCropUrl: '', moonCropUrl: '', risingCropUrl: '' };
  if (!artworkSrc) {
    console.warn('[emailStoryGallery] No artworkSrc provided, skipping story crop generation');
    return emptyResult;
  }

  console.log('[emailStoryGallery] Starting story crop generation', { artworkSrc: artworkSrc?.substring(0, 80), sunSign, moonSign, risingSign });

  let artworkImg;
  try {
    artworkImg = await loadArtworkViaProxy(artworkSrc);
  } catch (loadErr) {
    console.error('[emailStoryGallery] Failed to load artwork image:', loadErr?.message || loadErr);
    return emptyResult;
  }

  const planets = [
    { planet: 'Sun',    sign: sunSign,    key: 'sunCropUrl' },
    { planet: 'Moon',   sign: moonSign,   key: 'moonCropUrl' },
    { planet: 'Rising', sign: risingSign, key: 'risingCropUrl' },
  ];

  try {
    const results = await Promise.allSettled(
      planets.map(async ({ planet, sign, key }) => {
        const { cx, cy } = getStoryCropCenter(planet, sign);
        const blob = await cropArtwork(artworkImg, cx, cy);
        console.log(`[emailStoryGallery] Cropped ${planet} (${sign}) at (${cx}, ${cy}), ${blob.size} bytes`);
        const publicUrl = await uploadStoryCrop({ blob, artworkId, sessionId, planet });
        console.log(`[emailStoryGallery] Uploaded ${planet} crop: ${publicUrl?.substring(0, 80)}`);
        return [key, publicUrl];
      }),
    );

    const gallery = results.reduce(
      (acc, result) => {
        if (result.status === 'fulfilled') {
          const [key, url] = result.value;
          acc[key] = url;
        } else {
          console.error('[emailStoryGallery] Story crop variant failed:', result.reason?.message || result.reason);
        }
        return acc;
      },
      { sunCropUrl: '', moonCropUrl: '', risingCropUrl: '' },
    );

    console.log('[emailStoryGallery] Final gallery result:', {
      sun: gallery.sunCropUrl ? '✓' : '✗',
      moon: gallery.moonCropUrl ? '✓' : '✗',
      rising: gallery.risingCropUrl ? '✓' : '✗',
    });
    return gallery;
  } finally {
    revokeImageObjectUrl(artworkImg);
  }
}
