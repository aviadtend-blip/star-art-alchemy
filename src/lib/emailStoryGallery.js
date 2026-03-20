/**
 * emailStoryGallery.js
 * Generates 4:3 horizontal close-up crops for Email 2 (The Story Behind Your Art).
 *
 * Crop strategy (priority order):
 * 1. focusBox from AI analysis — tight bounding box around the described element
 * 2. Smart fallback — multiple candidate crops around the hotspot point, scored by coverage
 * 3. Omit — if no believable crop can be generated, leave the URL blank
 *
 * Per-section framing:
 * - Sun:    medium-tight (8% padding around focusBox)
 * - Moon:   medium-tight (8% padding)
 * - Rising: wider        (18% padding — Rising refers to broader composition/presence)
 */

import { supabase } from '@/integrations/supabase/client';
import { getStoryCropCenter } from '@/lib/emailStoryHotspots';

const _pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const PROXY_URL = _pid
  ? `https://${_pid}.supabase.co/functions/v1/proxy-image`
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

// Per-section padding fractions applied around the focusBox
const SECTION_PADDING = {
  Sun: 0.08,
  Moon: 0.08,
  Rising: 0.18,
};

// Fallback crop widths (fraction of image) when no focusBox is available
const FALLBACK_CROP_WIDTHS = {
  Sun: 0.38,
  Moon: 0.38,
  Rising: 0.55,
};

// Output aspect ratio: 4:3 horizontal
const ASPECT = 4 / 3;

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
  if (!response.ok) throw new Error(`Proxy failed: ${response.status}`);
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
  if (image?._objectUrl) URL.revokeObjectURL(image._objectUrl);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.88,
    );
  });
}

/**
 * Build a 4:3 crop rect from a focusBox + padding, clamped to image bounds.
 * All values are fractions of image width/height.
 * Returns { sx, sy, sw, sh } in fractions.
 */
function cropFromFocusBox(focusBox, padding, imgAspect) {
  const pad = padding;
  // Expand focusBox by padding
  let left = focusBox.left - pad;
  let right = focusBox.right + pad;
  let top = focusBox.top - pad;
  let bottom = focusBox.bottom + pad;

  // Current box dimensions in fraction-of-image units
  let boxW = right - left;
  let boxH = bottom - top;

  // Convert to pixel-equivalent aspect: boxW is fraction of imgW, boxH fraction of imgH
  // Actual pixel aspect of crop = (boxW * imgW) / (boxH * imgH)
  // We want that to equal ASPECT = 4/3
  // So boxW / boxH * (imgH / imgW) = ASPECT
  // boxW / boxH = ASPECT * imgW / imgH = ASPECT * imgAspect
  const targetRatio = ASPECT / imgAspect; // boxW / boxH ratio we need

  const currentRatio = boxW / boxH;
  if (currentRatio < targetRatio) {
    // Too tall — widen
    const newW = boxH * targetRatio;
    const cx = (left + right) / 2;
    left = cx - newW / 2;
    right = cx + newW / 2;
    boxW = newW;
  } else {
    // Too wide — tallen
    const newH = boxW / targetRatio;
    const cy = (top + bottom) / 2;
    top = cy - newH / 2;
    bottom = cy + newH / 2;
    boxH = newH;
  }

  // Clamp to [0, 1]
  if (left < 0) { right -= left; left = 0; }
  if (top < 0) { bottom -= top; top = 0; }
  if (right > 1) { left -= (right - 1); right = 1; }
  if (bottom > 1) { top -= (bottom - 1); bottom = 1; }
  left = Math.max(0, left);
  top = Math.max(0, top);

  return { sx: left, sy: top, sw: right - left, sh: bottom - top };
}

/**
 * Fallback: generate a crop centered on (cx, cy) with a given width fraction,
 * maintaining 4:3 aspect ratio.
 */
function cropFromPoint(cx, cy, widthFrac, imgAspect) {
  const sw = widthFrac;
  const sh = sw / (ASPECT / imgAspect);

  let sx = cx - sw / 2;
  let sy = cy - sh / 2;

  // Clamp
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sx + sw > 1) sx = 1 - sw;
  if (sy + sh > 1) sy = 1 - sh;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);

  return { sx, sy, sw: Math.min(sw, 1), sh: Math.min(sh, 1) };
}

/**
 * Render a crop rect to a canvas blob.
 * crop is { sx, sy, sw, sh } as fractions.
 */
function renderCrop(artworkImg, crop) {
  const srcW = artworkImg.naturalWidth;
  const srcH = artworkImg.naturalHeight;

  const px = Math.round(crop.sx * srcW);
  const py = Math.round(crop.sy * srcH);
  const pw = Math.round(crop.sw * srcW);
  const ph = Math.round(crop.sh * srcH);

  // Output at 600px wide for email
  const outW = 600;
  const outH = Math.round(outW * (3 / 4));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(artworkImg, px, py, pw, ph, 0, 0, outW, outH);
  return canvasToBlob(canvas);
}

async function uploadStoryCrop({ blob, artworkId, sessionId, planet }) {
  const captureId = artworkId || sessionId || crypto.randomUUID();
  const filePath = `email-story-crops/${captureId}/${crypto.randomUUID()}-${planet.toLowerCase()}.jpg`;
  const { data, error } = await supabase.storage
    .from('artworks')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('artworks').getPublicUrl(data.path);
  return urlData?.publicUrl || '';
}

/**
 * Main export: generates Sun, Moon, Rising crops and uploads them.
 * @param {{ artworkSrc: string, sunSign: string, moonSign: string, risingSign: string,
 *           artworkId?: string, sessionId?: string, artworkAnalysis?: object }} params
 */
export async function createEmailStoryGallery({
  artworkSrc, sunSign, moonSign, risingSign, artworkId, sessionId, artworkAnalysis,
}) {
  const emptyResult = { sunCropUrl: '', moonCropUrl: '', risingCropUrl: '' };
  if (!artworkSrc) {
    console.warn('[emailStoryGallery] No artworkSrc provided, skipping');
    return emptyResult;
  }

  console.log('[emailStoryGallery] Starting story crop generation', {
    artworkSrc: artworkSrc?.substring(0, 80), sunSign, moonSign, risingSign,
    hasFocusBoxes: !!(artworkAnalysis?.elements?.[0]?.focusBox),
  });

  let artworkImg;
  try {
    artworkImg = await loadArtworkViaProxy(artworkSrc);
  } catch (loadErr) {
    console.error('[emailStoryGallery] Failed to load artwork image:', loadErr?.message || loadErr);
    return emptyResult;
  }

  const imgAspect = artworkImg.naturalWidth / artworkImg.naturalHeight;

  // Extract focusBoxes from analysis elements (indices 0=sun, 1=moon, 2=rising)
  const elements = artworkAnalysis?.elements || [];

  const planets = [
    { planet: 'Sun',    sign: sunSign,    key: 'sunCropUrl',    elementIdx: 0 },
    { planet: 'Moon',   sign: moonSign,   key: 'moonCropUrl',   elementIdx: 1 },
    { planet: 'Rising', sign: risingSign, key: 'risingCropUrl', elementIdx: 2 },
  ];

  try {
    const results = await Promise.allSettled(
      planets.map(async ({ planet, sign, key, elementIdx }) => {
        const focusBox = elements[elementIdx]?.focusBox || null;
        const padding = SECTION_PADDING[planet];
        const hotspot = getStoryCropCenter(planet, sign);
        let crop;
        let cropSource;

        if (focusBox) {
          crop = cropFromFocusBox(focusBox, padding, imgAspect);
          cropSource = 'focusBox';
        } else {
          // Smart fallback: use point-centered crop with per-section width
          const widthFrac = FALLBACK_CROP_WIDTHS[planet];
          crop = cropFromPoint(hotspot.cx, hotspot.cy, widthFrac, imgAspect);
          cropSource = 'fallback-point';
        }

        // Validate crop is reasonable (not degenerate)
        if (crop.sw < 0.08 || crop.sh < 0.08) {
          console.warn(`[emailStoryGallery] ${planet} crop too small, skipping`, crop);
          return [key, ''];
        }

        const blob = await renderCrop(artworkImg, crop);

        console.log(`[emailStoryGallery] Cropped ${planet} (${sign})`, {
          source: cropSource,
          hotspot,
          focusBox,
          finalCrop: {
            sx: crop.sx.toFixed(3), sy: crop.sy.toFixed(3),
            sw: crop.sw.toFixed(3), sh: crop.sh.toFixed(3),
          },
          blobSize: blob.size,
        });

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
