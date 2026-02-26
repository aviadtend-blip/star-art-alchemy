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
