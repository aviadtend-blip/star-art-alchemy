const MIN_COMPONENT_PIXELS = 64;
const MIN_COMPONENT_COVERAGE = 0.003;
const MIN_FILL_RATIO = 0.45;
const MIN_ASPECT_RATIO = 0.3;
const MAX_ASPECT_RATIO = 1.4;
const FALLBACK_MIN_COVERAGE = 0.02;

export function isGreenPixel(r, g, b) {
  // Strict green-screen detection: bright, saturated green with low red and blue
  return g > 120 && r < 150 && b < 150 && g > r * 1.5 && g > b * 1.5;
}

export function sampleNearbyColor(data, w, h, px, py) {
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]];

  for (const [ox, oy] of offsets) {
    const nx = px + ox;
    const ny = py + oy;

    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const ni = (ny * w + nx) * 4;
      if (!isGreenPixel(data[ni], data[ni + 1], data[ni + 2])) {
        return [data[ni], data[ni + 1], data[ni + 2]];
      }
    }
  }

  return [200, 200, 200];
}

/**
 * Find the primary green-screen placeholder by connected components instead of
 * using a global min/max over all green pixels in the image.
 */
export function findGreenBounds(data, w, h) {
  const totalPixels = w * h;
  if (!totalPixels) return null;

  const visited = new Uint8Array(totalPixels);
  const minComponentPixels = Math.max(
    MIN_COMPONENT_PIXELS,
    Math.floor(totalPixels * MIN_COMPONENT_COVERAGE),
  );

  let bestCandidate = null;
  let largestComponent = null;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const index = y * w + x;
      if (visited[index]) continue;

      visited[index] = 1;
      const offset = index * 4;
      if (!isGreenPixel(data[offset], data[offset + 1], data[offset + 2])) continue;

      const component = floodGreenComponent(data, w, h, index, visited);

      if (!largestComponent || component.pixelCount > largestComponent.pixelCount) {
        largestComponent = component;
      }

      if (component.pixelCount < minComponentPixels) continue;

      const bw = component.maxX - component.minX + 1;
      const bh = component.maxY - component.minY + 1;
      const bboxArea = bw * bh;
      const fillRatio = component.pixelCount / bboxArea;
      const aspectRatio = bw / bh;

      if (fillRatio < MIN_FILL_RATIO) continue;
      if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) continue;

      const score = component.pixelCount * fillRatio;
      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = { ...component, score };
      }
    }
  }

  if (bestCandidate) {
    return toBounds(bestCandidate);
  }

  if (!largestComponent) return null;

  const fallbackCoverage = largestComponent.pixelCount / totalPixels;
  if (fallbackCoverage < FALLBACK_MIN_COVERAGE) return null;

  return toBounds(largestComponent);
}

function floodGreenComponent(data, w, h, startIndex, visited) {
  const stack = [startIndex];

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let pixelCount = 0;

  while (stack.length) {
    const index = stack.pop();
    const x = index % w;
    const y = (index - x) / w;

    pixelCount += 1;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (ox === 0 && oy === 0) continue;

        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

        const neighborIndex = ny * w + nx;
        if (visited[neighborIndex]) continue;

        visited[neighborIndex] = 1;
        const no = neighborIndex * 4;

        if (isGreenPixel(data[no], data[no + 1], data[no + 2])) {
          stack.push(neighborIndex);
        }
      }
    }
  }

  return { minX, minY, maxX, maxY, pixelCount };
}

function toBounds(component) {
  const { minX, minY, maxX, maxY } = component;
  return { minX, minY, maxX, maxY };
}

/**
 * Find the four corner points of the green quad within a green mask.
 * Uses rows with substantial width (≥30% of max) to skip rounded tips.
 * Returns { tl, tr, bl, br } each with { x, y } relative to the mask,
 * or null if the green region is empty/too small.
 */
export function findGreenQuadCorners(greenMask, bw, bh) {
  // Compute per-row extents
  const rowExtents = new Array(bh);
  let maxRowWidth = 0;

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
      const w = right - left + 1;
      if (w > maxRowWidth) maxRowWidth = w;
    }
  }

  if (maxRowWidth < 4) return null;

  // Find first and last rows with substantial width (≥30% of max)
  const threshold = maxRowWidth * 0.3;
  let topRow = -1, bottomRow = -1;

  for (let y = 0; y < bh; y++) {
    const { left, right } = rowExtents[y];
    if (left !== -1 && (right - left + 1) >= threshold) {
      if (topRow === -1) topRow = y;
      bottomRow = y;
    }
  }

  if (topRow === -1) return null;

  return {
    tl: { x: rowExtents[topRow].left,    y: topRow },
    tr: { x: rowExtents[topRow].right,   y: topRow },
    bl: { x: rowExtents[bottomRow].left, y: bottomRow },
    br: { x: rowExtents[bottomRow].right, y: bottomRow },
  };
}

/**
 * Inverse bilinear interpolation: given a point (px, py) inside a quad
 * defined by corners tl, tr, bl, br, find (u, v) ∈ [0,1]².
 * Uses Newton iteration for fast convergence.
 */
export function bilinearInverse(px, py, tl, tr, bl, br) {
  // Initial guess based on bounding box
  const minX = Math.min(tl.x, tr.x, bl.x, br.x);
  const maxX = Math.max(tl.x, tr.x, bl.x, br.x);
  const minY = Math.min(tl.y, tr.y, bl.y, br.y);
  const maxY = Math.max(tl.y, tr.y, bl.y, br.y);
  let u = maxX > minX ? (px - minX) / (maxX - minX) : 0.5;
  let v = maxY > minY ? (py - minY) / (maxY - minY) : 0.5;

  for (let iter = 0; iter < 6; iter++) {
    const omU = 1 - u, omV = 1 - v;
    const fx = omU * omV * tl.x + u * omV * tr.x + omU * v * bl.x + u * v * br.x;
    const fy = omU * omV * tl.y + u * omV * tr.y + omU * v * bl.y + u * v * br.y;

    const ex = px - fx;
    const ey = py - fy;
    if (ex * ex + ey * ey < 0.25) break;

    const dxdu = -omV * tl.x + omV * tr.x - v * bl.x + v * br.x;
    const dxdv = -omU * tl.x - u * tr.x + omU * bl.x + u * br.x;
    const dydu = -omV * tl.y + omV * tr.y - v * bl.y + v * br.y;
    const dydv = -omU * tl.y - u * tr.y + omU * bl.y + u * br.y;

    const det = dxdu * dydv - dxdv * dydu;
    if (Math.abs(det) < 1e-10) break;

    u += (dydv * ex - dxdv * ey) / det;
    v += (dxdu * ey - dydu * ex) / det;
  }

  return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}
