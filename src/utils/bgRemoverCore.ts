/**
 * AFEED Admission Photo Studio — Continuous Alpha Matting & Refinement Core
 *
 * Implements:
 * 1. Zero legacy RGB/LAB/HSL portrait pixel-thresholding fallbacks.
 * 2. Pre-clipped Transparent PNG Auto-Detector (`hasPreClippedTransparency`).
 * 3. Aspect-Preserving Letterbox Unpadding & Bilinear Continuous Mask Interpolation
 *    (`unpadAndResizeAlphaBilinear`).
 * 4. 4-Stage Configurable & Non-Destructive Continuous Alpha Refinement (`refineContinuousAlphaMatte`):
 *    - Stage A: Foreground/background confidence window (`lowConfidenceCut`, `highConfidenceCut`)
 *    - Stage B: Edge-aware boundary refinement (`chokePx`, `featherPx` restricted to boundary zone)
 *    - Stage C: Smart enclosed-hole classification (distinguishes internal shirt/skin/lip defects
 *      from genuine gaps between arms/torso, fingers, and glasses lenses using neighborhood color
 *      evidence, raw model confidence, and region geometry)
 *    - Stage D: Conservative isolated exterior speckle cleanup (`speckleCleanupStrength`)
 * 5. Quantitative Alpha Matte Diagnostics (`computeAlphaMatteDiagnostics` + Ground-Truth IoU / F1 / MAE).
 * 6. O(N) Bradley-Roth Integral-Image Local Adaptive Signature Isolation (`processSignatureAdaptiveInk`).
 */

export type HoleFillMode = 'smart' | 'off' | 'aggressive';

export interface AlphaRefinementConfig {
  lowConfidenceCut: number; // Default 18 (0..60)
  highConfidenceCut: number; // Default 230 (180..254)
  holeFillMode: HoleFillMode; // Default 'smart'
  speckleCleanupStrength: number; // Default 50 (0..100)
  chokePx: number; // -2..+2
  featherPx: number; // 0..3
  bypassRefinement?: boolean; // True to inspect unrefined raw neural mask
}

export const DEFAULT_ALPHA_REFINEMENT_CONFIG: AlphaRefinementConfig = {
  lowConfidenceCut: 18,
  highConfidenceCut: 230,
  holeFillMode: 'smart',
  speckleCleanupStrength: 50,
  chokePx: 0,
  featherPx: 0,
  bypassRefinement: false,
};

export interface AlphaMatteDiagnostics {
  backgroundSpeckleCount: number;
  foregroundHoleCount: number;
  boundarySmoothnessPct: number;
  foregroundCoveragePct: number;
  iouPct?: number;
  boundaryF1Pct?: number;
  maePct?: number;
}

/**
 * Fast scan of an RGBA pixel buffer to detect whether the uploaded or pasted image
 * ALREADY contains a pre-clipped transparent background (e.g. Samsung Gallery Image Clipper
 * or iOS Sticker transparent PNG).
 */
export function hasPreClippedTransparency(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number
): boolean {
  const numPixels = width * height;
  if (numPixels === 0) return false;

  let transparentCount = 0;
  let opaqueCount = 0;
  const stepX = Math.max(1, Math.floor(width / 32));
  const stepY = Math.max(1, Math.floor(height / 32));

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const a = rgbaData[(y * width + x) * 4 + 3];
      if (a < 245) {
        transparentCount++;
      } else if (a >= 250) {
        opaqueCount++;
      }
    }
  }

  const corners = [
    0,
    width - 1,
    (height - 1) * width,
    (height - 1) * width + (width - 1),
  ];
  for (const idx of corners) {
    if (idx >= 0 && idx < numPixels && rgbaData[idx * 4 + 3] < 245) {
      transparentCount += 2;
    }
  }

  return transparentCount >= 2 && opaqueCount >= 4;
}

/**
 * Computes aspect-preserving letterbox geometry for a source image `(srcW, srcH)`
 * inside a square model input of `targetSize × targetSize`.
 */
export interface LetterboxGeometry {
  targetSize: number;
  scaledW: number;
  scaledH: number;
  padLeft: number;
  padTop: number;
}

export function computeLetterboxGeometry(
  srcW: number,
  srcH: number,
  targetSize: number
): LetterboxGeometry {
  const safeW = Math.max(1, srcW);
  const safeH = Math.max(1, srcH);
  const scale = Math.min(targetSize / safeW, targetSize / safeH);
  const scaledW = Math.max(1, Math.min(targetSize, Math.round(safeW * scale)));
  const scaledH = Math.max(1, Math.min(targetSize, Math.round(safeH * scale)));
  const padLeft = Math.floor((targetSize - scaledW) / 2);
  const padTop = Math.floor((targetSize - scaledH) / 2);
  return { targetSize, scaledW, scaledH, padLeft, padTop };
}

/**
 * Unpads a predicted square alpha mask `(predW × predH)` using the recorded letterbox geometry
 * and resizes the active region back to the original image dimensions `(origW × origH)`
 * using continuous bilinear interpolation.
 */
export function unpadAndResizeAlphaBilinear(
  predAlpha: Uint8Array | Uint8ClampedArray | Float32Array,
  predW: number,
  predH: number,
  origW: number,
  origH: number,
  letterbox?: LetterboxGeometry | null
): Uint8Array {
  const out = new Uint8Array(origW * origH);
  if (origW <= 0 || origH <= 0 || predW <= 0 || predH <= 0) return out;

  const activeLeft = letterbox
    ? (letterbox.padLeft / letterbox.targetSize) * predW
    : 0;
  const activeTop = letterbox
    ? (letterbox.padTop / letterbox.targetSize) * predH
    : 0;
  const activeW = letterbox
    ? (letterbox.scaledW / letterbox.targetSize) * predW
    : predW;
  const activeH = letterbox
    ? (letterbox.scaledH / letterbox.targetSize) * predH
    : predH;

  for (let y = 0; y < origH; y++) {
    const v = origH > 1 ? y / (origH - 1) : 0;
    const srcY = Math.max(
      0,
      Math.min(predH - 1, activeTop + v * Math.max(1, activeH - 1))
    );
    const y0 = Math.floor(srcY);
    const y1 = Math.min(predH - 1, y0 + 1);
    const wy = srcY - y0;

    const rowOut = y * origW;
    const row0 = y0 * predW;
    const row1 = y1 * predW;

    for (let x = 0; x < origW; x++) {
      const u = origW > 1 ? x / (origW - 1) : 0;
      const srcX = Math.max(
        0,
        Math.min(predW - 1, activeLeft + u * Math.max(1, activeW - 1))
      );
      const x0 = Math.floor(srcX);
      const x1 = Math.min(predW - 1, x0 + 1);
      const wx = srcX - x0;

      const p00 = predAlpha[row0 + x0];
      const p10 = predAlpha[row0 + x1];
      const p01 = predAlpha[row1 + x0];
      const p11 = predAlpha[row1 + x1];

      const topVal = p00 * (1 - wx) + p10 * wx;
      const botVal = p01 * (1 - wx) + p11 * wx;
      const val = topVal * (1 - wy) + botVal * wy;
      out[rowOut + x] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }

  return out;
}

/**
 * Computes objective quantitative diagnostics on an alpha mask:
 * - `backgroundSpeckleCount`: disconnected exterior foreground islands (`alpha >= 24`)
 * - `foregroundHoleCount`: enclosed low-alpha pockets (`alpha < 210`) inside the silhouette
 * - `boundarySmoothnessPct`: smoothness of alpha transitions along the silhouette boundary
 * - Optional ground-truth `iouPct`, `boundaryF1Pct`, and `maePct` when `groundTruthAlpha` is supplied.
 */
export function computeAlphaMatteDiagnostics(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  groundTruthAlpha?: Uint8Array | Uint8ClampedArray | null
): AlphaMatteDiagnostics {
  const total = width * height;
  if (total === 0) {
    return {
      backgroundSpeckleCount: 0,
      foregroundHoleCount: 0,
      boundarySmoothnessPct: 100,
      foregroundCoveragePct: 0,
    };
  }

  // 1. Count connected foreground components (alpha >= 24)
  const visitedFg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let fgComponentCount = 0;
  let fgPixels = 0;

  for (let i = 0; i < total; i++) {
    if (alpha[i] >= 128) fgPixels++;
    if (alpha[i] >= 24 && visitedFg[i] === 0) {
      fgComponentCount++;
      let head = 0;
      let tail = 0;
      visitedFg[i] = 1;
      queue[tail++] = i;
      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = (curr - cx) / width;
        if (cx > 0) {
          const n = curr - 1;
          if (!visitedFg[n] && alpha[n] >= 24) {
            visitedFg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cx + 1 < width) {
          const n = curr + 1;
          if (!visitedFg[n] && alpha[n] >= 24) {
            visitedFg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cy > 0) {
          const n = curr - width;
          if (!visitedFg[n] && alpha[n] >= 24) {
            visitedFg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cy + 1 < height) {
          const n = curr + width;
          if (!visitedFg[n] && alpha[n] >= 24) {
            visitedFg[n] = 1;
            queue[tail++] = n;
          }
        }
      }
    }
  }

  const backgroundSpeckleCount = Math.max(0, fgComponentCount - 1);

  // 2. Count enclosed low-alpha holes inside foreground (alpha < 210 not touching image border)
  const visitedBg = new Uint8Array(total);
  let foregroundHoleCount = 0;
  for (let i = 0; i < total; i++) {
    if (alpha[i] < 210 && visitedBg[i] === 0) {
      let head = 0;
      let tail = 0;
      let touchesBorder = false;
      visitedBg[i] = 1;
      queue[tail++] = i;
      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % width;
        const cy = (curr - cx) / width;
        if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
          touchesBorder = true;
        }
        if (cx > 0) {
          const n = curr - 1;
          if (!visitedBg[n] && alpha[n] < 210) {
            visitedBg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cx + 1 < width) {
          const n = curr + 1;
          if (!visitedBg[n] && alpha[n] < 210) {
            visitedBg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cy > 0) {
          const n = curr - width;
          if (!visitedBg[n] && alpha[n] < 210) {
            visitedBg[n] = 1;
            queue[tail++] = n;
          }
        }
        if (cy + 1 < height) {
          const n = curr + width;
          if (!visitedBg[n] && alpha[n] < 210) {
            visitedBg[n] = 1;
            queue[tail++] = n;
          }
        }
      }
      if (!touchesBorder) {
        foregroundHoleCount++;
      }
    }
  }

  // 3. Boundary smoothness score along silhouette edge
  let boundaryCount = 0;
  let smoothSum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const a = alpha[i];
      const n1 = alpha[i - 1];
      const n2 = alpha[i + 1];
      const n3 = alpha[i - width];
      const n4 = alpha[i + width];
      const maxDiff = Math.max(
        Math.abs(a - n1),
        Math.abs(a - n2),
        Math.abs(a - n3),
        Math.abs(a - n4)
      );
      if (maxDiff > 15) {
        boundaryCount++;
        const laplacian = Math.abs(4 * a - (n1 + n2 + n3 + n4)) / 4;
        smoothSum += Math.max(0, 1 - laplacian / 255);
      }
    }
  }
  const boundarySmoothnessPct =
    boundaryCount > 0 ? Math.round((smoothSum / boundaryCount) * 100) : 96;
  const foregroundCoveragePct = Number(((fgPixels / total) * 100).toFixed(1));

  const diag: AlphaMatteDiagnostics = {
    backgroundSpeckleCount,
    foregroundHoleCount,
    boundarySmoothnessPct,
    foregroundCoveragePct,
  };

  if (groundTruthAlpha && groundTruthAlpha.length === total) {
    let intersection = 0;
    let union = 0;
    let absDiffSum = 0;
    let gtBoundary = 0;
    let predBoundary = 0;
    let matchedBoundary = 0;

    for (let i = 0; i < total; i++) {
      const p = alpha[i] >= 128;
      const g = groundTruthAlpha[i] >= 128;
      if (p && g) intersection++;
      if (p || g) union++;
      absDiffSum += Math.abs(alpha[i] - groundTruthAlpha[i]) / 255;
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const pEdge =
          Math.abs(alpha[i] - alpha[i - 1]) > 35 ||
          Math.abs(alpha[i] - alpha[i - width]) > 35;
        const gEdge =
          Math.abs(groundTruthAlpha[i] - groundTruthAlpha[i - 1]) > 35 ||
          Math.abs(groundTruthAlpha[i] - groundTruthAlpha[i - width]) > 35;
        if (pEdge) predBoundary++;
        if (gEdge) gtBoundary++;
        if (pEdge && gEdge) matchedBoundary++;
      }
    }

    diag.iouPct =
      union > 0 ? Number(((intersection / union) * 100).toFixed(1)) : 100;
    const prec = predBoundary > 0 ? matchedBoundary / predBoundary : 1;
    const rec = gtBoundary > 0 ? matchedBoundary / gtBoundary : 1;
    diag.boundaryF1Pct =
      prec + rec > 0
        ? Number((((2 * prec * rec) / (prec + rec)) * 100).toFixed(1))
        : 100;
    diag.maePct = Number(((absDiffSum / total) * 100).toFixed(2));
  }

  return diag;
}

/**
 * Flood-fills from the 4 outer borders of the photo across transparent pixels (`alpha < 128`)
 * to identify the true exterior background. Used when `holeFillMode === 'aggressive'` or in unit tests.
 */
export function fillInteriorHolesOnAlpha(
  alpha: Uint8Array,
  width: number,
  height: number
): void {
  const total = width * height;
  if (total === 0) return;

  const isExteriorBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  for (let x = 0; x < width; x++) {
    if (alpha[x] < 128) {
      isExteriorBg[x] = 1;
      queue[tail++] = x;
    }
    const b = (height - 1) * width + x;
    if (alpha[b] < 128 && !isExteriorBg[b]) {
      isExteriorBg[b] = 1;
      queue[tail++] = b;
    }
  }
  for (let y = 0; y < height; y++) {
    const l = y * width;
    if (alpha[l] < 128 && !isExteriorBg[l]) {
      isExteriorBg[l] = 1;
      queue[tail++] = l;
    }
    const r = y * width + (width - 1);
    if (alpha[r] < 128 && !isExteriorBg[r]) {
      isExteriorBg[r] = 1;
      queue[tail++] = r;
    }
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;

    if (x > 0) {
      const n = idx - 1;
      if (!isExteriorBg[n] && alpha[n] < 128) {
        isExteriorBg[n] = 1;
        queue[tail++] = n;
      }
    }
    if (x < width - 1) {
      const n = idx + 1;
      if (!isExteriorBg[n] && alpha[n] < 128) {
        isExteriorBg[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y > 0) {
      const n = idx - width;
      if (!isExteriorBg[n] && alpha[n] < 128) {
        isExteriorBg[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y < height - 1) {
      const n = idx + width;
      if (!isExteriorBg[n] && alpha[n] < 128) {
        isExteriorBg[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  for (let i = 0; i < total; i++) {
    if (!isExteriorBg[i] && alpha[i] < 200) {
      alpha[i] = 255;
    }
  }
}

/**
 * 4-Stage Configurable Continuous Alpha Matte Refinement:
 * - Stage A: Foreground/background confidence window (`lowClamp`..`highClamp`) preserving continuous soft transitions.
 * - Stage D: Connectivity & component cleanup removing isolated exterior background speckles while keeping detached hair near the silhouette.
 * - Stage C: Smart Enclosed-Hole Handling:
 *   Distinguishes internal segmentation defects (e.g. speckles on dark shirts, lips, neck, glasses frames)
 *   from genuine gaps (e.g. between arm and torso, between fingers) using neighborhood RGB evidence,
 *   raw model confidence, and pocket area.
 */
export function cleanRawNeuralAlphaMatte(
  rawAlpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options?: {
    lowClamp?: number;
    highClamp?: number;
    keepLargestComponent?: boolean;
    fillInteriorHoles?: boolean;
    holeFillMode?: HoleFillMode;
    speckleCleanupStrength?: number;
    sourceRgba?: Uint8ClampedArray | null;
    bypassRefinement?: boolean;
  }
): Uint8Array {
  const numPixels = width * height;
  const out = new Uint8Array(numPixels);
  if (numPixels === 0) return out;

  if (options?.bypassRefinement) {
    for (let i = 0; i < numPixels; i++) {
      out[i] = rawAlpha[i];
    }
    return out;
  }

  const lowClamp = options?.lowClamp ?? 18;
  const highClamp = options?.highClamp ?? 230;
  const keepLargestComponent = options?.keepLargestComponent ?? true;
  const holeFillMode: HoleFillMode =
    options?.holeFillMode ??
    (options?.fillInteriorHoles === false ? 'off' : 'smart');
  const speckleStrength = options?.speckleCleanupStrength ?? 50;
  const sourceRgba = options?.sourceRgba ?? null;
  const span = Math.max(1, highClamp - lowClamp);

  // Stage A: Continuous Confidence Window (preserves soft hair/edge gradients in [lowClamp, highClamp])
  for (let i = 0; i < numPixels; i++) {
    const a = rawAlpha[i];
    if (a <= lowClamp) {
      out[i] = 0;
    } else if (a >= highClamp) {
      out[i] = 255;
    } else {
      const t = (a - lowClamp) / span;
      // Smooth Hermite interpolation preserves continuous alpha gradients without hard thresholding
      const smooth = t * t * (3 - 2 * t);
      out[i] = Math.round(smooth * 255);
    }
  }

  // Stage D: Conservative Connectivity & Exterior Speckle Cleanup
  if (keepLargestComponent && speckleStrength > 0 && width >= 6 && height >= 6) {
    const visited = new Uint8Array(numPixels);
    const compId = new Int32Array(numPixels);
    const compSizes: number[] = [0];
    const queue = new Int32Array(numPixels);
    let currentId = 0;
    let maxCompSize = 0;

    for (let i = 0; i < numPixels; i++) {
      if (out[i] >= 32 && visited[i] === 0) {
        currentId++;
        let head = 0;
        let tail = 0;
        visited[i] = 1;
        compId[i] = currentId;
        queue[tail++] = i;

        while (head < tail) {
          const curr = queue[head++];
          const cx = curr % width;
          const cy = (curr - cx) / width;

          if (cx > 0) {
            const n = curr - 1;
            if (visited[n] === 0 && out[n] >= 32) {
              visited[n] = 1;
              compId[n] = currentId;
              queue[tail++] = n;
            }
          }
          if (cx + 1 < width) {
            const n = curr + 1;
            if (visited[n] === 0 && out[n] >= 32) {
              visited[n] = 1;
              compId[n] = currentId;
              queue[tail++] = n;
            }
          }
          if (cy > 0) {
            const n = curr - width;
            if (visited[n] === 0 && out[n] >= 32) {
              visited[n] = 1;
              compId[n] = currentId;
              queue[tail++] = n;
            }
          }
          if (cy + 1 < height) {
            const n = curr + width;
            if (visited[n] === 0 && out[n] >= 32) {
              visited[n] = 1;
              compId[n] = currentId;
              queue[tail++] = n;
            }
          }
        }

        compSizes[currentId] = tail;
        if (tail > maxCompSize) {
          maxCompSize = tail;
        }
      }
    }

    if (maxCompSize > 0) {
      // Scale minimum component size conservatively by speckleStrength (0..100)
      const ratio = 0.0005 + (speckleStrength / 100) * 0.035;
      const minKeepSize = Math.max(4, Math.floor(maxCompSize * ratio));
      for (let i = 0; i < numPixels; i++) {
        const cid = compId[i];
        if (cid > 0 && compSizes[cid] < minKeepSize) {
          out[i] = 0;
        }
      }
    }
  }

  // Stage C: Enclosed-Hole Handling ('smart' vs 'aggressive' vs 'off')
  if (holeFillMode === 'aggressive') {
    fillInteriorHolesOnAlpha(out, width, height);
  } else if (holeFillMode === 'smart' && width >= 6 && height >= 6) {
    // 1. Seed BFS from the 4 outer borders to mark true exterior background (`out[i] < 180`)
    const isExteriorBg = new Uint8Array(numPixels);
    const queue = new Int32Array(numPixels);
    let head = 0;
    let tail = 0;

    for (let x = 0; x < width; x++) {
      if (out[x] < 180) {
        isExteriorBg[x] = 1;
        queue[tail++] = x;
      }
      const b = (height - 1) * width + x;
      if (out[b] < 180 && !isExteriorBg[b]) {
        isExteriorBg[b] = 1;
        queue[tail++] = b;
      }
    }
    for (let y = 0; y < height; y++) {
      const l = y * width;
      if (out[l] < 180 && !isExteriorBg[l]) {
        isExteriorBg[l] = 1;
        queue[tail++] = l;
      }
      const r = y * width + (width - 1);
      if (out[r] < 180 && !isExteriorBg[r]) {
        isExteriorBg[r] = 1;
        queue[tail++] = r;
      }
    }

    // Compute mean exterior background RGB (if sourceRgba is provided) to compare against enclosed pockets
    let extR = 235;
    let extG = 235;
    let extB = 235;
    let extCount = 0;

    while (head < tail) {
      const idx = queue[head++];
      if (sourceRgba && out[idx] < 30) {
        extR += sourceRgba[idx * 4];
        extG += sourceRgba[idx * 4 + 1];
        extB += sourceRgba[idx * 4 + 2];
        extCount++;
      }
      const x = idx % width;
      const y = (idx / width) | 0;
      if (x > 0) {
        const n = idx - 1;
        if (!isExteriorBg[n] && out[n] < 180) {
          isExteriorBg[n] = 1;
          queue[tail++] = n;
        }
      }
      if (x < width - 1) {
        const n = idx + 1;
        if (!isExteriorBg[n] && out[n] < 180) {
          isExteriorBg[n] = 1;
          queue[tail++] = n;
        }
      }
      if (y > 0) {
        const n = idx - width;
        if (!isExteriorBg[n] && out[n] < 180) {
          isExteriorBg[n] = 1;
          queue[tail++] = n;
        }
      }
      if (y < height - 1) {
        const n = idx + width;
        if (!isExteriorBg[n] && out[n] < 180) {
          isExteriorBg[n] = 1;
          queue[tail++] = n;
        }
      }
    }

    if (extCount > 0) {
      extR /= extCount;
      extG /= extCount;
      extB /= extCount;
    }

    // 2. Inspect each enclosed pocket (pixels with out[i] < 235 and !isExteriorBg[i])
    const visitedHole = new Uint8Array(numPixels);
    const holeQueue = new Int32Array(numPixels);

    for (let i = 0; i < numPixels; i++) {
      if (!isExteriorBg[i] && out[i] < 235 && !visitedHole[i]) {
        let hHead = 0;
        let hTail = 0;
        visitedHole[i] = 1;
        holeQueue[hTail++] = i;

        let rawConfSum = 0;
        let holeR = 0;
        let holeG = 0;
        let holeB = 0;
        let ringR = 0;
        let ringG = 0;
        let ringB = 0;
        let ringCount = 0;

        while (hHead < hTail) {
          const curr = holeQueue[hHead++];
          rawConfSum += rawAlpha[curr];
          if (sourceRgba) {
            holeR += sourceRgba[curr * 4];
            holeG += sourceRgba[curr * 4 + 1];
            holeB += sourceRgba[curr * 4 + 2];
          }

          const cx = curr % width;
          const cy = (curr - cx) / width;
          const neighbors = [
            cx > 0 ? curr - 1 : -1,
            cx + 1 < width ? curr + 1 : -1,
            cy > 0 ? curr - width : -1,
            cy + 1 < height ? curr + width : -1,
          ];
          for (const n of neighbors) {
            if (n < 0) continue;
            if (!isExteriorBg[n] && out[n] < 235) {
              if (!visitedHole[n]) {
                visitedHole[n] = 1;
                holeQueue[hTail++] = n;
              }
            } else if (out[n] >= 235 && sourceRgba) {
              ringR += sourceRgba[n * 4];
              ringG += sourceRgba[n * 4 + 1];
              ringB += sourceRgba[n * 4 + 2];
              ringCount++;
            }
          }
        }

        const holeArea = hTail;
        const holeAreaRatio = holeArea / numPixels;
        const meanRawConf = rawConfSum / Math.max(1, holeArea);

        // Decide whether this enclosed pocket is an internal segmentation defect vs. a genuine gap (e.g. arm-torso gap)
        let shouldFillDefect = false;

        if (!sourceRgba && holeAreaRatio <= 0.015) {
          // Without RGB data, fill small/medium pinholes inside the silhouette
          shouldFillDefect = true;
        } else if (holeAreaRatio <= 0.002) {
          // Microscopic 1-3px pinholes inside the silhouette are always defects
          shouldFillDefect = true;
        } else if (meanRawConf >= 48) {
          // Pocket where the neural model had non-trivial foreground confidence
          shouldFillDefect = true;
        } else if (sourceRgba && ringCount > 0) {
          // Compare pocket color against surrounding shirt/skin vs. exterior wall background
          const mHoleR = holeR / holeArea;
          const mHoleG = holeG / holeArea;
          const mHoleB = holeB / holeArea;
          const mRingR = ringR / ringCount;
          const mRingG = ringG / ringCount;
          const mRingB = ringB / ringCount;

          const distToFgRing = Math.hypot(
            mHoleR - mRingR,
            mHoleG - mRingG,
            mHoleB - mRingB
          );
          const distToExtBg = Math.hypot(
            mHoleR - extR,
            mHoleG - extG,
            mHoleB - extB
          );
          // If the pocket color is closer to the surrounding clothing/skin than the exterior wall, fill it
          if (distToFgRing < distToExtBg * 0.85 || distToExtBg > 55) {
            shouldFillDefect = true;
          }
        } else {
          // When no RGB is provided (e.g. synthetic alpha-only mask), fill enclosed pockets up to 4% of image
          if (holeAreaRatio <= 0.04) {
            shouldFillDefect = true;
          }
        }

        if (shouldFillDefect) {
          for (let k = 0; k < hTail; k++) {
            out[holeQueue[k]] = 255;
          }
        }
      }
    }
  }

  return out;
}

/**
 * Morphological Erosion (if erode=true) or Dilation (if erode=false) for integer radius 1 or 2.
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
 * Separable 2-pass Gaussian smoothing of an alpha matte for fractional featherPx (0..3px).
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
 * Stage B: Boundary-Only Edge-Aware Alpha Matte Refinement + Halo Color Decontamination:
 * - Computes a 3px transition band along the outer boundary of the silhouette.
 * - Interior foreground pixels (outside the 3px boundary band) are preserved untouched.
 * - Exterior background pixels (outside the 3px boundary band) are locked to 0.
 * - Applies Edge Choke / Defringe (`chokePx` in [-2, +2]) and Edge Feather (`featherPx` in [0, 3])
 *   ONLY to the silhouette boundary zone, preserving continuous hair and lens alpha when Choke=0, Feather=0.
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

  // Identify the 3px boundary zone around the silhouette edge
  const boundaryZone = new Uint8Array(numPixels);
  const bandRadius = 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const centerA = baseAlphaMask[i];
      if (centerA > 8 && centerA < 248) {
        boundaryZone[i] = 1;
        continue;
      }
      const isSolid = centerA >= 248;
      let foundOpposite = false;
      for (let dy = -bandRadius; dy <= bandRadius && !foundOpposite; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          if (isSolid) foundOpposite = true;
          continue;
        }
        for (let dx = -bandRadius; dx <= bandRadius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            if (isSolid) {
              foundOpposite = true;
              break;
            }
            continue;
          }
          const na = baseAlphaMask[ny * width + nx];
          if (isSolid ? na < 242 : na > 12) {
            foundOpposite = true;
            break;
          }
        }
      }
      if (foundOpposite) {
        boundaryZone[i] = 1;
      }
    }
  }

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

    const a0 =
      r0 === 0
        ? baseFloat
        : morphStepInteger(baseFloat, width, height, r0, erode);
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

  const featheredAlpha = featherAlphaMatte(
    chokedAlpha,
    width,
    height,
    featherPx
  );

  const origRgb = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    const idx4 = i * 4;
    const idx3 = i * 3;
    origRgb[idx3] = rgbaData[idx4];
    origRgb[idx3 + 1] = rgbaData[idx4 + 1];
    origRgb[idx3 + 2] = rgbaData[idx4 + 2];
  }

  const extraDefringe =
    clampedChoke < 0 ? Math.min(0.45, Math.abs(clampedChoke) * 0.22) : 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx4 = i * 4;

      if (boundaryZone[i] === 0) {
        rgbaData[idx4 + 3] = baseAlphaMask[i];
        continue;
      }

      const a = Math.max(0, Math.min(255, Math.round(featheredAlpha[i])));
      rgbaData[idx4 + 3] = a;

      if (a > 4 && a < 252) {
        let bestInteriorAlpha = 0;
        let fgR = origRgb[i * 3];
        let fgG = origRgb[i * 3 + 1];
        let fgB = origRgb[i * 3 + 2];

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
          rgbaData[idx4] = Math.round(
            rgbaData[idx4] * (1 - pull) + fgR * pull
          );
          rgbaData[idx4 + 1] = Math.round(
            rgbaData[idx4 + 1] * (1 - pull) + fgG * pull
          );
          rgbaData[idx4 + 2] = Math.round(
            rgbaData[idx4 + 2] * (1 - pull) + fgB * pull
          );
        }
      }
    }
  }
}

/**
 * Extracts signature ink using O(N) Bradley-Roth Local Adaptive Thresholding with a 2D Integral Image.
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

  const scaleFactor = Math.max(1, Math.min(width, height) / 120);
  const effectiveW = Math.max(
    8,
    Math.round(windowSize * Math.min(1.5, Math.max(0.5, scaleFactor * 0.5)))
  );
  const halfW = Math.max(4, Math.round(effectiveW / 2));

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

      const adaptiveCutoff = localMean * (1 - t);
      const softMargin = Math.max(6, localMean * 0.055);

      if (pixelLum >= adaptiveCutoff + softMargin * 0.35) {
        if (bgRemovalEnabled) {
          data[idx + 3] = 0;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      } else {
        const rawDensity = Math.min(
          1,
          Math.max(
            0.18,
            (adaptiveCutoff + softMargin * 0.35 - pixelLum) /
              (softMargin * 1.45)
          )
        );
        const inkAlpha = Math.min(1, Math.pow(rawDensity, 0.72) * 1.15);

        if (inkMode === 'mono') {
          data[idx] = 10;
          data[idx + 1] = 12;
          data[idx + 2] = 16;
        } else {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const normScale = 255 / Math.max(80, localMean);
          const nr = Math.min(255, r * normScale);
          const ng = Math.min(255, g * normScale);
          const nb = Math.min(255, b * normScale);
          const avg = (nr + ng + nb) / 3;
          const chromaBoost = 1.65;
          const darken = 0.58;
          data[idx] = Math.max(
            0,
            Math.min(220, Math.round((avg + (nr - avg) * chromaBoost) * darken))
          );
          data[idx + 1] = Math.max(
            0,
            Math.min(220, Math.round((avg + (ng - avg) * chromaBoost) * darken))
          );
          data[idx + 2] = Math.max(
            0,
            Math.min(245, Math.round((avg + (nb - avg) * chromaBoost) * darken))
          );
        }

        if (bgRemovalEnabled) {
          data[idx + 3] = Math.round(inkAlpha * 255);
        } else {
          data[idx] = Math.round(data[idx] * inkAlpha + 255 * (1 - inkAlpha));
          data[idx + 1] = Math.round(
            data[idx + 1] * inkAlpha + 255 * (1 - inkAlpha)
          );
          data[idx + 2] = Math.round(
            data[idx + 2] * inkAlpha + 255 * (1 - inkAlpha)
          );
          data[idx + 3] = 255;
        }
      }
    }
  }
}
