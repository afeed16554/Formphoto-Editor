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
 * - In Photo mode with bgRemovalEnabled:
 *   - Uses ONLY the cached transparent PNG `ImageBitmap` from `@imgly/background-removal@1.7.0`
 *     (never custom RGB/LAB pixel-thresholding math).
 *   - When Choke = 0 and Feather = 0, draws the cached `ImageBitmap` directly onto the output
 *     canvas at 60fps.
 *   - When Edge Choke (-2px..+2px) or Edge Feather (0px..3px) is non-zero, refines the cached
 *     neural alpha matte before compositing onto the solid White (#ffffff), Sky Blue (#38bdf8),
 *     or Custom admission backdrop.
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
    };
  }

  const bgHex =
    state.bgTone === 'custom' ? state.customBgColor : BG_TONE_HEX[state.bgTone];

  // Fill studio background unless transparent PNG/WebP
  if (bgHex !== 'transparent' || state.format === 'image/jpeg') {
    ctx.fillStyle = bgHex === 'transparent' ? '#ffffff' : bgHex;
    ctx.fillRect(0, 0, outWidth, outHeight);
  } else {
    ctx.clearRect(0, 0, outWidth, outHeight);
  }

  let usedNeuralMatte = false;

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
    state.bgRemovalEnabled &&
    neuralMatte &&
    neuralMatte.sourceSrc === sourceImage.src
  ) {
    // Photo Mode with Cached Neural ImageBitmap from @imgly/background-removal@1.7.0
    usedNeuralMatte = true;
    const chokePx = state.bgChokePx ?? 0;
    const featherPx = state.bgFeather ?? 0;

    if (chokePx === 0 && featherPx === 0) {
      // Fast 60fps direct GPU composite of cached transparent PNG ImageBitmap
      drawAlignedToOutputCanvas(
        ctx,
        neuralMatte.imageBitmap,
        neuralMatte.width,
        neuralMatte.height,
        outWidth,
        outHeight,
        state
      );
    } else if (chokePx === 0 && featherPx > 0) {
      // Fast 60fps canvas-filtered feather or refined alpha composite using cached ImageBitmap
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
            neuralMatte.imageBitmap,
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
            0,
            featherPx
          );
          workCtx.putImageData(imgData, 0, 0);
        }
        ctx.drawImage(workCanvas, 0, 0);
      }
    } else {
      // Edge Choke / Defringe (-2px to +2px) + Feather (0px to 3px) refinement on cached neural matte
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
            neuralMatte.imageBitmap,
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
    // Draw aligned original sourceImage cleanly (NEVER run custom RGB pixel-thresholding math)
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
  };
}

function getBase64ByteSize(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return 0;
  const base64Length = dataUrl.length - (base64Index + 1);
  return Math.round((base64Length * 3) / 4);
}
