import { bilinearInverse, findGreenQuadCorners } from './chromaKey';

const DEFAULT_ARTWORK_MAX_DIM = 800;
const MIN_AXIS_SPAN = 24;
const MIN_STRIP_SPAN = 6;
const MIN_STRIP_BINS = 96;
const MAX_STRIP_BINS = 512;
const STRIP_SMOOTHING_RADIUS = 2;

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

export function applyArtworkToMask({ maskData, greenMask, sampler, bw, bh, mode = 'default' }) {
  if (mode === 'phone-case' && paintArtworkWithOrientedStrips(maskData.data, greenMask, sampler, bw, bh)) {
    return;
  }

  if (paintArtworkWithQuad(maskData.data, greenMask, sampler, bw, bh)) {
    return;
  }

  paintArtworkFlatCover(maskData.data, greenMask, sampler, bw, bh);
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

function paintArtworkWithOrientedStrips(targetData, greenMask, sampler, bw, bh) {
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

  let totalWidth = 0;
  let widthSamples = 0;
  for (let i = startBin; i <= endBin; i++) {
    const width = maxTByBin[i] - minTByBin[i];
    if (width > 0) {
      totalWidth += width;
      widthSamples += 1;
    }
  }

  if (!widthSamples) {
    return false;
  }

  const averageWidth = totalWidth / widthSamples;
  const crop = getCoverCrop(sampler.artAspect, averageWidth / axisSpan);

  forEachGreenPixel(greenMask, bw, (x, y, index) => {
    const dx = x - frame.cx;
    const dy = y - frame.cy;
    const s = dx * frame.axisX + dy * frame.axisY;
    const t = dx * frame.normalX + dy * frame.normalY;
    const v = clamp((s - minS) / axisSpan, 0, 1);
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
