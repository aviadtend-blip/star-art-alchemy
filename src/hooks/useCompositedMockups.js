import { useEffect, useState, useRef } from 'react';
import { findGreenBounds, isGreenPixel, findGreenQuadCorners, bilinearInverse } from '../lib/mockup/chromaKey';

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

      // Find quad corners for perspective mapping
      const corners = findGreenQuadCorners(greenMask, bw, bh);

      if (corners) {
        // Use the quad dimensions for cover calculation (not bounding box)
        const quadTopW = Math.sqrt((corners.tr.x - corners.tl.x) ** 2 + (corners.tr.y - corners.tl.y) ** 2);
        const quadBotW = Math.sqrt((corners.br.x - corners.bl.x) ** 2 + (corners.br.y - corners.bl.y) ** 2);
        const quadLeftH = Math.sqrt((corners.bl.x - corners.tl.x) ** 2 + (corners.bl.y - corners.tl.y) ** 2);
        const quadRightH = Math.sqrt((corners.br.x - corners.tr.x) ** 2 + (corners.br.y - corners.tr.y) ** 2);
        const quadW = (quadTopW + quadBotW) / 2;
        const quadH = (quadLeftH + quadRightH) / 2;

        // Cover: scale artwork to fill the quad's aspect ratio
        const artAspect = artW / artH;
        const quadAspect = quadW / quadH;
        let cropU = 1, cropV = 1;
        if (artAspect > quadAspect) {
          // Artwork is wider — crop sides
          cropU = quadAspect / artAspect;
        } else {
          // Artwork is taller — crop top/bottom
          cropV = artAspect / quadAspect;
        }
        const offU = (1 - cropU) / 2;
        const offV = (1 - cropV) / 2;

        for (let i = 0; i < greenMask.length; i++) {
          if (!greenMask[i]) continue;
          const px = i % bw;
          const py = (i - px) / bw;

          const { u, v } = bilinearInverse(px, py, corners.tl, corners.tr, corners.bl, corners.br);
          const artU = offU + u * cropU;
          const artV = offV + v * cropV;

          const ax = Math.min(sampW - 1, Math.max(0, Math.round(artU * (sampW - 1))));
          const ay = Math.min(sampH - 1, Math.max(0, Math.round(artV * (sampH - 1))));
          const srcO = (ay * sampW + ax) * 4;
          const dstO = i * 4;
          originalData.data[dstO]     = artData.data[srcO];
          originalData.data[dstO + 1] = artData.data[srcO + 1];
          originalData.data[dstO + 2] = artData.data[srcO + 2];
          originalData.data[dstO + 3] = 255;
        }
      } else {
        // Flat fallback — draw artwork scaled to cover bounding box
        const scale = Math.max(bw / artW, bh / artH);
        const dw = artW * scale;
        const dh = artH * scale;
        const flatCanvas = document.createElement('canvas');
        flatCanvas.width = bw;
        flatCanvas.height = bh;
        const flatCtx = flatCanvas.getContext('2d');
        flatCtx.drawImage(artworkImg, (bw - dw) / 2, (bh - dh) / 2, dw, dh);
        const flatData = flatCtx.getImageData(0, 0, bw, bh);

        for (let i = 0; i < greenMask.length; i++) {
          if (!greenMask[i]) continue;
          const o = i * 4;
          originalData.data[o]     = flatData.data[o];
          originalData.data[o + 1] = flatData.data[o + 1];
          originalData.data[o + 2] = flatData.data[o + 2];
          originalData.data[o + 3] = 255;
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
