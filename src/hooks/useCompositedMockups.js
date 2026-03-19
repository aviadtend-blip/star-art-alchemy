import { useEffect, useState, useRef } from 'react';
import { findGreenBounds, isGreenPixel } from '../lib/mockup/chromaKey';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`;
const MAX_CANVAS_DIM = 800;
const PARALLEL_BATCH = 3;

// ── Shared global caches ──────────────────────────────────────────────
const compositeCache = new Map();   // cacheKey → dataUrl
const greenBoundsCache = new Map(); // mockupSrc → bounds|null
let _artworkCache = { src: null, img: null, promise: null };
let _lastArtworkForComposites = null; // tracks which artwork the composites were built for

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

      // Save original mockup pixels for the green region
      const originalData = ctx.getImageData(minX, minY, bw, bh);

      // Build green mask from original mockup
      const greenMask = new Uint8Array(bw * bh);
      for (let i = 0; i < greenMask.length; i++) {
        const o = i * 4;
        if (isGreenPixel(originalData.data[o], originalData.data[o + 1], originalData.data[o + 2])) {
          greenMask[i] = 1;
        }
      }

      // Precompute per-row green extents for scanline mapping
      const rowExtents = new Array(bh);
      let firstGreenRow = -1, lastGreenRow = -1;
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
      if (greenHeight <= 0) { ctx.putImageData(originalData, minX, minY); }
      else {
        // Prepare artwork for sampling
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

        // Compute cover-mode scaling
        const coverScale = Math.max(bw / artW, bh / artH);
        const effectiveW = artW * coverScale;
        const effectiveH = artH * coverScale;
        const coverOffU = (effectiveW - bw) / (2 * effectiveW);
        const coverOffV = (effectiveH - bh) / (2 * effectiveH);
        const coverScaleU = bw / effectiveW;
        const coverScaleV = bh / effectiveH;

        // Scanline-based perspective mapping:
        // Each row maps artwork proportionally across its green span
        for (let i = 0; i < greenMask.length; i++) {
          if (!greenMask[i]) continue;
          const px = i % bw;
          const py = (i - px) / bw;

          const { left, right } = rowExtents[py];
          const rowWidth = right - left;

          // Horizontal: position within this row's green span
          const u = rowWidth > 0 ? (px - left) / rowWidth : 0.5;
          // Vertical: position within the full green height
          const v = (py - firstGreenRow) / greenHeight;

          const artU = coverOffU + u * coverScaleU;
          const artV = coverOffV + v * coverScaleV;

          const ax = Math.min(sampW - 1, Math.max(0, Math.round(artU * sampW)));
          const ay = Math.min(sampH - 1, Math.max(0, Math.round(artV * sampH)));
          const srcO = (ay * sampW + ax) * 4;
          const dstO = i * 4;
          originalData.data[dstO]     = artData.data[srcO];
          originalData.data[dstO + 1] = artData.data[srcO + 1];
          originalData.data[dstO + 2] = artData.data[srcO + 2];
          originalData.data[dstO + 3] = 255;
        }
      }
      ctx.putImageData(originalData, minX, minY);
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

    // If artwork changed, invalidate all composites
    if (_lastArtworkForComposites && _lastArtworkForComposites !== artworkSrc) {
      compositeCache.clear();
      _artworkCache = { src: null, img: null, promise: null };
    }
    _lastArtworkForComposites = artworkSrc;

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
        if (mockupSrcs.every(src => compositeCache.has(src))) continue;
        await compositeAll(mockupSrcs, artworkImg, controller.signal);
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

    for (const mockupSrcs of allMockupSets) {
      if (controller.signal.aborted) return;
      if (mockupSrcs.every(src => compositeCache.has(src))) continue;
      await compositeAll(mockupSrcs, artworkImg, controller.signal);
    }
  })();

  return () => controller.abort();
}
