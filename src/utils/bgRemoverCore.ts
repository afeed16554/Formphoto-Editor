/**
 * Production Studio Alpha Matte Edge Refinement (Choke / Defringe -2px..+2px & Feather 0px..3px),
 * Bradley-Roth O(N) Integral-Image Local Adaptive Signature Isolation (w = 24, t = 0.14),
 * and CIE LAB + Sobel fallback matting engine.
 * Runs 100% locally on RGBA Uint8ClampedArray pixel buffers.
 */

export interface LabColor {
  l: number;
  a: number;
  b: number;
  r: number;
  g: number;
  bl: number;
}

/**
 * Fast sRGB (0..255) to perceptual CIE LAB conversion.
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  const x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
  const y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.0;
  const z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
    r,
    g,
    bl: b,
  };
}

/**
 * Perceptual color distance in CIE LAB space that tolerates lighting/shadow gradients
 * on studio walls while remaining highly sensitive to chromatic shifts (skin, hair, clothes).
 */
export function labDistanceShadowAware(c1: LabColor, c2: LabColor): number {
  const dl = (c1.l - c2.l) * 0.58;
  const da = (c1.a - c2.a) * 1.35;
  const db = (c1.b - c2.b) * 1.35;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Morphological Erosion (if radius < 0) or Dilation (if radius > 0) for integer radius 1 or 2.
 */
function morphStepInteger(
  alphaIn: Float32Array,
  width: number,
  height: number,
  intRadius: number,
  erode: boolean
): Float32Array {
  if (intRadius <= 0) return new Float32Array(alphaIn);
  const out = new Float32Array(width * height);
  const rSq = intRadius * intRadius + 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let best = alphaIn[idx];

      for (let dy = -intRadius; dy <= intRadius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          if (erode) best = 0;
          continue;
        }
        for (let dx = -intRadius; dx <= intRadius; dx++) {
          if (dx * dx + dy * dy > rSq) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            if (erode) best = 0;
            continue;
          }
          const val = alphaIn[ny * width + nx];
          if (erode) {
            if (val < best) best = val;
          } else {
            if (val > best) best = val;
          }
        }
      }
      out[idx] = best;
    }
  }
  return out;
}

/**
 * Separable 2-pass tent/Gaussian-like smoothing of an alpha matte for fractional featherPx (0..3px).
 */
function featherAlphaMatte(
  alphaIn: Float32Array,
  width: number,
  height: number,
  featherPx: number
): Float32Array {
  const clamped = Math.max(0, Math.min(3, featherPx));
  if (clamped <= 0.05) return new Float32Array(alphaIn);

  const r = Math.ceil(clamped);
  const sigma = Math.max(0.45, clamped * 0.65);
  const weights: number[] = [];
  let weightSum = 0;
  for (let k = -r; k <= r; k++) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma));
    weights.push(w);
    weightSum += w;
  }
  for (let i = 0; i < weights.length; i++) {
    weights[i] /= weightSum;
  }

  const temp = new Float32Array(width * height);
  const out = new Float32Array(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) {
        const nx = Math.max(0, Math.min(width - 1, x + k));
        acc += alphaIn[rowOffset + nx] * weights[k + r];
      }
      temp[rowOffset + x] = acc;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) {
        const ny = Math.max(0, Math.min(height - 1, y + k));
        acc += temp[ny * width + x] * weights[k + r];
      }
      out[y * width + x] = acc;
    }
  }

  return out;
}

/**
 * Alpha Matte Edge Refinement + Halo Color Decontamination (Defringe):
 * - Takes RGBA pixel buffer and a foreground alpha mask (0..255 from neural matting).
 * - Applies Edge Choke / Defringe (`chokePx` in [-2, +2]) using fractional morphological
 *   erosion (< 0) or dilation (> 0).
 * - Applies Edge Feather (`featherPx` in [0, 3]) using separable Gaussian smoothing.
 * - Decontaminates boundary RGB pixels by pulling edge colors toward solid interior
 *   foreground pixels, removing bright room halos around hair and shoulders.
 */
export function refineAlphaMatteAndDefringe(
  rgbaData: Uint8ClampedArray,
  baseAlphaMask: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  chokePx: number,
  featherPx: number
): void {
  const numPixels = width * height;
  const baseFloat = new Float32Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    baseFloat[i] = baseAlphaMask[i];
  }

  // 1. Fractional Morphological Choke / Expand (-2.0px to +2.0px)
  const clampedChoke = Math.max(-2, Math.min(2, chokePx));
  let chokedAlpha: Float32Array;

  if (Math.abs(clampedChoke) < 0.05) {
    chokedAlpha = baseFloat;
  } else {
    const erode = clampedChoke < 0;
    const absChoke = Math.abs(clampedChoke);
    const r0 = Math.floor(absChoke);
    const r1 = Math.ceil(absChoke);
    const frac = absChoke - r0;

    const a0 = r0 === 0 ? baseFloat : morphStepInteger(baseFloat, width, height, r0, erode);
    if (frac < 0.05 || r0 === r1) {
      chokedAlpha = a0;
    } else {
      const a1 = morphStepInteger(baseFloat, width, height, r1, erode);
      chokedAlpha = new Float32Array(numPixels);
      for (let i = 0; i < numPixels; i++) {
        chokedAlpha[i] = a0[i] * (1 - frac) + a1[i] * frac;
      }
    }
  }

  // 2. Separable Gaussian Edge Feather (0px to 3px)
  const featheredAlpha = featherAlphaMatte(chokedAlpha, width, height, featherPx);

  // 3. Foreground Halo Color Decontamination (Defringe) + Write Final Alpha
  // Snapshot original RGB so neighborhood lookups read unmodified interior colors
  const origRgb = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    const idx4 = i * 4;
    const idx3 = i * 3;
    origRgb[idx3] = rgbaData[idx4];
    origRgb[idx3 + 1] = rgbaData[idx4 + 1];
    origRgb[idx3 + 2] = rgbaData[idx4 + 2];
  }

  const extraDefringe = clampedChoke < 0 ? Math.min(0.45, Math.abs(clampedChoke) * 0.22) : 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx4 = i * 4;
      const a = Math.max(0, Math.min(255, Math.round(featheredAlpha[i])));
      rgbaData[idx4 + 3] = a;

      // Decontaminate semi-transparent or choked boundary pixels
      if (a > 4 && a < 252) {
        let bestInteriorAlpha = 0;
        let fgR = origRgb[i * 3];
        let fgG = origRgb[i * 3 + 1];
        let fgB = origRgb[i * 3 + 2];

        // Search 5x5 neighborhood for clean solid interior foreground (baseAlphaMask >= 242)
        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const ni = ny * width + nx;
            const na = baseAlphaMask[ni];
            if (na > bestInteriorAlpha && na >= 235) {
              bestInteriorAlpha = na;
              fgR = origRgb[ni * 3];
              fgG = origRgb[ni * 3 + 1];
              fgB = origRgb[ni * 3 + 2];
            }
          }
        }

        if (bestInteriorAlpha >= 235) {
          const pull = Math.min(0.92, (1 - a / 255) * 0.78 + extraDefringe);
          rgbaData[idx4] = Math.round(rgbaData[idx4] * (1 - pull) + fgR * pull);
          rgbaData[idx4 + 1] = Math.round(rgbaData[idx4 + 1] * (1 - pull) + fgG * pull);
          rgbaData[idx4 + 2] = Math.round(rgbaData[idx4 + 2] * (1 - pull) + fgB * pull);
        }
      }
    }
  }
}

/**
 * Extracts signature ink using O(N) Bradley-Roth Local Adaptive Thresholding with a 2D Integral Image.
 * - Calibrated window size w = 24 (scaled with resolution so 300px width uses w = 24, half-window s = 12)
 * - Calibrated default threshold t = 0.14 (adjustable via thresholdParam)
 * - Supports "Preserve Original Blue/Black Ink Color" ('original') vs "Pure Monochrome Black" ('mono')
 * - Cleanly removes uneven phone camera shadows on paper without breaking thin pen strokes.
 */
export function processSignatureAdaptiveInk(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bgRemovalEnabled: boolean,
  thresholdParam: number,
  inkColorModeOrHighContrast: 'original' | 'mono' | boolean = 'original',
  windowSize = 24
): void {
  const numPixels = width * height;
  const lum = new Float32Array(numPixels);
  const validMask = new Uint8Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const a = data[idx + 3];
    if (a >= 242) {
      validMask[i] = 1;
      lum[i] =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    } else {
      validMask[i] = 0;
      lum[i] = 0;
    }
  }

  // 1. Build 2D Integral Images (Summed-Area Tables for Luminance and Valid Pixel Count) in O(N)
  // Using validCount prevents transparent letterbox margins from skewing local paper luminance at photo edges.
  const stride = width + 1;
  const integral = new Float64Array((width + 1) * (height + 1));
  const integralCount = new Int32Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    let rowCount = 0;
    const rowIdx = y * stride;
    const prevRowIdx = (y - 1) * stride;
    const srcRow = (y - 1) * width;
    for (let x = 1; x <= width; x++) {
      const pIdx = srcRow + (x - 1);
      rowSum += lum[pIdx];
      rowCount += validMask[pIdx];
      integral[rowIdx + x] = integral[prevRowIdx + x] + rowSum;
      integralCount[rowIdx + x] = integralCount[prevRowIdx + x] + rowCount;
    }
  }

  // 2. Calibrate Bradley-Roth window w = 24 (half-window s = w / 2 = 12)
  const scaleFactor = Math.max(1, Math.min(width, height) / 120);
  const effectiveW = Math.max(
    8,
    Math.round(windowSize * Math.min(1.5, Math.max(0.5, scaleFactor * 0.5)))
  );
  const halfW = Math.max(4, Math.round(effectiveW / 2));

  // Normalize thresholdParam:
  // - If caller passes 6..28 (e.g. 14 for t = 0.14), t = thresholdParam / 100
  // - If caller passes legacy 100..220 (e.g. 145), map 145 -> 0.14
  let t: number;
  if (thresholdParam <= 45) {
    t = Math.max(0.04, Math.min(0.32, thresholdParam / 100));
  } else {
    t = Math.max(0.05, Math.min(0.28, (235 - thresholdParam) / 640));
  }

  const inkMode: 'original' | 'mono' =
    typeof inkColorModeOrHighContrast === 'boolean'
      ? inkColorModeOrHighContrast
        ? 'mono'
        : 'original'
      : inkColorModeOrHighContrast;

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - halfW);
    const y2 = Math.min(height - 1, y + halfW);

    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;

      // Ignore transparent letterbox margins or 1px anti-aliased photo-frame edges
      const isNearLetterboxEdge =
        validMask[i] === 0 ||
        (x > 0 && validMask[i - 1] === 0) ||
        (x + 1 < width && validMask[i + 1] === 0) ||
        (y > 0 && validMask[i - width] === 0) ||
        (y + 1 < height && validMask[i + width] === 0);

      if (isNearLetterboxEdge) {
        if (bgRemovalEnabled) {
          data[idx + 3] = 0;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
        continue;
      }

      const x1 = Math.max(0, x - halfW);
      const x2 = Math.min(width - 1, x + halfW);

      const sum =
        integral[(y2 + 1) * stride + (x2 + 1)] -
        integral[y1 * stride + (x2 + 1)] -
        integral[(y2 + 1) * stride + x1] +
        integral[y1 * stride + x1];

      const validCount =
        integralCount[(y2 + 1) * stride + (x2 + 1)] -
        integralCount[y1 * stride + (x2 + 1)] -
        integralCount[(y2 + 1) * stride + x1] +
        integralCount[y1 * stride + x1];

      const localMean = sum / Math.max(1, validCount);
      const pixelLum = lum[i];

      // Bradley-Roth adaptive threshold: pixel is ink if pixelLum < localMean * (1 - t)
      const adaptiveCutoff = localMean * (1 - t);
      // Soft anti-aliased transition band so thin pen strokes never break or alias
      const softMargin = Math.max(6, localMean * 0.055);

      if (pixelLum >= adaptiveCutoff + softMargin * 0.35) {
        // Paper / phone shadow region
        if (bgRemovalEnabled) {
          data[idx + 3] = 0;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      } else {
        // Ink stroke region: compute continuous ink density (0..1)
        const rawDensity = Math.min(
          1,
          Math.max(0.18, (adaptiveCutoff + softMargin * 0.35 - pixelLum) / (softMargin * 1.45))
        );
        // Boost stroke solidity so thin ballpoint pen lines stay crisp
        const inkAlpha = Math.min(1, Math.pow(rawDensity, 0.72) * 1.15);

        if (inkMode === 'mono') {
          // Pure Monochrome Black Ink
          data[idx] = 10;
          data[idx + 1] = 12;
          data[idx + 2] = 16;
        } else {
          // Preserve Original Blue/Black Ink Color while neutralizing paper shadow cast
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const normScale = 255 / Math.max(80, localMean);
          // Enhance chroma differences (so blue ballpoint pen ink stays distinctively blue)
          const nr = Math.min(255, r * normScale);
          const ng = Math.min(255, g * normScale);
          const nb = Math.min(255, b * normScale);
          const avg = (nr + ng + nb) / 3;
          const chromaBoost = 1.65;
          const darken = 0.58;
          data[idx] = Math.max(0, Math.min(220, Math.round((avg + (nr - avg) * chromaBoost) * darken)));
          data[idx + 1] = Math.max(0, Math.min(220, Math.round((avg + (ng - avg) * chromaBoost) * darken)));
          data[idx + 2] = Math.max(0, Math.min(245, Math.round((avg + (nb - avg) * chromaBoost) * darken)));
        }

        if (bgRemovalEnabled) {
          data[idx + 3] = Math.round(inkAlpha * 255);
        } else {
          // Blend ink over pure white paper
          data[idx] = Math.round(data[idx] * inkAlpha + 255 * (1 - inkAlpha));
          data[idx + 1] = Math.round(data[idx + 1] * inkAlpha + 255 * (1 - inkAlpha));
          data[idx + 2] = Math.round(data[idx + 2] * inkAlpha + 255 * (1 - inkAlpha));
          data[idx + 3] = 255;
        }
      }
    }
  }
}

/**
 * Fallback CIE LAB + Sobel Edge-Aware Portrait Matting (used instantaneously before
 * neural mask finishes or if offline). Generates a clean alpha mask and applies
 * refineAlphaMatteAndDefringe.
 */
export function processPortraitHighQualityCutout(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number,
  featherRadius = 2,
  chokePx = 0
): void {
  const numPixels = width * height;
  if (numPixels === 0) return;

  const labPixels: LabColor[] = new Array(numPixels);
  const lum = new Float32Array(numPixels);

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lab = rgbToLab(r, g, b);
    labPixels[i] = lab;
    lum[i] = lab.l;
  }

  const edgeMag = new Float32Array(numPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -lum[(y - 1) * width + (x - 1)] +
        lum[(y - 1) * width + (x + 1)] -
        2 * lum[y * width + (x - 1)] +
        2 * lum[y * width + (x + 1)] -
        lum[(y + 1) * width + (x - 1)] +
        lum[(y + 1) * width + (x + 1)];

      const gy =
        -lum[(y - 1) * width + (x - 1)] -
        2 * lum[(y - 1) * width + x] -
        lum[(y - 1) * width + (x + 1)] +
        lum[(y + 1) * width + (x - 1)] +
        2 * lum[(y + 1) * width + x] +
        lum[(y + 1) * width + (x + 1)];

      const dChromaX =
        Math.abs(labPixels[y * width + (x + 1)].a - labPixels[y * width + (x - 1)].a) +
        Math.abs(labPixels[y * width + (x + 1)].b - labPixels[y * width + (x - 1)].b);
      const dChromaY =
        Math.abs(labPixels[(y + 1) * width + x].a - labPixels[(y - 1) * width + x].a) +
        Math.abs(labPixels[(y + 1) * width + x].b - labPixels[(y - 1) * width + x].b);

      edgeMag[idx] = Math.sqrt(gx * gx + gy * gy) * 0.35 + (dChromaX + dChromaY) * 1.2;
    }
  }

  const clusters: LabColor[] = [];
  const clusterMergeDist = 8.5;

  const addClusterSample = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(width - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(height - 1, Math.round(y)));
    const sample = labPixels[cy * width + cx];
    for (let k = 0; k < clusters.length; k++) {
      if (labDistanceShadowAware(sample, clusters[k]) < clusterMergeDist) {
        clusters[k] = {
          l: (clusters[k].l + sample.l) * 0.5,
          a: (clusters[k].a + sample.a) * 0.5,
          b: (clusters[k].b + sample.b) * 0.5,
          r: (clusters[k].r + sample.r) * 0.5,
          g: (clusters[k].g + sample.g) * 0.5,
          bl: (clusters[k].bl + sample.bl) * 0.5,
        };
        return;
      }
    }
    if (clusters.length < 18) {
      clusters.push({ ...sample });
    }
  };

  const stepX = Math.max(2, Math.floor(width / 24));
  const stepY = Math.max(2, Math.floor(height / 24));
  for (let x = 2; x < width - 2; x += stepX) {
    addClusterSample(x, 2);
    addClusterSample(x, Math.min(height - 1, 5));
  }
  const maxSideY = Math.floor(height * 0.82);
  for (let y = 2; y < maxSideY; y += stepY) {
    addClusterSample(2, y);
    addClusterSample(width - 3, y);
  }

  if (clusters.length === 0) {
    clusters.push(labPixels[0]);
  }

  const minClusterDist = (c: LabColor): number => {
    let best = 9999;
    for (let k = 0; k < clusters.length; k++) {
      const d = labDistanceShadowAware(c, clusters[k]);
      if (d < best) best = d;
    }
    return best;
  };

  const baseThresh = Math.max(10, tolerance * 0.82);
  const neighborStepThresh = Math.max(6.5, tolerance * 0.34);
  const edgeBarrierCutoff = Math.max(18, 46 - tolerance * 0.35);

  const bgMask = new Uint8Array(numPixels);
  const queue = new Int32Array(numPixels);
  let head = 0;
  let tail = 0;

  const trySeed = (x: number, y: number) => {
    const idx = y * width + x;
    if (bgMask[idx] !== 0) return;
    const d = minClusterDist(labPixels[idx]);
    if (d <= baseThresh * 1.25) {
      bgMask[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    if (height > 1) trySeed(x, 1);
  }
  for (let y = 0; y < Math.floor(height * 0.92); y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  const isProtectedSubjectCore = (x: number, y: number): boolean => {
    const nx = (x / width - 0.5) * 2;
    const ny = (y / height - 0.52) * 2;
    const inFaceCore = nx * nx * 6.2 + (ny + 0.14) * (ny + 0.14) * 5.0 < 0.14;
    const inChestCore =
      y > height * 0.84 && Math.abs(nx) < 0.14 && y < height * 0.98;
    return inFaceCore || inChestCore;
  };

  const neighborOffsets = [-1, 1, -width, width];

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = (curr - cx) / width;
    const currLab = labPixels[curr];

    for (let n = 0; n < 4; n++) {
      const next = curr + neighborOffsets[n];
      if (next < 0 || next >= numPixels) continue;
      if (bgMask[next] !== 0) continue;

      const nx = next % width;
      const ny = (next - nx) / width;
      if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;

      const nextLab = labPixels[next];
      const stepDist = labDistanceShadowAware(currLab, nextLab);
      const clusterDist = minClusterDist(nextLab);

      if (isProtectedSubjectCore(nx, ny) && clusterDist > baseThresh * 0.25) {
        continue;
      }

      const hasStrongEdge = edgeMag[next] > edgeBarrierCutoff;
      if (hasStrongEdge && clusterDist > baseThresh * 0.55) {
        continue;
      }

      if (clusterDist <= baseThresh && stepDist <= neighborStepThresh) {
        bgMask[next] = 1;
        queue[tail++] = next;
      }
    }
  }

  const fgMask = new Uint8Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    fgMask[i] = bgMask[i] === 1 ? 0 : 255;
  }

  refineAlphaMatteAndDefringe(data, fgMask, width, height, chokePx, featherRadius);
}
