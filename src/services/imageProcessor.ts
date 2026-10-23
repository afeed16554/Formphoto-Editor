import { BG_TONE_HEX } from '../constants';
import { TransformState } from '../types';
import {
  processSignatureAdaptiveInk,
  refineAlphaMatteAndDefringe,
} from '../utils/bgRemoverCore';
import { resolveOutputDimensions } from '../utils/photoMath';
import { CachedNeuralMatte } from './neuralBgRemover';

export interface ProcessedExportResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  outWidth: number;
  outHeight: number;
  qualityUsed: number;
  hasSourceImage: boolean;
  usedNeuralMatte: boolean;
  isPreClippedAlpha: boolean;
}

/**
 * Loads an image from a local Blob URL or Data URL 100% in the browser.
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Maps a pointer position `(normOutX, normOutY)` in `[0, 1]` on the output canvas
 * back to normalized `(normSrcX, normSrcY)` in `[0, 1]` on the source image,
 * accounting for pan (`offsetX`, `offsetY`), rotation (`rotationDeg`), zoom (`scalePct`),
 * flip, and aspect-ratio fitting.
 */
export function mapOutputPointToSourceNormalized(
  normOutX: number,
  normOutY: number,
  srcW: number,
  srcH: number,
  outWidth: number,
  outHeight: number,
  state: TransformState
): { normX: number; normY: number } | null {
  const pxX = normOutX * outWidth;
  const pxY = normOutY * outHeight;

  const centerX = outWidth / 2 + (state.offsetX / 300) * outWidth;
  const centerY = outHeight / 2 + (state.offsetY / 350) * outHeight;

  let dx = pxX - centerX;
  let dy = pxY - centerY;

  const rad = (-state.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rX = dx * cos - dy * sin;
  const rY = dx * sin + dy * cos;

  const scale = Math.max(0.05, state.scalePct / 100);
  const scaleX = state.flipH ? -scale : scale;
  const scaleY = state.flipV ? -scale : scale;

  const localX = rX / scaleX;
  const localY = rY / scaleY;

  const imgAspect = srcW / Math.max(1, srcH);
  const boxAspect = outWidth / Math.max(1, outHeight);
  let drawW = outWidth;
  let drawH = outHeight;

  if (state.mode === 'signature') {
    if (imgAspect > boxAspect) {
      drawW = outWidth * 0.94;
      drawH = drawW / imgAspect;
    } else {
      drawH = outHeight * 0.88;
      drawW = drawH * imgAspect;
    }
  } else {
    if (imgAspect > boxAspect) {
      drawH = outHeight;
      drawW = outHeight * imgAspect;
    } else {
      drawW = outWidth;
      drawH = outWidth / imgAspect;
    }
  }

  const u = (localX + drawW / 2) / Math.max(1, drawW);
  const v = (localY + drawH / 2) / Math.max(1, drawH);

  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return null;
  }
  return { normX: u, normY: v };
}

/**
 * Helper to apply the exact same spatial crop/pan/rotate/flip transform to the
 * source photo, its cached transparent PNG `ImageBitmap`, or its aligned neural mask canvas.
 */
function drawAlignedToOutputCanvas(
  targetCtx: CanvasRenderingContext2D,
  drawable: CanvasImageSource,
  srcW: number,
  srcH: number,
  outWidth: number,
  outHeight: number,
  state: TransformState
): void {
  targetCtx.save();
  targetCtx.translate(
    outWidth / 2 + (state.offsetX / 300) * outWidth,
    outHeight / 2 + (state.offsetY / 350) * outHeight
  );
  targetCtx.rotate((state.rotationDeg * Math.PI) / 180);
  const scale = state.scalePct / 100;
  targetCtx.scale(
    state.flipH ? -scale : scale,
    state.flipV ? -scale : scale
  );

  const imgAspect = srcW / Math.max(1, srcH);
  const boxAspect = outWidth / Math.max(1, outHeight);
  let drawW = outWidth;
  let drawH = outHeight;

  if (state.mode === 'signature') {
    if (imgAspect > boxAspect) {
      drawW = outWidth * 0.94;
      drawH = drawW / imgAspect;
    } else {
      drawH = outHeight * 0.88;
      drawW = drawH * imgAspect;
    }
  } else {
    if (imgAspect > boxAspect) {
      drawH = outHeight;
      drawW = outHeight * imgAspect;
    } else {
      drawW = outWidth;
      drawH = outWidth / imgAspect;
    }
  }

  targetCtx.drawImage(
    drawable,
    0,
    0,
    srcW,
    srcH,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );
  targetCtx.restore();
}

/**
 * Renders the current TransformState onto an offscreen HTML5 canvas:
 * - In Photo mode with bgRemovalEnabled OR a Pre-Clipped Transparent PNG (`isPreClippedAlpha`):
 *   - Uses ONLY the cached neural matte or pre-clipped PNG alpha channel (never custom RGB/LAB pixel math).
 *   - Always renders the selected Backdrop Fill color (Pure White `#ffffff`, Sky Blue `#38bdf8`, Grey, or Custom)
 *     so transparent PNGs never turn black when exported to JPG.
 *   - Applies boundary-only Edge Choke (-2px..+2px) and Edge Feather (0px..3px) only to the 3px outer silhouette boundary.
 * - In Signature mode: runs O(N) Bradley-Roth Integral-Image Local Adaptive Thresholding
 *   (w = 24, t = 0.14) with "Preserve Original Blue/Black Ink vs. Pure Monochrome Black".
 */
export function renderProcessedOutput(
  state: TransformState,
  sourceImage: HTMLImageElement | null,
  neuralMatte: CachedNeuralMatte | null = null
): ProcessedExportResult {
  const { outWidth, outHeight } = resolveOutputDimensions(
    state.widthPx,
    state.heightPx,
    state.resolutionTier
  );

  const hasSourceImage = Boolean(
    sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0
  );

  if (!hasSourceImage || !sourceImage) {
    return {
      dataUrl: '',
      sizeBytes: 0,
      sizeKb: 0,
      outWidth,
      outHeight,
      qualityUsed: state.qualityPct,
      hasSourceImage: false,
      usedNeuralMatte: false,
      isPreClippedAlpha: false,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl: '',
      sizeBytes: 0,
      sizeKb: 0,
      outWidth,
      outHeight,
      qualityUsed: state.qualityPct,
      hasSourceImage: false,
      usedNeuralMatte: false,
      isPreClippedAlpha: false,
    };
  }

  const bgHex =
    state.bgTone === 'custom' ? state.customBgColor : BG_TONE_HEX[state.bgTone];

  // Fill studio background (White #ffffff, Sky Blue #38bdf8, etc.) unless transparent PNG/WebP is explicitly selected
  if (bgHex !== 'transparent' || state.format === 'image/jpeg') {
    ctx.fillStyle = bgHex === 'transparent' ? '#ffffff' : bgHex;
    ctx.fillRect(0, 0, outWidth, outHeight);
  } else {
    ctx.clearRect(0, 0, outWidth, outHeight);
  }

  let usedNeuralMatte = false;
  const isPreClippedAlpha = Boolean(
    neuralMatte &&
      neuralMatte.sourceSrc === sourceImage.src &&
      neuralMatte.isPreClippedAlpha
  );

  if (state.mode === 'signature') {
    // Signature Mode: O(N) Bradley-Roth Integral-Image Adaptive Thresholding
    const workCanvas = document.createElement('canvas');
    workCanvas.width = outWidth;
    workCanvas.height = outHeight;
    const workCtx = workCanvas.getContext('2d');
    if (workCtx) {
      drawAlignedToOutputCanvas(
        workCtx,
        sourceImage,
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
        outWidth,
        outHeight,
        state
      );
      const imgData = workCtx.getImageData(0, 0, outWidth, outHeight);
      processSignatureAdaptiveInk(
        imgData.data,
        outWidth,
        outHeight,
        state.bgRemovalEnabled,
        state.sigThreshold,
        state.sigInkColorMode ?? (state.sigHighContrast ? 'mono' : 'original'),
        24
      );
      workCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(workCanvas, 0, 0);
    }
  } else if (
    neuralMatte &&
    neuralMatte.sourceSrc === sourceImage.src &&
    (state.bgRemovalEnabled || neuralMatte.isPreClippedAlpha)
  ) {
    // Photo Mode with Cached Neural Matte OR Pre-Clipped Transparent PNG
    usedNeuralMatte = true;
    const chokePx = state.bgChokePx ?? 0;
    const featherPx = state.bgFeather ?? 0;

    if (chokePx === 0 && featherPx === 0) {
      // Fast 60fps direct GPU composite of cached maskCanvas / ImageBitmap over the Backdrop Fill
      drawAlignedToOutputCanvas(
        ctx,
        neuralMatte.maskCanvas,
        neuralMatte.width,
        neuralMatte.height,
        outWidth,
        outHeight,
        state
      );
    } else {
      // Boundary-Only Edge Choke / Defringe (-2px to +2px) + Feather (0px to 3px)
      const workCanvas = document.createElement('canvas');
      workCanvas.width = outWidth;
      workCanvas.height = outHeight;
      const workCtx = workCanvas.getContext('2d');
      if (workCtx) {
        drawAlignedToOutputCanvas(
          workCtx,
          sourceImage,
          sourceImage.naturalWidth,
          sourceImage.naturalHeight,
          outWidth,
          outHeight,
          state
        );
        const imgData = workCtx.getImageData(0, 0, outWidth, outHeight);

        const maskWork = document.createElement('canvas');
        maskWork.width = outWidth;
        maskWork.height = outHeight;
        const maskCtx = maskWork.getContext('2d');
        if (maskCtx) {
          drawAlignedToOutputCanvas(
            maskCtx,
            neuralMatte.maskCanvas,
            neuralMatte.width,
            neuralMatte.height,
            outWidth,
            outHeight,
            state
          );
          const maskImgData = maskCtx.getImageData(0, 0, outWidth, outHeight);
          const numPixels = outWidth * outHeight;
          const baseAlpha = new Uint8Array(numPixels);
          for (let i = 0; i < numPixels; i++) {
            baseAlpha[i] = maskImgData.data[i * 4 + 3];
          }
          refineAlphaMatteAndDefringe(
            imgData.data,
            baseAlpha,
            outWidth,
            outHeight,
            chokePx,
            featherPx
          );
          workCtx.putImageData(imgData, 0, 0);
        }
        ctx.drawImage(workCanvas, 0, 0);
      }
    }
  } else {
    // Photo Mode with BG Cutout OFF or while neural segmentation is actively downloading/computing:
    // Draw aligned original sourceImage over the filled canvas (never run custom RGB pixel math)
    drawAlignedToOutputCanvas(
      ctx,
      sourceImage,
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
      outWidth,
      outHeight,
      state
    );
  }

  // Optional visible Alpha Mask Overlay for inspecting matte quality & manual brush touch-ups
  if (
    state.showMaskOverlay &&
    state.mode === 'photo' &&
    neuralMatte &&
    neuralMatte.sourceSrc === sourceImage.src
  ) {
    const maskWork = document.createElement('canvas');
    maskWork.width = outWidth;
    maskWork.height = outHeight;
    const maskCtx = maskWork.getContext('2d');
    if (maskCtx) {
      drawAlignedToOutputCanvas(
        maskCtx,
        neuralMatte.maskCanvas,
        neuralMatte.width,
        neuralMatte.height,
        outWidth,
        outHeight,
        state
      );
      const maskData = maskCtx.getImageData(0, 0, outWidth, outHeight).data;
      const outImgData = ctx.getImageData(0, 0, outWidth, outHeight);
      const outPixels = outImgData.data;
      const total = outWidth * outHeight;
      for (let i = 0; i < total; i++) {
        const idx = i * 4;
        const a = maskData[idx + 3];
        if (a < 20) {
          // Background region: tint translucent ruby red so stray speckles or erased zones stand out
          outPixels[idx] = Math.round(outPixels[idx] * 0.45 + 225 * 0.55);
          outPixels[idx + 1] = Math.round(outPixels[idx + 1] * 0.45 + 29 * 0.55);
          outPixels[idx + 2] = Math.round(outPixels[idx + 2] * 0.45 + 72 * 0.55);
          outPixels[idx + 3] = 255;
        } else if (a < 235) {
          // Soft transition feather edge: tint sky cyan
          outPixels[idx] = Math.round(outPixels[idx] * 0.4 + 56 * 0.6);
          outPixels[idx + 1] = Math.round(outPixels[idx + 1] * 0.4 + 189 * 0.6);
          outPixels[idx + 2] = Math.round(outPixels[idx + 2] * 0.4 + 248 * 0.6);
          outPixels[idx + 3] = 255;
        } else {
          // Solid foreground silhouette: subtle emerald highlight
          outPixels[idx] = Math.round(outPixels[idx] * 0.84 + 16 * 0.16);
          outPixels[idx + 1] = Math.round(outPixels[idx + 1] * 0.84 + 185 * 0.16);
          outPixels[idx + 2] = Math.round(outPixels[idx + 2] * 0.84 + 129 * 0.16);
          outPixels[idx + 3] = 255;
        }
      }
      ctx.putImageData(outImgData, 0, 0);
    }
  }

  // Encode and binary-search quality to respect targetCapKb
  const capBytes = state.targetCapKb * 1024;
  let bestDataUrl = '';
  let bestQuality = state.qualityPct / 100;

  if (state.format === 'image/png') {
    bestDataUrl = canvas.toDataURL('image/png');
  } else {
    let low = 0.1;
    let high = Math.min(0.98, Math.max(0.25, state.qualityPct / 100));
    bestDataUrl = canvas.toDataURL(state.format, high);
    const currentBytes = getBase64ByteSize(bestDataUrl);

    if (currentBytes > capBytes) {
      for (let iter = 0; iter < 7; iter++) {
        const mid = (low + high) / 2;
        const candidateUrl = canvas.toDataURL(state.format, mid);
        const candidateBytes = getBase64ByteSize(candidateUrl);
        if (candidateBytes <= capBytes) {
          bestDataUrl = candidateUrl;
          bestQuality = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
    }
  }

  const realBytes = getBase64ByteSize(bestDataUrl);
  const actualKb = Math.max(0.5, Number((realBytes / 1024).toFixed(1)));

  return {
    dataUrl: bestDataUrl,
    sizeBytes: realBytes,
    sizeKb: actualKb,
    outWidth,
    outHeight,
    qualityUsed: Math.round(bestQuality * 100),
    hasSourceImage: true,
    usedNeuralMatte,
    isPreClippedAlpha,
  };
}

function getBase64ByteSize(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return 0;
  const base64Length = dataUrl.length - (base64Index + 1);
  return Math.round((base64Length * 3) / 4);
}
