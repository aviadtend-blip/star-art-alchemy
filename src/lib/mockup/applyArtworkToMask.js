import { bilinearInverse, findGreenQuadCorners, isGreenPixel, sampleNearbyColor } from './chromaKey';

const DEFAULT_ARTWORK_MAX_DIM = 800;
const MIN_AXIS_SPAN = 24;
const MIN_STRIP_SPAN = 6;
const MIN_STRIP_BINS = 96;
const MAX_STRIP_BINS = 512;
const STRIP_SMOOTHING_RADIUS = 2;
const DEFAULT_PHONE_CASE_FILL = [240, 238, 232];
const DEFAULT_PHONE_CASE_FIT = {
  coreWidthRatio: 0.58,
  cropInsetU: 0.015,
  cropInsetVStart: 0.015,
  cropInsetVEnd: 0.015,
  panelInsetU: 0.08,
  panelInsetVStart: 0.075,
  panelInsetVEnd: 0.085,
  panelCornerRadius: 0.16,
};
const PHONE_CASE_SOURCE_FITS = {
  'mockup-1': {
    coreWidthRatio: 0.62,
    cropInsetU: 0.01,
    cropInsetVStart: 0.015,
    cropInsetVEnd: 0.015,
    panelInsetU: 0.075,
    panelInsetVStart: 0.075,
    panelInsetVEnd: 0.08,
    panelCornerRadius: 0.15,
  },
  'mockup-2': {
    coreWidthRatio: 0.55,
    cropInsetU: 0.02,
    cropInsetVStart: 0.02,
    cropInsetVEnd: 0.02,
    panelInsetU: 0.12,
    panelInsetVStart: 0.11,
    panelInsetVEnd: 0.11,
    panelCornerRadius: 0.18,
  },
  'mockup-3': {
    coreWidthRatio: 0.6,
    cropInsetU: 0.015,
    cropInsetVStart: 0.015,
    cropInsetVEnd: 0.015,
    panelInsetU: 0.085,
    panelInsetVStart: 0.07,
    panelInsetVEnd: 0.08,
    panelCornerRadius: 0.16,
  },
  'phone-case-mockup': {
    coreWidthRatio: 0.6,
    cropInsetU: 0.015,
    cropInsetVStart: 0.015,
    cropInsetVEnd: 0.015,
    panelInsetU: 0.08,
    panelInsetVStart: 0.08,
    panelInsetVEnd: 0.08,
    panelCornerRadius: 0.16,
  },
};

export function createArtworkSampler(artworkImg, maxDim = DEFAULT_ARTWORK_MAX_DIM) {
  const artW = artworkImg.naturalWidth;
  const artH = artworkImg.naturalHeight;
  const artDownscale = Math.min(1, maxDim / Math.max(artW, artH));
  const sampW = Math.max(1, Math.round(artW * artDownscale));
  const sampH = Math.max(1, Math.round(artH * artDownscale));

  const artCanvas = document.createElement('canvas');
  artCanvas.width = sampW;
  artCanvas.height = sampH;
  const artCtx = artCanvas.getContext('2d', { willReadFrequently: true });
  artCtx.drawImage(artworkImg, 0, 0, sampW, sampH);

  return {
    artAspect: artW / artH,
    data: artCtx.getImageData(0, 0, sampW, sampH).data,
    width: sampW,
    height: sampH,
  };
}

export function applyArtworkToMask({ maskData, greenMask, sampler, bw, bh, mode = 'default', sourceKey = '' }) {
  if (mode === 'phone-case') {
    // Fill interior holes (e.g. camera cutout) so strip warp sees a continuous region
    const holeMask = fillInteriorHoles(greenMask, bw, bh);
    if (paintArtworkWithOrientedStrips(maskData.data, holeMask, sampler, bw, bh, sourceKey)) {
      // Restore hole pixels: revert any pixel that was in holeMask but NOT in original greenMask
      // (i.e. the filled hole pixels should show original mockup, not artwork)
      cleanupRemainingGreen(maskData.data, greenMask, bw);
      return;
    }
  }

  if (paintArtworkWithQuad(maskData.data, greenMask, sampler, bw, bh)) {
    return;
  }

  paintArtworkFlatCover(maskData.data, greenMask, sampler, bw, bh);
}

/**
 * Feather the edges of the composited mask region by blending with the original mockup.
 * Also restores any interior-hole pixels that were temporarily filled for strip computation.
 */
export function featherMaskEdges(maskData, originalData, greenMask, bw, bh, radius = 2) {
  const data = maskData.data;
  const distMap = new Float32Array(greenMask.length);
  distMap.fill(radius + 1);

  for (let i = 0; i < greenMask.length; i++) {
    if (!greenMask[i]) {
      distMap[i] = 0;
      // Restore non-green pixels to original (in case holes were filled during strip warp)
      const off = i * 4;
      data[off]     = originalData[off];
      data[off + 1] = originalData[off + 1];
      data[off + 2] = originalData[off + 2];
      data[off + 3] = originalData[off + 3];
      continue;
    }
    const x = i % bw;
    const y = (i - x) / bw;
    let onEdge = false;
    for (let dy = -1; dy <= 1 && !onEdge; dy++) {
      for (let dx = -1; dx <= 1 && !onEdge; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= bw || ny < 0 || ny >= bh) { onEdge = true; continue; }
        if (!greenMask[ny * bw + nx]) onEdge = true;
      }
    }
    if (onEdge) distMap[i] = 1;
  }

  for (let pass = 2; pass <= radius; pass++) {
    for (let i = 0; i < greenMask.length; i++) {
      if (distMap[i] !== radius + 1) continue;
      const x = i % bw;
      const y = (i - x) / bw;
      let nearEdge = false;
      for (let dy = -1; dy <= 1 && !nearEdge; dy++) {
        for (let dx = -1; dx <= 1 && !nearEdge; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < bw && ny >= 0 && ny < bh) {
            if (distMap[ny * bw + nx] === pass - 1) nearEdge = true;
          }
        }
      }
      if (nearEdge) distMap[i] = pass;
    }
  }

  for (let i = 0; i < greenMask.length; i++) {
    if (!greenMask[i]) continue;
    const dist = distMap[i];
    if (dist > radius) continue;
    const alpha = Math.min(1, Math.max(0, (dist - 0.5) / radius));
    const off = i * 4;
    data[off]     = Math.round(data[off]     * alpha + originalData[off]     * (1 - alpha));
    data[off + 1] = Math.round(data[off + 1] * alpha + originalData[off + 1] * (1 - alpha));
    data[off + 2] = Math.round(data[off + 2] * alpha + originalData[off + 2] * (1 - alpha));
  }

  // Post-pass: neutralize any greenish pixels OUTSIDE the mask but near boundaries
  // (catches anti-aliased semi-green fringe the mask didn't include)
  const FRINGE_RADIUS = 4;
  for (let i = 0; i < greenMask.length; i++) {
    if (greenMask[i]) continue; // skip mask pixels, already handled
    const off = i * 4;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    // Only process greenish pixels
    if (!(g > 80 && (g - r) > 10 && (g - b) > 10)) continue;
    // Check if near a mask boundary
    const x = i % bw;
    const y = (i - x) / bw;
    let nearMask = false;
    for (let dy = -FRINGE_RADIUS; dy <= FRINGE_RADIUS && !nearMask; dy++) {
      for (let dx = -FRINGE_RADIUS; dx <= FRINGE_RADIUS && !nearMask; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < bw && ny >= 0 && ny < bh && greenMask[ny * bw + nx]) {
          nearMask = true;
        }
      }
    }
    if (!nearMask) continue;
    // Desaturate the greenish pixel
    const lum = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
    data[off] = lum;
    data[off + 1] = lum;
    data[off + 2] = lum;
  }
}

/**
 * Fill interior holes in the green mask (e.g. camera cutout).
 * Returns a NEW mask with holes filled so strip warp sees a continuous region.
 * Uses flood fill from all border non-green pixels; anything not reached is interior.
 */
function fillInteriorHoles(greenMask, bw, bh) {
  const filled = new Uint8Array(greenMask);
  const visited = new Uint8Array(bw * bh);
  const queue = [];

  // Seed from all border pixels that are NOT green
  for (let x = 0; x < bw; x++) {
    if (!greenMask[x]) { queue.push(x); visited[x] = 1; }
    const bottom = (bh - 1) * bw + x;
    if (!greenMask[bottom]) { queue.push(bottom); visited[bottom] = 1; }
  }
  for (let y = 1; y < bh - 1; y++) {
    const left = y * bw;
    const right = y * bw + bw - 1;
    if (!greenMask[left]) { queue.push(left); visited[left] = 1; }
    if (!greenMask[right]) { queue.push(right); visited[right] = 1; }
  }

  // BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % bw;
    const y = (idx - x) / bw;
    const neighbors = [
      y > 0 ? idx - bw : -1,
      y < bh - 1 ? idx + bw : -1,
      x > 0 ? idx - 1 : -1,
      x < bw - 1 ? idx + 1 : -1,
    ];
    for (const ni of neighbors) {
      if (ni < 0 || visited[ni]) continue;
      if (greenMask[ni]) continue;
      visited[ni] = 1;
      queue.push(ni);
    }
  }

  // Any non-green pixel NOT visited from border is an interior hole → fill it
  for (let i = 0; i < filled.length; i++) {
    if (!filled[i] && !visited[i]) {
      filled[i] = 1;
    }
  }

  return filled;
}

/** Safety pass: overwrite any pixel that's still visually green after compositing */
function cleanupRemainingGreen(targetData, greenMask, bw) {
  for (let i = 0; i < greenMask.length; i++) {
    if (!greenMask[i]) continue;
    const off = i * 4;
    if (isGreenPixel(targetData[off], targetData[off + 1], targetData[off + 2])) {
      // Neutralize by desaturating: set to gray based on luminance
      const lum = Math.round(targetData[off] * 0.3 + targetData[off + 1] * 0.59 + targetData[off + 2] * 0.11);
      targetData[off] = lum;
      targetData[off + 1] = lum;
      targetData[off + 2] = lum;
    }
  }
}

function paintArtworkWithQuad(targetData, greenMask, sampler, bw, bh) {
  const corners = findGreenQuadCorners(greenMask, bw, bh);
  if (!corners) return false;

  const quadTopW = Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y);
  const quadBotW = Math.hypot(corners.br.x - corners.bl.x, corners.br.y - corners.bl.y);
  const quadLeftH = Math.hypot(corners.bl.x - corners.tl.x, corners.bl.y - corners.tl.y);
  const quadRightH = Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y);
  const quadW = (quadTopW + quadBotW) / 2;
  const quadH = (quadLeftH + quadRightH) / 2;
  const crop = getCoverCrop(sampler.artAspect, quadW / quadH);

  for (let i = 0; i < greenMask.length; i++) {
    if (!greenMask[i]) continue;

    const px = i % bw;
    const py = (i - px) / bw;
    const { u, v } = bilinearInverse(px, py, corners.tl, corners.tr, corners.bl, corners.br);

    paintSample(targetData, i * 4, sampler, crop.offU + u * crop.cropU, crop.offV + v * crop.cropV);
  }

  return true;
}

function paintArtworkFlatCover(targetData, greenMask, sampler, bw, bh) {
  const crop = getCoverCrop(sampler.artAspect, bw / bh);

  for (let i = 0; i < greenMask.length; i++) {
    if (!greenMask[i]) continue;

    const px = i % bw;
    const py = (i - px) / bw;
    const u = bw > 1 ? px / (bw - 1) : 0.5;
    const v = bh > 1 ? py / (bh - 1) : 0.5;

    paintSample(targetData, i * 4, sampler, crop.offU + u * crop.cropU, crop.offV + v * crop.cropV);
  }
}

function paintArtworkWithOrientedStrips(targetData, greenMask, sampler, bw, bh, sourceKey = '') {
  const frame = getPrincipalFrame(greenMask, bw, bh);
  if (!frame) return false;

  let minS = Infinity;
  let maxS = -Infinity;

  forEachGreenPixel(greenMask, bw, (x, y) => {
    const dx = x - frame.cx;
    const dy = y - frame.cy;
    const s = dx * frame.axisX + dy * frame.axisY;

    if (s < minS) minS = s;
    if (s > maxS) maxS = s;
  });

  const axisSpan = maxS - minS;
  if (!Number.isFinite(axisSpan) || axisSpan < MIN_AXIS_SPAN) {
    return false;
  }

  const binCount = Math.max(
    MIN_STRIP_BINS,
    Math.min(MAX_STRIP_BINS, Math.round(axisSpan / 2)),
  );

  const minTByBin = Array(binCount).fill(Infinity);
  const maxTByBin = Array(binCount).fill(-Infinity);
  const filledBins = Array(binCount).fill(false);

  forEachGreenPixel(greenMask, bw, (x, y) => {
    const dx = x - frame.cx;
    const dy = y - frame.cy;
    const s = dx * frame.axisX + dy * frame.axisY;
    const t = dx * frame.normalX + dy * frame.normalY;
    const bin = projectToBin(s, minS, axisSpan, binCount);

    if (t < minTByBin[bin]) minTByBin[bin] = t;
    if (t > maxTByBin[bin]) maxTByBin[bin] = t;
    filledBins[bin] = true;
  });

  const { startBin, endBin } = interpolateStripExtents(minTByBin, maxTByBin, filledBins);
  if (startBin === -1 || endBin === -1) {
    return false;
  }

  smoothStripExtents(minTByBin, maxTByBin, startBin, endBin);

  const widthByBin = Array(binCount).fill(0);
  let totalWidth = 0;
  let widthSamples = 0;
  let maxWidth = 0;

  for (let i = startBin; i <= endBin; i++) {
    const width = Math.max(0, maxTByBin[i] - minTByBin[i]);
    widthByBin[i] = width;
    if (width > 0) {
      totalWidth += width;
      widthSamples += 1;
      if (width > maxWidth) maxWidth = width;
    }
  }

  if (!widthSamples || maxWidth < MIN_STRIP_SPAN) {
    return false;
  }

  const fit = getPhoneCaseFit(sourceKey);
  let coreStartBin = startBin;
  let coreEndBin = endBin;
  const coreWidthThreshold = maxWidth * fit.coreWidthRatio;

  while (coreStartBin < endBin && widthByBin[coreStartBin] < coreWidthThreshold) {
    coreStartBin += 1;
  }

  while (coreEndBin > startBin && widthByBin[coreEndBin] < coreWidthThreshold) {
    coreEndBin -= 1;
  }

  if (coreEndBin <= coreStartBin) {
    coreStartBin = startBin;
    coreEndBin = endBin;
  }

  let coreTotalWidth = 0;
  let coreWidthSamples = 0;
  for (let i = coreStartBin; i <= coreEndBin; i++) {
    if (widthByBin[i] > 0) {
      coreTotalWidth += widthByBin[i];
      coreWidthSamples += 1;
    }
  }

  const averageWidth = totalWidth / widthSamples;
  const averageCoreWidth = coreWidthSamples ? coreTotalWidth / coreWidthSamples : averageWidth;
  const axisStep = binCount > 1 ? axisSpan / (binCount - 1) : axisSpan;
  const coreMinS = minS + coreStartBin * axisStep;
  const coreMaxS = minS + coreEndBin * axisStep;
  const coreSpan = Math.max(axisStep, coreMaxS - coreMinS);
  const crop = getCoverCrop(sampler.artAspect, averageCoreWidth / coreSpan);

  forEachGreenPixel(greenMask, bw, (x, y, index) => {
    const dx = x - frame.cx;
    const dy = y - frame.cy;
    const s = dx * frame.axisX + dy * frame.axisY;
    const t = dx * frame.normalX + dy * frame.normalY;
    const v = clamp((s - coreMinS) / coreSpan, 0, 1);
    const bin = projectToBin(s, minS, axisSpan, binCount);
    const stripMinT = minTByBin[bin];
    const stripMaxT = maxTByBin[bin];
    const stripSpan = stripMaxT - stripMinT;
    const u = stripSpan > MIN_STRIP_SPAN
      ? clamp((t - stripMinT) / stripSpan, 0, 1)
      : 0.5;

    paintSample(targetData, index * 4, sampler, crop.offU + u * crop.cropU, crop.offV + v * crop.cropV);
  });

  return true;
}

function getPhoneCaseFit(sourceKey) {
  if (!sourceKey) return DEFAULT_PHONE_CASE_FIT;

  const normalizedKey = sourceKey.toLowerCase();
  return PHONE_CASE_SOURCE_FITS[normalizedKey] ?? DEFAULT_PHONE_CASE_FIT;
}

function isInsidePhoneCasePanel(u, v, fit) {
  const left = fit.panelInsetU;
  const right = 1 - fit.panelInsetU;
  const top = fit.panelInsetVStart;
  const bottom = 1 - fit.panelInsetVEnd;

  if (u < left || u > right || v < top || v > bottom) {
    return false;
  }

  const panelWidth = right - left;
  const panelHeight = bottom - top;
  const radius = Math.min(panelWidth, panelHeight) * fit.panelCornerRadius;
  if (radius <= 0) return true;

  const innerLeft = left + radius;
  const innerRight = right - radius;
  const innerTop = top + radius;
  const innerBottom = bottom - radius;

  if ((u >= innerLeft && u <= innerRight) || (v >= innerTop && v <= innerBottom)) {
    return true;
  }

  const cornerX = u < innerLeft ? innerLeft : innerRight;
  const cornerY = v < innerTop ? innerTop : innerBottom;
  const dx = u - cornerX;
  const dy = v - cornerY;
  return dx * dx + dy * dy <= radius * radius;
}

function isGreenishColor(r, g, b) {
  if (g > 100 && g > r * 1.15 && g > b * 1.15) return true;
  if (g > 80 && (g - r) > 15 && (g - b) > 15) return true;
  return false;
}

function computePhoneCaseFillColor(sourceData, greenMask, bw, bh) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;

  forEachGreenPixel(greenMask, bw, (x, y) => {
    if (!isMaskBoundaryPixel(greenMask, bw, bh, x, y)) return;
    const [r, g, b] = sampleNearbyColor(sourceData, bw, bh, x, y);
    // Reject samples that are still greenish (anti-aliased edges)
    if (isGreenishColor(r, g, b)) return;
    red += r;
    green += g;
    blue += b;
    samples += 1;
  });

  if (!samples) return DEFAULT_PHONE_CASE_FILL;

  const result = [
    Math.round(red / samples),
    Math.round(green / samples),
    Math.round(blue / samples),
  ];

  // Final safety: if averaged result is still greenish, use default
  if (isGreenishColor(result[0], result[1], result[2])) return DEFAULT_PHONE_CASE_FILL;
  return result;
}

function paintCaseSurface(targetData, targetOffset, sourceData, greenMask, bw, bh, x, y, fallbackFill) {
  if (isMaskBoundaryPixel(greenMask, bw, bh, x, y)) {
    const [r, g, b] = sampleNearbyColor(sourceData, bw, bh, x, y);
    // Use sampled color only if it's not greenish, otherwise use fill
    if (!isGreenishColor(r, g, b)) {
      targetData[targetOffset] = r;
      targetData[targetOffset + 1] = g;
      targetData[targetOffset + 2] = b;
    } else {
      targetData[targetOffset] = fallbackFill[0];
      targetData[targetOffset + 1] = fallbackFill[1];
      targetData[targetOffset + 2] = fallbackFill[2];
    }
  } else {
    targetData[targetOffset] = fallbackFill[0];
    targetData[targetOffset + 1] = fallbackFill[1];
    targetData[targetOffset + 2] = fallbackFill[2];
  }

  targetData[targetOffset + 3] = 255;
}

function isMaskBoundaryPixel(greenMask, bw, bh, x, y) {
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || nx >= bw || ny < 0 || ny >= bh) return true;
    if (!greenMask[ny * bw + nx]) return true;
  }

  return false;
}

function getPrincipalFrame(greenMask, bw, bh) {
  let count = 0;
  let sumX = 0;
  let sumY = 0;

  forEachGreenPixel(greenMask, bw, (x, y) => {
    count += 1;
    sumX += x;
    sumY += y;
  });

  if (!count) return null;

  const cx = sumX / count;
  const cy = sumY / count;
  let xx = 0;
  let xy = 0;
  let yy = 0;

  forEachGreenPixel(greenMask, bw, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  });

  xx /= count;
  xy /= count;
  yy /= count;

  const trace = xx + yy;
  const det = xx * yy - xy * xy;
  const term = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
  const lambda = trace / 2 + term;

  let axisX;
  let axisY;

  if (Math.abs(xy) > 1e-6) {
    axisX = lambda - yy;
    axisY = xy;
  } else if (xx >= yy) {
    axisX = 1;
    axisY = 0;
  } else {
    axisX = 0;
    axisY = 1;
  }

  const axisMagnitude = Math.hypot(axisX, axisY) || 1;
  axisX /= axisMagnitude;
  axisY /= axisMagnitude;

  if (axisY < 0) {
    axisX *= -1;
    axisY *= -1;
  }

  let normalX = axisY;
  let normalY = -axisX;

  if (normalX < 0) {
    normalX *= -1;
    normalY *= -1;
  }

  return { cx, cy, axisX, axisY, normalX, normalY };
}

function interpolateStripExtents(minTByBin, maxTByBin, filledBins) {
  let startBin = -1;
  let endBin = -1;

  for (let i = 0; i < filledBins.length; i++) {
    if (!filledBins[i]) continue;
    if (startBin === -1) startBin = i;
    endBin = i;
  }

  if (startBin === -1 || endBin === -1) {
    return { startBin: -1, endBin: -1 };
  }

  for (let i = startBin; i <= endBin; i++) {
    if (filledBins[i]) continue;

    let prev = i - 1;
    while (prev >= startBin && !filledBins[prev]) prev -= 1;

    let next = i + 1;
    while (next <= endBin && !filledBins[next]) next += 1;

    if (prev >= startBin && next <= endBin) {
      const ratio = (i - prev) / (next - prev);
      minTByBin[i] = lerp(minTByBin[prev], minTByBin[next], ratio);
      maxTByBin[i] = lerp(maxTByBin[prev], maxTByBin[next], ratio);
    } else if (prev >= startBin) {
      minTByBin[i] = minTByBin[prev];
      maxTByBin[i] = maxTByBin[prev];
    } else if (next <= endBin) {
      minTByBin[i] = minTByBin[next];
      maxTByBin[i] = maxTByBin[next];
    }

    filledBins[i] = true;
  }

  return { startBin, endBin };
}

function smoothStripExtents(minTByBin, maxTByBin, startBin, endBin) {
  const nextMin = [...minTByBin];
  const nextMax = [...maxTByBin];

  for (let i = startBin; i <= endBin; i++) {
    let minSum = 0;
    let maxSum = 0;
    let samples = 0;

    for (let j = Math.max(startBin, i - STRIP_SMOOTHING_RADIUS); j <= Math.min(endBin, i + STRIP_SMOOTHING_RADIUS); j++) {
      minSum += minTByBin[j];
      maxSum += maxTByBin[j];
      samples += 1;
    }

    nextMin[i] = minSum / samples;
    nextMax[i] = maxSum / samples;

    if (nextMax[i] - nextMin[i] < 1) {
      const midpoint = (nextMax[i] + nextMin[i]) / 2;
      nextMin[i] = midpoint - 0.5;
      nextMax[i] = midpoint + 0.5;
    }
  }

  for (let i = startBin; i <= endBin; i++) {
    minTByBin[i] = nextMin[i];
    maxTByBin[i] = nextMax[i];
  }
}

function paintSample(targetData, targetOffset, sampler, u, v) {
  const x = clamp(u, 0, 1) * (sampler.width - 1);
  const y = clamp(v, 0, 1) * (sampler.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(sampler.width - 1, x0 + 1);
  const y1 = Math.min(sampler.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const topLeft = (y0 * sampler.width + x0) * 4;
  const topRight = (y0 * sampler.width + x1) * 4;
  const bottomLeft = (y1 * sampler.width + x0) * 4;
  const bottomRight = (y1 * sampler.width + x1) * 4;

  for (let channel = 0; channel < 3; channel++) {
    const top = lerp(sampler.data[topLeft + channel], sampler.data[topRight + channel], tx);
    const bottom = lerp(sampler.data[bottomLeft + channel], sampler.data[bottomRight + channel], tx);
    targetData[targetOffset + channel] = Math.round(lerp(top, bottom, ty));
  }

  targetData[targetOffset + 3] = 255;
}

function getCoverCrop(artAspect, targetAspect) {
  let cropU = 1;
  let cropV = 1;

  if (Number.isFinite(targetAspect) && targetAspect > 0) {
    if (artAspect > targetAspect) {
      cropU = targetAspect / artAspect;
    } else {
      cropV = artAspect / targetAspect;
    }
  }

  return {
    cropU,
    cropV,
    offU: (1 - cropU) / 2,
    offV: (1 - cropV) / 2,
  };
}

function projectToBin(s, minS, axisSpan, binCount) {
  return Math.max(0, Math.min(binCount - 1, Math.round(((s - minS) / axisSpan) * (binCount - 1))));
}

function forEachGreenPixel(greenMask, bw, callback) {
  for (let index = 0; index < greenMask.length; index++) {
    if (!greenMask[index]) continue;

    const x = index % bw;
    const y = (index - x) / bw;
    callback(x, y, index);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}
