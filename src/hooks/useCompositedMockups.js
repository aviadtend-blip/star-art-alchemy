import { useEffect, useState } from 'react';
import { findGreenBounds, isGreenPixel } from '../lib/mockup/chromaKey';
import { applyArtworkToMask, createArtworkSampler } from '../lib/mockup/applyArtworkToMask';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;
const MAX_CANVAS_DIM = 800;
const PARALLEL_BATCH = 3;
const COMPOSITE_ALGORITHM_VERSION = '2026-03-19-phone-case-oriented';

// ── Shared global caches ──────────────────────────────────────────────
const compositeCache = new Map();   // cacheKey → dataUrl
const greenBoundsCache = new Map(); // mockupSrc → bounds|null
let _artworkCache = { src: null, img: null, promise: null };
let _lastArtworkForComposites = null; // tracks which artwork the composites were built for

function getCompositeCacheKey(mockupSrc, mode = 'default') {
  return `${COMPOSITE_ALGORITHM_VERSION}:${mode}:${mockupSrc}`;
}

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

function compositeSingleMockup(mockupSrc, artworkSampler, mode = 'default') {
  const cacheKey = getCompositeCacheKey(mockupSrc, mode);
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
    let bounds;
    if (greenBoundsCache.has(mockupSrc)) {
      bounds = greenBoundsCache.get(mockupSrc);
    } else {
      bounds = findGreenBounds(imageData.data, w, h);
      greenBoundsCache.set(mockupSrc, bounds ?? null);
    }

    if (bounds) {
      const { minX, minY, maxX, maxY } = bounds;
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const maskData = ctx.getImageData(minX, minY, bw, bh);
      const greenMask = new Uint8Array(bw * bh);

      for (let i = 0; i < greenMask.length; i++) {
        const offset = i * 4;
        if (isGreenPixel(maskData.data[offset], maskData.data[offset + 1], maskData.data[offset + 2])) {
          greenMask[i] = 1;
        }
      }

      applyArtworkToMask({
        maskData,
        greenMask,
        sampler: artworkSampler,
        bw,
        bh,
        mode,
      });

      ctx.putImageData(maskData, minX, minY);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    compositeCache.set(cacheKey, dataUrl);
    return dataUrl;
  }).catch(() => mockupSrc);
}

async function compositeAll(mockupSrcs, artworkSampler, signal, mode = 'default') {
  const results = [];
  for (let i = 0; i < mockupSrcs.length; i += PARALLEL_BATCH) {
    if (signal?.aborted) return results;
    const batch = mockupSrcs.slice(i, i + PARALLEL_BATCH);
    const batchResults = await Promise.all(
      batch.map(src => compositeSingleMockup(src, artworkSampler, mode))
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
export default function useCompositedMockups(mockupSrcs, artworkSrc, options = {}) {
  const [composited, setComposited] = useState([]);
  const [loading, setLoading] = useState(true);
  const mode = options.mode ?? 'default';

  useEffect(() => {
    if (!mockupSrcs?.length) { setComposited([]); setLoading(false); return; }
    if (!artworkSrc) { setComposited(mockupSrcs); setLoading(false); return; }

    // If artwork changed, invalidate all composites
    if (_lastArtworkForComposites && _lastArtworkForComposites !== artworkSrc) {
      compositeCache.clear();
      _artworkCache = { src: null, img: null, promise: null };
    }
    _lastArtworkForComposites = artworkSrc;

    // Check if all are cached already (instant switch)
    const allCached = mockupSrcs.every(src => compositeCache.has(getCompositeCacheKey(src, mode)));
    if (allCached) {
      setComposited(mockupSrcs.map(src => compositeCache.get(getCompositeCacheKey(src, mode))));
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

      const artworkSampler = createArtworkSampler(artworkImg);
      const results = await compositeAll(mockupSrcs, artworkSampler, controller.signal, mode);
      if (!controller.signal.aborted) {
        setComposited(results.length ? results : mockupSrcs);
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [mockupSrcs, artworkSrc, mode]);

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

      const artworkSampler = createArtworkSampler(artworkImg);

      for (const mockupSrcs of otherMockupSets) {
        if (controller.signal.aborted) return;
        if (mockupSrcs.every(src => compositeCache.has(getCompositeCacheKey(src)))) continue;
        await compositeAll(mockupSrcs, artworkSampler, controller.signal);
      }
    })();

    return () => controller.abort();
  }, [otherMockupSets, artworkSrc]);
}

/**
 * Clears all cached composites and the artwork image cache.
 * Call this when the artwork changes (e.g. reimagine).
 */
export function clearCompositeCache() {
  compositeCache.clear();
  _artworkCache = { src: null, img: null, promise: null };
  _lastArtworkForComposites = null;
}

/**
 * Preloads composites for all mockup sizes in the background.
 * Call from the preview page so mockups are ready when the user proceeds.
 * Returns a cleanup/abort function.
 */
export function preloadAllMockups(allMockupSets, artworkSrc) {
  if (!artworkSrc || !allMockupSets?.length) return () => {};

  // If artwork changed, clear old composites first
  if (_lastArtworkForComposites && _lastArtworkForComposites !== artworkSrc) {
    compositeCache.clear();
    _artworkCache = { src: null, img: null, promise: null };
  }
  _lastArtworkForComposites = artworkSrc;

  const controller = new AbortController();

  (async () => {
    let artworkImg;
    try {
      artworkImg = await getArtworkImage(artworkSrc);
    } catch { return; }

    const artworkSampler = createArtworkSampler(artworkImg);

    for (const mockupSrcs of allMockupSets) {
      if (controller.signal.aborted) return;
      if (mockupSrcs.every(src => compositeCache.has(getCompositeCacheKey(src)))) continue;
      await compositeAll(mockupSrcs, artworkSampler, controller.signal);
    }
  })();

  return () => controller.abort();
}
