import { useEffect, useRef, useState } from 'react';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

/**
 * Composites the user's generated artwork onto a room mockup image
 * by detecting and replacing the green-screen area via canvas chroma key.
 *
 * Props:
 *  - mockupSrc: URL of the mockup image (with green placeholder)
 *  - artworkSrc: URL of the generated artwork image
 *  - alt: alt text
 *  - className: optional className for the wrapper
 *  - style: optional inline style for the wrapper
 */
export default function MockupWithArtwork({ mockupSrc, artworkSrc, alt = '', className = '', style = {} }) {
  const canvasRef = useRef(null);
  const [compositeSrc, setCompositeSrc] = useState(null);

  useEffect(() => {
    if (!mockupSrc) return;
    if (!artworkSrc) {
      // No artwork to composite — just show the raw mockup
      setCompositeSrc(mockupSrc);
      return;
    }

    let cancelled = false;

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const loadArtworkViaProxy = async (src) => {
      // Proxy external URLs to avoid CORS issues with canvas getImageData
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
      // Store objectUrl for cleanup
      img._objectUrl = objectUrl;
      return img;
    };

    (async () => {
      try {
        const [mockupImg, artworkImg] = await Promise.all([
          loadImage(mockupSrc),
          loadArtworkViaProxy(artworkSrc),
        ]);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = mockupImg.naturalWidth;
        const h = mockupImg.naturalHeight;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(mockupImg, 0, 0, w, h);

        // Detect green bounding box
        const imageData = ctx.getImageData(0, 0, w, h);
        const { data } = imageData;
        const bounds = findGreenBounds(data, w, h);

        if (bounds) {
          const { minX, minY, maxX, maxY } = bounds;
          const bw = maxX - minX + 1;
          const bh = maxY - minY + 1;
          // Draw artwork with "cover" fitting + 3px padding
          const artW = artworkImg.naturalWidth;
          const artH = artworkImg.naturalHeight;
          const pad = 3;
          const scale = Math.max((bw + pad * 2) / artW, (bh + pad * 2) / artH);
          const dw = artW * scale;
          const dh = artH * scale;
          const dx = minX - pad + (bw + pad * 2 - dw) / 2;
          const dy = minY - pad + (bh + pad * 2 - dh) / 2;
          ctx.drawImage(artworkImg, dx, dy, dw, dh);

          // Cleanup pass: replace any remaining green pixels
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

          // Restore non-green mockup pixels on top (frame edges, shadows)
          const mockupCanvas = document.createElement('canvas');
          mockupCanvas.width = w;
          mockupCanvas.height = h;
          const mCtx = mockupCanvas.getContext('2d');
          mCtx.drawImage(mockupImg, 0, 0, w, h);
          const mData = mCtx.getImageData(minX, minY, bw, bh);
          const compositeData = ctx.getImageData(minX, minY, bw, bh);

          for (let i = 0; i < mData.data.length; i += 4) {
            const r = mData.data[i];
            const g = mData.data[i + 1];
            const b = mData.data[i + 2];
            if (!isGreenPixel(r, g, b)) {
              compositeData.data[i] = r;
              compositeData.data[i + 1] = g;
              compositeData.data[i + 2] = b;
              compositeData.data[i + 3] = mData.data[i + 3];
            }
          }
          ctx.putImageData(compositeData, minX, minY);
        }

        setCompositeSrc(canvas.toDataURL('image/jpeg', 0.92));
        // Clean up blob URL if we created one
        if (artworkImg._objectUrl) URL.revokeObjectURL(artworkImg._objectUrl);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('MockupWithArtwork composite failed:', err);
        // Fallback: show plain artwork (not the green-screen mockup)
        if (!cancelled) setCompositeSrc(artworkSrc || mockupSrc);
      }
    })();

    return () => { cancelled = true; };
  }, [mockupSrc, artworkSrc]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {compositeSrc && (
        <img
          src={compositeSrc}
          alt={alt}
          className={className}
          style={style}
          loading="lazy"
        />
      )}
    </>
  );
}

function isGreenPixel(r, g, b) {
  return g > 80 && g > r * 1.2 && g > b * 1.2;
}

function sampleNearbyColor(data, w, h, px, py) {
  const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0],[0,-2],[0,2]];
  for (const [ox, oy] of offsets) {
    const nx = px + ox, ny = py + oy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const ni = (ny * w + nx) * 4;
      if (!isGreenPixel(data[ni], data[ni+1], data[ni+2])) {
        return [data[ni], data[ni+1], data[ni+2]];
      }
    }
  }
  return [200, 200, 200];
}

/** Find the bounding box of the green-screen area */
function findGreenBounds(data, w, h) {
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isGreenPixel(data[i], data[i + 1], data[i + 2])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;

  // Sanity check: green area should be at least 5% of the image
  const area = (maxX - minX) * (maxY - minY);
  if (area < w * h * 0.02) return null;

  return { minX, minY, maxX, maxY };
}
