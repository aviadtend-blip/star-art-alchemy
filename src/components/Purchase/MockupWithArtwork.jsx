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

          // Draw artwork with "contain" fitting (show full artwork, center in green area)
          const artW = artworkImg.naturalWidth;
          const artH = artworkImg.naturalHeight;
          const scale = Math.min(bw / artW, bh / artH);
          const dw = artW * scale;
          const dh = artH * scale;
          const dx = minX + (bw - dw) / 2;
          const dy = minY + (bh - dh) / 2;
          ctx.drawImage(artworkImg, dx, dy, dw, dh);

          // Re-read the mockup to get edge pixels that should stay on top
          // (frame edges, shadows). We do this by redrawing only non-green
          // pixels from the original mockup on top of the artwork.
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
              // Restore non-green mockup pixel (frame edges, shadows)
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

/** Check if a pixel is "green screen" green */
function isGreenPixel(r, g, b) {
  // Green-screen: high green, low red, low blue (relaxed for varied mockup greens)
  return g > 80 && g > r * 1.2 && g > b * 1.2;
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
