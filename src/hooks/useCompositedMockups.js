import { useEffect, useState, useRef } from 'react';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;

/**
 * Pre-composites all mockup images with the artwork, returning an array of data URLs.
 * Falls back to artworkSrc (or raw mockup) if compositing fails for any image.
 */
export default function useCompositedMockups(mockupSrcs, artworkSrc) {
  const [composited, setComposited] = useState([]);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!mockupSrcs?.length) { setComposited([]); return; }
    if (!artworkSrc) { setComposited(mockupSrcs); return; }

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
    };

    (async () => {
      let artworkImg;
      try {
        artworkImg = await loadArtworkViaProxy(artworkSrc);
      } catch {
        if (!cancelled) setComposited(mockupSrcs);
        return;
      }
      if (cancelled) return;

      const results = await Promise.all(
        mockupSrcs.map(async (mockupSrc) => {
          // Use cache if available
          const cacheKey = `${mockupSrc}::${artworkSrc}`;
          if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);

          try {
            const mockupImg = await loadImage(mockupSrc);
            const canvas = document.createElement('canvas');
            const w = mockupImg.naturalWidth;
            const h = mockupImg.naturalHeight;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(mockupImg, 0, 0, w, h);

            const imageData = ctx.getImageData(0, 0, w, h);
            const bounds = findGreenBounds(imageData.data, w, h);

            if (bounds) {
              const { minX, minY, maxX, maxY } = bounds;
              const bw = maxX - minX + 1;
              const bh = maxY - minY + 1;
              // "Cover" fit with 3px padding to eliminate green edges
              const artW = artworkImg.naturalWidth;
              const artH = artworkImg.naturalHeight;
              const pad = 3;
              const scale = Math.max((bw + pad * 2) / artW, (bh + pad * 2) / artH);
              const dw = artW * scale;
              const dh = artH * scale;
              const dx = minX - pad + (bw + pad * 2 - dw) / 2;
              const dy = minY - pad + (bh + pad * 2 - dh) / 2;
              ctx.drawImage(artworkImg, dx, dy, dw, dh);

              // Cleanup pass: replace any remaining green pixels in the bounding box
              const compData = ctx.getImageData(minX, minY, bw, bh);
              for (let i = 0; i < compData.data.length; i += 4) {
                if (isGreenPixel(compData.data[i], compData.data[i + 1], compData.data[i + 2])) {
                  // Sample nearest non-green neighbor
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

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            cacheRef.current.set(cacheKey, dataUrl);
            return dataUrl;
          } catch {
            return artworkSrc || mockupSrc;
          }
        })
      );

      if (!cancelled) setComposited(results);
      if (artworkImg._objectUrl) URL.revokeObjectURL(artworkImg._objectUrl);
    })();

    return () => { cancelled = true; };
  }, [mockupSrcs, artworkSrc]);

  return composited;
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
  const area = (maxX - minX) * (maxY - minY);
  if (area < w * h * 0.02) return null;
  return { minX, minY, maxX, maxY };
}
