/**
 * Mask-based projective compositing for phone case mockups.
 *
 * The live /generate/phone-case preview uses the alpha-cutout mockups, not the
 * older green-box path. This compositor now:
 * 1) builds a true printable mask from the mockup alpha channel
 * 2) fits the artwork into a source design rectangle with cover
 * 3) warps that fitted rectangle into a per-asset calibrated quad via homography
 * 4) blends only through the printable mask
 * 5) preserves the original mockup pixels outside the mask from the start
 */

const BG_COLOR = '#F5F5F5';
const DEBUG_QUERY_PARAM = 'phoneCaseDebug';
const MASK_THRESHOLD = 0.02;

const PHONE_CASE_MOCKUPS = {
  'mockup-1': {
    compositable: true,
    maskPadding: 0,
    feather: 2,
    quad: {
      topLeft: { x: 556.9, y: 159.3 },
      topRight: { x: 1371.0, y: 226.7 },
      bottomRight: { x: 1246.8, y: 1725.8 },
      bottomLeft: { x: 432.7, y: 1658.3 },
    },
  },
  'mockup-2': {
    compositable: true,
    maskPadding: -1,
    feather: 2,
    quad: {
      topLeft: { x: 575.4, y: -69.5 },
      topRight: { x: 1846.4, y: 1086.3 },
      bottomRight: { x: 1258.3, y: 1732.8 },
      bottomLeft: { x: -12.6, y: 577.1 },
    },
  },
  'mockup-3': {
    compositable: true,
    maskPadding: 0,
    feather: 2,
    quad: {
      topLeft: { x: 591.2, y: 135.0 },
      topRight: { x: 1464.4, y: 164.3 },
      bottomRight: { x: 1409.4, y: 1806.7 },
      bottomLeft: { x: 536.1, y: 1777.4 },
    },
  },
  'mockup-4': { compositable: false },
  'mockup-5': { compositable: false },
};

export function compositeAlpha(mockupImg, artworkImg, mockupKey, maxDim = 800) {
  const config = PHONE_CASE_MOCKUPS[mockupKey] ?? null;
  if (!config?.compositable || !artworkImg) {
    return renderPassThrough(mockupImg, maxDim);
  }

  const debugEnabled = isDebugEnabled();
  const fullW = mockupImg.naturalWidth;
  const fullH = mockupImg.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(fullW, fullH));
  const w = Math.max(1, Math.round(fullW * scale));
  const h = Math.max(1, Math.round(fullH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const printable = buildPrintableMask(mockupImg, w, h, config);
  const scaledQuad = scaleQuad(config.quad, scale);
  const design = createFittedDesignArtwork(artworkImg, getDesignSize(scaledQuad), debugEnabled);

  drawWarpedArtwork({
    ctx,
    design,
    quad: scaledQuad,
    maskAlpha: printable.maskAlpha,
    bounds: printable.bounds,
    width: w,
    height: h,
  });

  ctx.drawImage(mockupImg, 0, 0, w, h);

  if (debugEnabled) {
    drawDebugOverlay(ctx, printable, scaledQuad, mockupKey, w, h);
  }

  if (import.meta.env.DEV || debugEnabled) {
    console.info('[phone-case-compositor]', {
      mockupKey,
      usesPrintableMask: true,
      usesBoundsDetection: false,
      usesRectangularInsert: false,
      warp: 'homography',
      quad: scaledQuad,
      bounds: printable.bounds,
    });
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

function renderPassThrough(mockupImg, maxDim) {
  const fullW = mockupImg.naturalWidth;
  const fullH = mockupImg.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(fullW, fullH));
  const w = Math.max(1, Math.round(fullW * scale));
  const h = Math.max(1, Math.round(fullH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(mockupImg, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function isDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const value = params.get(DEBUG_QUERY_PARAM);
  return value === '1' || value === 'true' || value === 'debug';
}

function buildPrintableMask(mockupImg, width, height, config) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCtx.drawImage(mockupImg, 0, 0, width, height);

  const { data } = tempCtx.getImageData(0, 0, width, height);
  const rawMask = new Float32Array(width * height);
  const binaryMask = new Uint8Array(width * height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < rawMask.length; i++) {
    const alpha = data[i * 4 + 3] / 255;
    const maskValue = 1 - alpha;
    rawMask[i] = maskValue;
    if (maskValue > MASK_THRESHOLD) {
      binaryMask[i] = 1;
      const x = i % width;
      const y = (i - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX === -1) {
    return {
      bounds: null,
      maskAlpha: rawMask,
      maskBinary: binaryMask,
    };
  }

  let adjustedMask = rawMask;
  if (config.maskPadding) {
    adjustedMask = applyMaskPadding(adjustedMask, width, height, config.maskPadding);
  }
  if (config.feather) {
    adjustedMask = blurMask(adjustedMask, width, height, config.feather);
  }

  return {
    bounds: { minX, minY, maxX, maxY },
    maskAlpha: adjustedMask,
    maskBinary: binaryMask,
  };
}

function applyMaskPadding(maskAlpha, width, height, padding) {
  let current = new Uint8Array(maskAlpha.length);
  for (let i = 0; i < maskAlpha.length; i++) {
    current[i] = maskAlpha[i] > MASK_THRESHOLD ? 1 : 0;
  }

  const steps = Math.abs(padding);
  const dilate = padding > 0;

  for (let step = 0; step < steps; step++) {
    const next = new Uint8Array(current.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (dilate) {
          let hit = 0;
          for (let dy = -1; dy <= 1 && !hit; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && current[ny * width + nx]) {
                hit = 1;
                break;
              }
            }
          }
          next[index] = hit;
        } else {
          let keep = 1;
          for (let dy = -1; dy <= 1 && keep; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= width || ny < 0 || ny >= height || !current[ny * width + nx]) {
                keep = 0;
                break;
              }
            }
          }
          next[index] = keep;
        }
      }
    }
    current = next;
  }

  const adjusted = new Float32Array(current.length);
  for (let i = 0; i < current.length; i++) adjusted[i] = current[i];
  return adjusted;
}

function blurMask(maskAlpha, width, height, radius) {
  if (radius <= 0) return maskAlpha;

  const horizontal = new Float32Array(maskAlpha.length);
  const vertical = new Float32Array(maskAlpha.length);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    const prefix = new Float32Array(width + 1);
    for (let x = 0; x < width; x++) {
      prefix[x + 1] = prefix[x] + maskAlpha[y * width + x];
    }
    for (let x = 0; x < width; x++) {
      const start = Math.max(0, x - radius);
      const end = Math.min(width - 1, x + radius);
      horizontal[y * width + x] = (prefix[end + 1] - prefix[start]) / (end - start + 1);
    }
  }

  for (let x = 0; x < width; x++) {
    const prefix = new Float32Array(height + 1);
    for (let y = 0; y < height; y++) {
      prefix[y + 1] = prefix[y] + horizontal[y * width + x];
    }
    for (let y = 0; y < height; y++) {
      const start = Math.max(0, y - radius);
      const end = Math.min(height - 1, y + radius);
      vertical[y * width + x] = (prefix[end + 1] - prefix[start]) / (end - start + 1);
    }
  }

  for (let i = 0; i < vertical.length; i++) {
    vertical[i] = Math.max(0, Math.min(1, vertical[i]));
  }

  return vertical;
}

function scaleQuad(quad, scale) {
  return {
    topLeft: scalePoint(quad.topLeft, scale),
    topRight: scalePoint(quad.topRight, scale),
    bottomRight: scalePoint(quad.bottomRight, scale),
    bottomLeft: scalePoint(quad.bottomLeft, scale),
  };
}

function scalePoint(point, scale) {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

function getDesignSize(quad) {
  const topWidth = distance(quad.topLeft, quad.topRight);
  const bottomWidth = distance(quad.bottomLeft, quad.bottomRight);
  const leftHeight = distance(quad.topLeft, quad.bottomLeft);
  const rightHeight = distance(quad.topRight, quad.bottomRight);

  return {
    width: Math.max(32, Math.round((topWidth + bottomWidth) / 2)),
    height: Math.max(32, Math.round((leftHeight + rightHeight) / 2)),
  };
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function createFittedDesignArtwork(artworkImg, designSize, debugEnabled) {
  const canvas = document.createElement('canvas');
  canvas.width = designSize.width;
  canvas.height = designSize.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const artW = artworkImg.naturalWidth;
  const artH = artworkImg.naturalHeight;
  const artAspect = artW / artH;
  const designAspect = designSize.width / designSize.height;

  let sx = 0;
  let sy = 0;
  let sw = artW;
  let sh = artH;

  if (artAspect > designAspect) {
    sw = artH * designAspect;
    sx = (artW - sw) / 2;
  } else {
    sh = artW / designAspect;
    sy = (artH - sh) / 2;
  }

  ctx.drawImage(artworkImg, sx, sy, sw, sh, 0, 0, designSize.width, designSize.height);

  if (debugEnabled) {
    drawSourceGrid(ctx, designSize.width, designSize.height);
  }

  return {
    width: designSize.width,
    height: designSize.height,
    data: ctx.getImageData(0, 0, designSize.width, designSize.height).data,
  };
}

function drawSourceGrid(ctx, width, height, cells = 8) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
  ctx.lineWidth = Math.max(1, Math.round(Math.min(width, height) / 250));
  for (let i = 1; i < cells; i++) {
    const x = (width * i) / cells;
    const y = (height * i) / cells;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWarpedArtwork({ ctx, design, quad, maskAlpha, bounds, width, height }) {
  if (!bounds) return;

  const output = ctx.getImageData(0, 0, width, height);
  const data = output.data;
  const srcPoints = [
    { x: 0, y: 0 },
    { x: design.width - 1, y: 0 },
    { x: design.width - 1, y: design.height - 1 },
    { x: 0, y: design.height - 1 },
  ];
  const dstPoints = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft];
  const homography = computeHomography(srcPoints, dstPoints);
  const inverse = invert3x3(homography);

  const minX = Math.max(0, Math.floor(Math.min(quad.topLeft.x, quad.topRight.x, quad.bottomRight.x, quad.bottomLeft.x, bounds.minX)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(quad.topLeft.x, quad.topRight.x, quad.bottomRight.x, quad.bottomLeft.x, bounds.maxX)));
  const minY = Math.max(0, Math.floor(Math.min(quad.topLeft.y, quad.topRight.y, quad.bottomRight.y, quad.bottomLeft.y, bounds.minY)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(quad.topLeft.y, quad.topRight.y, quad.bottomRight.y, quad.bottomLeft.y, bounds.maxY)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pixelIndex = y * width + x;
      const mask = maskAlpha[pixelIndex];
      if (mask <= 0.001) continue;

      const mapped = projectPoint(inverse, x + 0.5, y + 0.5);
      const sample = sampleBilinearRGBA(design.data, design.width, design.height, mapped.x, mapped.y);
      if (!sample) continue;

      const alpha = (sample[3] / 255) * mask;
      if (alpha <= 0.001) continue;

      const offset = pixelIndex * 4;
      data[offset] = Math.round(sample[0] * alpha + data[offset] * (1 - alpha));
      data[offset + 1] = Math.round(sample[1] * alpha + data[offset + 1] * (1 - alpha));
      data[offset + 2] = Math.round(sample[2] * alpha + data[offset + 2] * (1 - alpha));
      data[offset + 3] = 255;
    }
  }

  ctx.putImageData(output, 0, 0);
}

function computeHomography(srcPoints, dstPoints) {
  const matrix = [];
  const values = [];

  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = srcPoints[i];
    const { x, y } = dstPoints[i];
    matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    values.push(x);
    matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    values.push(y);
  }

  const solved = solveLinearSystem(matrix, values);
  return [
    solved[0], solved[1], solved[2],
    solved[3], solved[4], solved[5],
    solved[6], solved[7], 1,
  ];
}

function solveLinearSystem(matrix, values) {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let col = 0; col < size; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
        pivotRow = row;
      }
    }

    if (pivotRow !== col) {
      [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];
    }

    const pivot = augmented[col][col] || 1e-12;
    for (let j = col; j <= size; j++) {
      augmented[col][j] /= pivot;
    }

    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      if (!factor) continue;
      for (let j = col; j <= size; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map(row => row[size]);
}

function invert3x3(matrix) {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const determinant = a * A + b * B + c * C;
  const invDet = 1 / (determinant || 1e-12);

  return [
    A * invDet, D * invDet, G * invDet,
    B * invDet, E * invDet, H * invDet,
    C * invDet, F * invDet, I * invDet,
  ];
}

function projectPoint(matrix, x, y) {
  const denom = matrix[6] * x + matrix[7] * y + matrix[8];
  return {
    x: (matrix[0] * x + matrix[1] * y + matrix[2]) / denom,
    y: (matrix[3] * x + matrix[4] * y + matrix[5]) / denom,
  };
}

function sampleBilinearRGBA(data, width, height, x, y) {
  if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return null;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const c00 = getPixel(data, width, x0, y0);
  const c10 = getPixel(data, width, x1, y0);
  const c01 = getPixel(data, width, x0, y1);
  const c11 = getPixel(data, width, x1, y1);

  return [
    bilerp(c00[0], c10[0], c01[0], c11[0], tx, ty),
    bilerp(c00[1], c10[1], c01[1], c11[1], tx, ty),
    bilerp(c00[2], c10[2], c01[2], c11[2], tx, ty),
    bilerp(c00[3], c10[3], c01[3], c11[3], tx, ty),
  ];
}

function getPixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

function bilerp(c00, c10, c01, c11, tx, ty) {
  const top = c00 * (1 - tx) + c10 * tx;
  const bottom = c01 * (1 - tx) + c11 * tx;
  return top * (1 - ty) + bottom * ty;
}

function drawDebugOverlay(ctx, printable, quad, mockupKey, width, height) {
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext('2d');
  const image = overlayCtx.createImageData(width, height);

  for (let i = 0; i < printable.maskAlpha.length; i++) {
    const alpha = printable.maskAlpha[i];
    if (alpha <= 0.01) continue;
    const offset = i * 4;
    image.data[offset] = 0;
    image.data[offset + 1] = 255;
    image.data[offset + 2] = 255;
    image.data[offset + 3] = Math.round(alpha * 55);
  }

  overlayCtx.putImageData(image, 0, 0);
  ctx.drawImage(overlayCanvas, 0, 0);

  ctx.save();
  ctx.strokeStyle = '#FFBF00';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) / 180));
  ctx.beginPath();
  ctx.moveTo(quad.topLeft.x, quad.topLeft.y);
  ctx.lineTo(quad.topRight.x, quad.topRight.y);
  ctx.lineTo(quad.bottomRight.x, quad.bottomRight.y);
  ctx.lineTo(quad.bottomLeft.x, quad.bottomLeft.y);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#FF5C7A';
  for (const point of [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(4, Math.round(Math.min(width, height) / 120)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(16, 16, 268, 64);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 14px system-ui';
  ctx.fillText(`Debug: ${mockupKey}`, 28, 40);
  ctx.font = '12px system-ui';
  ctx.fillText('mask + quad + warped design grid', 28, 60);
  ctx.restore();
}

export function extractMockupKey(src) {
  const match = String(src).match(/mockup-\d+/);
  return match ? match[0] : '';
}

export function hasCompositableRegion(mockupKey) {
  return Boolean(PHONE_CASE_MOCKUPS[mockupKey]?.compositable);
}
