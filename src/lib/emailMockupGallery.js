import { supabase } from "@/integrations/supabase/client";
import { findGreenBounds, isGreenPixel, sampleNearbyColor } from "@/lib/mockup/chromaKey";

import mockup12x18_6 from "@/assets/mockups/12x18/mockup-6.webp";
import mockup16x24_6 from "@/assets/mockups/16x24/mockup-6.webp";
import mockup20x30_6 from "@/assets/mockups/20x30/mockup-6.webp";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;
const EMAIL_MOCKUP_SPECS = [
  { key: "small", src: mockup12x18_6 },
  { key: "medium", src: mockup16x24_6 },
  { key: "large", src: mockup20x30_6 },
];
const MAX_CANVAS_DIM = 900;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadArtworkViaProxy(src) {
  const needsProxy = src.startsWith("http") && !src.startsWith(window.location.origin);
  if (!needsProxy) return loadImage(src);

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Canvas export failed"));
      },
      "image/jpeg",
      0.88,
    );
  });
}

async function compositeMockup(mockupSrc, artworkImg) {
  const mockupImg = await loadImage(mockupSrc);
  const fullW = mockupImg.naturalWidth;
  const fullH = mockupImg.naturalHeight;
  const downscale = Math.min(1, MAX_CANVAS_DIM / Math.max(fullW, fullH));
  const w = Math.max(1, Math.round(fullW * downscale));
  const h = Math.max(1, Math.round(fullH * downscale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(mockupImg, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const bounds = findGreenBounds(imageData.data, w, h);

  if (bounds) {
    const { minX, minY, maxX, maxY } = bounds;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const artW = artworkImg.naturalWidth;
    const artH = artworkImg.naturalHeight;
    const pad = 3;
    const scale = Math.max((bw + pad * 2) / artW, (bh + pad * 2) / artH);
    const dw = artW * scale;
    const dh = artH * scale;
    const dx = minX - pad + (bw + pad * 2 - dw) / 2;
    const dy = minY - pad + (bh + pad * 2 - dh) / 2;
    ctx.drawImage(artworkImg, dx, dy, dw, dh);

    const compData = ctx.getImageData(minX, minY, bw, bh);
    for (let i = 0; i < compData.data.length; i += 4) {
      if (isGreenPixel(compData.data[i], compData.data[i + 1], compData.data[i + 2])) {
        const px = (i / 4) % bw;
        const py = Math.floor((i / 4) / bw);
        const nearbyColor = sampleNearbyColor(compData.data, bw, bh, px, py);
        compData.data[i] = nearbyColor[0];
        compData.data[i + 1] = nearbyColor[1];
        compData.data[i + 2] = nearbyColor[2];
      }
    }
    ctx.putImageData(compData, minX, minY);
  }

  return canvasToBlob(canvas);
}

async function uploadCompositeMockup({ blob, artworkId, sessionId, variantKey }) {
  const captureId = artworkId || sessionId || crypto.randomUUID();
  const filePath = `email-mockups/${captureId}/${crypto.randomUUID()}-${variantKey}.jpg`;

  const { data, error } = await supabase.storage
    .from("artworks")
    .upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(data.path);
  return urlData?.publicUrl || "";
}

export async function createEmailMockupGallery({ artworkSrc, artworkId, sessionId }) {
  const emptyResult = { small: "", medium: "", large: "" };

  if (!artworkSrc) {
    console.warn('[emailMockupGallery] No artworkSrc provided, skipping mockup generation');
    return emptyResult;
  }

  console.log('[emailMockupGallery] Starting mockup generation', { artworkSrc: artworkSrc?.substring(0, 80), artworkId, sessionId });

  let artworkImg;
  try {
    artworkImg = await loadArtworkViaProxy(artworkSrc);
  } catch (loadErr) {
    console.error('[emailMockupGallery] Failed to load artwork image:', loadErr?.message || loadErr);
    return emptyResult;
  }

  try {
    const results = await Promise.allSettled(
      EMAIL_MOCKUP_SPECS.map(async ({ key, src }) => {
        const blob = await compositeMockup(src, artworkImg);
        console.log(`[emailMockupGallery] Composited ${key} mockup (${blob.size} bytes)`);
        const publicUrl = await uploadCompositeMockup({
          blob,
          artworkId,
          sessionId,
          variantKey: key,
        });
        console.log(`[emailMockupGallery] Uploaded ${key} mockup: ${publicUrl?.substring(0, 80)}`);
        return [key, publicUrl];
      }),
    );

    const gallery = results.reduce(
      (acc, result) => {
        if (result.status === "fulfilled") {
          const [key, url] = result.value;
          acc[key] = url;
        } else {
          console.error(`[emailMockupGallery] Mockup variant failed:`, result.reason?.message || result.reason);
        }
        return acc;
      },
      { small: "", medium: "", large: "" },
    );

    console.log('[emailMockupGallery] Final gallery result:', {
      small: gallery.small ? '✓' : '✗',
      medium: gallery.medium ? '✓' : '✗',
      large: gallery.large ? '✓' : '✗',
    });

    return gallery;
  } finally {
    revokeImageObjectUrl(artworkImg);
  }
}
