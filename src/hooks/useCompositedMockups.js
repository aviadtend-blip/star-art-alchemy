import { useEffect, useState, useRef } from 'react';
import { findGreenBounds, isGreenPixel, sampleNearbyColor } from '../lib/mockup/chromaKey';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;
const MAX_CANVAS_DIM = 1600;
const PARALLEL_BATCH = 3;

// ── Shared global caches ──────────────────────────────────────────────
const compositeCache = new Map();   // cacheKey → dataUrl
let _artworkCache = { src: null, img: null, promise: null };

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

function getArtworkImage(src) {
  if (_artworkCache.src === src && _artworkCache.promise) return _artworkCache.promise;
  _artworkCache.src = src;
  _artworkCache.promise = loadArtworkViaProxy(src).then(img => {
    _artworkCache.img = img;
    return img;
  });
  return _artworkCache.promise;
}

function compositeSingleMockup(mockupSrc, artworkImg) {
  const cacheKey = mockupSrc;
  if (compositeCache.has(cacheKey)) return Promise.resolve(compositeCache.get(cacheKey));

  return loadImage(mockupSrc).then(mockupImg => {
    const fullW = mockupImg.naturalWidth;
    const fullH = mockupImg.naturalHeight;
    const downscale = Math.min(1, MAX_CANVAS_DIM / Math.max(fullW, fullH));
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
          const nc = sampleNearbyColor(compData.data, bw, bh, px, py);
          compData.data[i] = nc[0];
          compData.data[i + 1] = nc[1];
          compData.data[i + 2] = nc[2];
        }
      }
      ctx.putImageData(compData, minX, minY);

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
    compositeCache.set(cacheKey, dataUrl);
    return dataUrl;
  }).catch(() => mockupSrc);
}

async function compositeAll(mockupSrcs, artworkImg, signal) {
  const results = [];
  for (let i = 0; i < mockupSrcs.length; i += PARALLEL_BATCH) {
    if (signal?.aborted) return results;
    const batch = mockupSrcs.slice(i, i + PARALLEL_BATCH);
    const batchResults = await Promise.all(
      batch.map(src => compositeSingleMockup(src, artworkImg))
    );
    results.push(...batchResults);
    await new Promise(r => setTimeout(r, 0));
  }
  return results;
}

/**
 * Composites mockups for the selected size.
 * Returns instantly from global cache if already composited (e.g. by background preload).
 */
export default function useCompositedMockups(mockupSrcs, artworkSrc) {
  const [composited, setComposited] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mockupSrcs?.length) { setComposited([]); setLoading(false); return; }
    if (!artworkSrc) { setComposited(mockupSrcs); setLoading(false); return; }

    // Check if all are cached already (instant switch)
    const allCached = mockupSrcs.every(src => compositeCache.has(src));
    if (allCached) {
      setComposited(mockupSrcs.map(src => compositeCache.get(src)));
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    (async () => {
      let artworkImg;
      try {
        artworkImg = await getArtworkImage(artworkSrc);
      } catch {
        if (!controller.signal.aborted) { setComposited(mockupSrcs); setLoading(false); }
        return;
      }
      if (controller.signal.aborted) return;

      const results = await compositeAll(mockupSrcs, artworkImg, controller.signal);
      if (!controller.signal.aborted) {
        setComposited(results.length ? results : mockupSrcs);
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [mockupSrcs, artworkSrc]);

  return { composited, loading };
}

/**
 * Background-preloads composites for additional size sets.
 * Call with the sizes NOT currently selected so they're ready when the user switches.
 * Uses the same global cache, so useCompositedMockups picks them up instantly.
 */
export function useBackgroundPreload(otherMockupSets, artworkSrc) {
  useEffect(() => {
    if (!artworkSrc || !otherMockupSets?.length) return;
    const controller = new AbortController();

    (async () => {
      let artworkImg;
      try {
        artworkImg = await getArtworkImage(artworkSrc);
      } catch { return; }

      for (const mockupSrcs of otherMockupSets) {
        if (controller.signal.aborted) return;
        // Skip sets that are fully cached
        if (mockupSrcs.every(src => compositeCache.has(src))) continue;
        await compositeAll(mockupSrcs, artworkImg, controller.signal);
      }
    })();

    return () => controller.abort();
  }, [otherMockupSets, artworkSrc]);
}
