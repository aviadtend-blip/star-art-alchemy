import { useEffect, useState, useRef } from 'react';
import { findGreenBounds, isGreenPixel } from '@/lib/mockup/chromaKey';
import phoneCaseMockup from '@/assets/mockups/phone-case-mockup.webp';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

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
 * Composites the user's artwork onto the phone case mockup (green-screen replacement).
 */
export default function PhoneCaseMockup({ artworkSrc, className = '' }) {
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
          loadImage(phoneCaseMockup),
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

          // Build a mask of which pixels are green (within bounds region)
          const maskData = ctx.getImageData(minX, minY, bw, bh);
          const greenMask = new Uint8Array(bw * bh);
          for (let i = 0; i < greenMask.length; i++) {
            const o = i * 4;
            if (isGreenPixel(maskData.data[o], maskData.data[o + 1], maskData.data[o + 2])) {
              greenMask[i] = 1;
            }
          }

          // Precompute per-row green extents for scanline mapping
          let firstGreenRow = -1, lastGreenRow = -1;
          const rowExtents = new Array(bh);
          for (let y = 0; y < bh; y++) {
            let left = -1, right = -1;
            const rowStart = y * bw;
            for (let x = 0; x < bw; x++) {
              if (greenMask[rowStart + x]) {
                if (left === -1) left = x;
                right = x;
              }
            }
            rowExtents[y] = { left, right };
            if (left !== -1) {
              if (firstGreenRow === -1) firstGreenRow = y;
              lastGreenRow = y;
            }
          }

          const greenHeight = lastGreenRow - firstGreenRow;
          if (greenHeight > 0) {
            const artW = artworkImg.naturalWidth;
            const artH = artworkImg.naturalHeight;
            const artMaxDim = 800;
            const artDownscale = Math.min(1, artMaxDim / Math.max(artW, artH));
            const sampW = Math.max(1, Math.round(artW * artDownscale));
            const sampH = Math.max(1, Math.round(artH * artDownscale));

            const artCanvas = document.createElement('canvas');
            artCanvas.width = sampW;
            artCanvas.height = sampH;
            const artCtx = artCanvas.getContext('2d');
            artCtx.drawImage(artworkImg, 0, 0, sampW, sampH);
            const artData = artCtx.getImageData(0, 0, sampW, sampH);

            const coverScale = Math.max(bw / artW, bh / artH);
            const effectiveW = artW * coverScale;
            const effectiveH = artH * coverScale;
            const coverOffU = (effectiveW - bw) / (2 * effectiveW);
            const coverOffV = (effectiveH - bh) / (2 * effectiveH);
            const coverScaleU = bw / effectiveW;
            const coverScaleV = bh / effectiveH;

            for (let i = 0; i < greenMask.length; i++) {
              if (!greenMask[i]) continue;
              const px = i % bw;
              const py = (i - px) / bw;

              const { left, right } = rowExtents[py];
              const rowWidth = right - left;
              const u = rowWidth > 0 ? (px - left) / rowWidth : 0.5;
              const v = (py - firstGreenRow) / greenHeight;

              const artU = coverOffU + u * coverScaleU;
              const artV = coverOffV + v * coverScaleV;

              const ax = Math.min(sampW - 1, Math.max(0, Math.round(artU * sampW)));
              const ay = Math.min(sampH - 1, Math.max(0, Math.round(artV * sampH)));
              const srcO = (ay * sampW + ax) * 4;
              const dstO = i * 4;
              maskData.data[dstO]     = artData.data[srcO];
              maskData.data[dstO + 1] = artData.data[srcO + 1];
              maskData.data[dstO + 2] = artData.data[srcO + 2];
              maskData.data[dstO + 3] = 255;
            }
          }
        }

        if (controller.signal.aborted) return;
        setComposited(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        console.error('PhoneCaseMockup composite failed:', err);
      }
    })();

    return () => controller.abort();
  }, [artworkSrc]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <img
        src={composited || phoneCaseMockup}
        alt="Your artwork on a phone case"
        loading="eager"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
