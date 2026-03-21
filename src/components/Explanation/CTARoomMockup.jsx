import { useEffect, useState, useRef } from 'react';
import { findGreenBounds, isGreenPixel, sampleNearbyColor } from '@/lib/mockup/chromaKey';
import ctaRoomMockup from '@/assets/mockups/cta-room-mockup.webp';

const _pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const PROXY_URL = _pid ? `https://${_pid}.supabase.co/functions/v1/proxy-image` : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

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
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ url: src }),
  });
  if (!res.ok) throw new Error(`Proxy failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const img = await loadImage(objectUrl);
  img._objectUrl = objectUrl;
  return img;
}

/**
 * Composites the user's artwork into the CTA room mockup (green-screen replacement).
 */
export default function CTARoomMockup({ artworkSrc, className = '' }) {
  const [composited, setComposited] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!artworkSrc) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const [mockupImg, artworkImg] = await Promise.all([
          loadImage(ctaRoomMockup),
          loadArtworkViaProxy(artworkSrc),
        ]);
        if (controller.signal.aborted) return;

        const MAX_DIM = 900;
        const fullW = mockupImg.naturalWidth;
        const fullH = mockupImg.naturalHeight;
        const downscale = Math.min(1, MAX_DIM / Math.max(fullW, fullH));
        const w = Math.max(1, Math.round(fullW * downscale));
        const h = Math.max(1, Math.round(fullH * downscale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(mockupImg, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const bounds = findGreenBounds(imageData.data, w, h);

        if (bounds) {
          const { minX, minY, maxX, maxY } = bounds;
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          const artW = artworkImg.naturalWidth;
          const artH = artworkImg.naturalHeight;
          // Center-crop artwork to 3:4 before compositing (print aspect ratio)
          const targetRatio = 3 / 4;
          const artRatio = artW / artH;
          let srcX = 0, srcY = 0, srcW = artW, srcH = artH;
          if (artRatio < targetRatio) {
            // Artwork is taller than 3:4 — crop top/bottom
            srcH = artW / targetRatio;
            srcY = (artH - srcH) / 2;
          } else if (artRatio > targetRatio) {
            // Artwork is wider than 3:4 — crop sides
            srcW = artH * targetRatio;
            srcX = (artW - srcW) / 2;
          }
          const pad = 3;
          const scale = Math.max((bw + pad * 2) / srcW, (bh + pad * 2) / srcH);
          const dw = srcW * scale;
          const dh = srcH * scale;
          const dx = minX - pad + (bw + pad * 2 - dw) / 2;
          const dy = minY - pad + (bh + pad * 2 - dh) / 2;
          ctx.drawImage(artworkImg, srcX, srcY, srcW, srcH, dx, dy, dw, dh);

          const compData = ctx.getImageData(minX, minY, bw, bh);
          for (let i = 0; i < compData.data.length; i += 4) {
            if (isGreenPixel(compData.data[i], compData.data[i + 1], compData.data[i + 2])) {
              const px = (i / 4) % bw;
              const py = Math.floor((i / 4) / bw);
              const nc = sampleNearbyColor(compData.data, bw, bh, px, py);
              compData.data[i] = nc[0];
              compData.data[i + 1] = nc[1];
              compData.data[i + 2] = nc[2];
            }
          }
          ctx.putImageData(compData, minX, minY);
        }

        if (controller.signal.aborted) return;
        setComposited(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        console.error('CTARoomMockup composite failed:', err);
      }
    })();

    return () => controller.abort();
  }, [artworkSrc]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Fallback: show the raw mockup while compositing */}
      <img
        src={composited || ctaRoomMockup}
        alt="Your artwork framed and hung in a gallery setting"
        loading="eager"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
