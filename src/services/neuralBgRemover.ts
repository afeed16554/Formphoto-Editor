import {
  AlphaMatteDiagnostics,
  AlphaRefinementConfig,
  cleanRawNeuralAlphaMatte,
  computeAlphaMatteDiagnostics,
  computeLetterboxGeometry,
  DEFAULT_ALPHA_REFINEMENT_CONFIG,
  hasPreClippedTransparency,
  LetterboxGeometry,
  unpadAndResizeAlphaBilinear,
} from '../utils/bgRemoverCore';

/**
 * AFEED Admission Photo Studio — Verified Neural Segmentation & Continuous Alpha Engine
 *
 * - Uses `@huggingface/transformers@3.1.2` with verified model/processor configurations:
 *   1) `briaai/RMBG-1.4` (1024×1024 input with aspect-preserving letterbox unpadding)
 *   2) `Xenova/modnet` (512×512 portrait matting with aspect-preserving letterbox unpadding)
 *   3) `@imgly/background-removal@1.7.0` (`publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'`)
 * - Never silently switches models or falls back to pixel-color heuristics.
 * - Preserves `rawAlphaMask` separately from `alphaMask` so all refinement stages
 *   (confidence thresholds, smart hole fill, speckle cleanup) and manual Touch-Up Brush strokes
 *   have full Undo / Redo / Reset support without re-running neural inference.
 */

export type NeuralMattingStatus =
  | 'idle'
  | 'preclipped'
  | 'downloading'
  | 'inferring'
  | 'ready'
  | 'error';

export type NeuralModelTier = 'rmbg_14' | 'modnet' | 'imgly_medium';

export interface RuntimeMattingDiagnostics {
  activeModelId: string;
  modelVersion: string;
  inferenceBackend: string;
  status: NeuralMattingStatus;
  inferenceDurationMs: number;
  sourceWidth: number;
  sourceHeight: number;
  rawDiagnostics: AlphaMatteDiagnostics | null;
  refinedDiagnostics: AlphaMatteDiagnostics | null;
  errorMessage: string | null;
}

export interface NeuralMattingProgress {
  status: NeuralMattingStatus;
  progressPct: number;
  stageLabel: string;
  detailText: string;
  cachedInIndexedDB: boolean;
  engineName: string;
  modelTier: NeuralModelTier;
  isPreClippedAlpha?: boolean;
  diagnostics: RuntimeMattingDiagnostics;
}

export interface CachedNeuralMatte {
  sourceSrc: string;
  modelTier: NeuralModelTier;
  imageBitmap: ImageBitmap | HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  rawAlphaMask: Uint8Array; // Unmodified continuous neural output (or original PNG alpha)
  refinedBaseAlpha: Uint8Array; // Output after configurable 4-stage refinement
  alphaMask: Uint8Array; // Output after manual Touch-Up Brush strokes
  undoStack: Uint8Array[];
  redoStack: Uint8Array[];
  sourceRgba: Uint8ClampedArray;
  width: number;
  height: number;
  engineName: string;
  isPreClippedAlpha: boolean;
  diagnostics: RuntimeMattingDiagnostics;
}

type ProgressListener = (state: NeuralMattingProgress) => void;

const TRANSFORMERS_CDN_URL =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2';
const IMGLY_ESM_URL =
  'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
const IMGLY_PUBLIC_PATH =
  'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';

const dynamicImportEsm = new Function(
  'moduleUrl',
  'return import(moduleUrl)'
) as (moduleUrl: string) => Promise<Record<string, any>>;

let cachedMatte: CachedNeuralMatte | null = null;
let activeJobKey: string | null = null;
let modelWeightsCachedInSession = false;
let currentRefinementConfig: AlphaRefinementConfig = {
  ...DEFAULT_ALPHA_REFINEMENT_CONFIG,
};

const loadedTransformersPipelines = new Map<
  string,
  { model: any; processor: any; backendUsed: string }
>();
const listeners = new Set<ProgressListener>();

export const MODEL_LABELS: Record<NeuralModelTier, string> = {
  rmbg_14: 'briaai/RMBG-1.4 (1024px Studio AI)',
  modnet: 'Xenova/modnet (Portrait Matting AI)',
  imgly_medium: 'IMG.LY ISNet Medium (ONNX)',
};

const INITIAL_DIAGNOSTICS: RuntimeMattingDiagnostics = {
  activeModelId: 'briaai/RMBG-1.4',
  modelVersion: '@huggingface/transformers@3.1.2',
  inferenceBackend:
    typeof navigator !== 'undefined' && (navigator as any).gpu
      ? 'webgpu (ready)'
      : 'wasm (1-thread)',
  status: 'idle',
  inferenceDurationMs: 0,
  sourceWidth: 0,
  sourceHeight: 0,
  rawDiagnostics: null,
  refinedDiagnostics: null,
  errorMessage: null,
};

let currentProgress: NeuralMattingProgress = {
  status: 'idle',
  progressPct: 0,
  stageLabel: 'Neural Portrait AI Ready',
  detailText: 'briaai/RMBG-1.4 & Xenova/modnet • 100% On-Device',
  cachedInIndexedDB: false,
  engineName: MODEL_LABELS.rmbg_14,
  modelTier: 'rmbg_14',
  isPreClippedAlpha: false,
  diagnostics: { ...INITIAL_DIAGNOSTICS },
};

export function subscribeNeuralProgress(fn: ProgressListener): () => void {
  listeners.add(fn);
  fn(currentProgress);
  return () => listeners.delete(fn);
}

export function getRuntimeDiagnostics(): RuntimeMattingDiagnostics {
  return currentProgress.diagnostics;
}

export function getAlphaRefinementConfig(): AlphaRefinementConfig {
  return { ...currentRefinementConfig };
}

function emitProgress(next: Partial<NeuralMattingProgress>): void {
  currentProgress = {
    ...currentProgress,
    ...next,
    diagnostics: next.diagnostics
      ? { ...currentProgress.diagnostics, ...next.diagnostics }
      : currentProgress.diagnostics,
  };
  for (const fn of listeners) {
    fn(currentProgress);
  }
}

export function getCachedNeuralMatte(
  sourceImage: HTMLImageElement | null,
  modelTier?: NeuralModelTier
): CachedNeuralMatte | null {
  if (!sourceImage || !cachedMatte) return null;
  if (cachedMatte.sourceSrc !== sourceImage.src) return null;
  if (cachedMatte.isPreClippedAlpha) {
    return cachedMatte;
  }
  if (!modelTier || cachedMatte.modelTier === modelTier) {
    return cachedMatte;
  }
  return null;
}

export function clearCachedNeuralMatte(): void {
  if (
    cachedMatte?.imageBitmap &&
    typeof (cachedMatte.imageBitmap as ImageBitmap).close === 'function'
  ) {
    try {
      (cachedMatte.imageBitmap as ImageBitmap).close();
    } catch {
      // Ignore bitmap close errors
    }
  }
  cachedMatte = null;
  activeJobKey = null;
}

function rebuildMaskCanvasFromAlpha(
  sourceRgba: Uint8ClampedArray,
  alphaMask: Uint8Array,
  width: number,
  height: number,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const maskCanvas = targetCanvas ?? document.createElement('canvas');
  if (maskCanvas.width !== width) maskCanvas.width = width;
  if (maskCanvas.height !== height) maskCanvas.height = height;
  const ctx = maskCanvas.getContext('2d');
  if (ctx) {
    const imgData = ctx.createImageData(width, height);
    const dst = imgData.data;
    const total = width * height;
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      dst[idx] = sourceRgba[idx];
      dst[idx + 1] = sourceRgba[idx + 1];
      dst[idx + 2] = sourceRgba[idx + 2];
      dst[idx + 3] = alphaMask[i];
    }
    ctx.putImageData(imgData, 0, 0);
  }
  return maskCanvas;
}

function extractSourceRgba(img: HTMLImageElement): {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const width = Math.max(1, img.naturalWidth || img.width);
  const height = Math.max(1, img.naturalHeight || img.height);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context');
  }
  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  return { rgba: imgData.data, width, height };
}

/**
 * Prepares an aspect-ratio-preserved letterboxed DataURL and `LetterboxGeometry`
 * so the neural processor never distorts the subject's face or body proportions.
 */
function createAspectPreservedInputDataUrl(
  sourceImage: HTMLImageElement,
  targetSize: number
): { dataUrl: string; letterbox: LetterboxGeometry } {
  const origW = Math.max(1, sourceImage.naturalWidth || sourceImage.width);
  const origH = Math.max(1, sourceImage.naturalHeight || sourceImage.height);
  const letterbox = computeLetterboxGeometry(origW, origH, targetSize);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill letterbox padding with neutral mid-tone border replication
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sourceImage,
      0,
      0,
      origW,
      origH,
      letterbox.padLeft,
      letterbox.padTop,
      letterbox.scaledW,
      letterbox.scaledH
    );
  }
  return {
    dataUrl: canvas.toDataURL('image/png'),
    letterbox,
  };
}

/**
 * Re-applies the configurable 4-stage continuous alpha refinement to `cachedMatte.rawAlphaMask`
 * without re-running neural inference! Also resets manual brush strokes cleanly.
 */
export function updateAlphaRefinementConfig(
  partial: Partial<AlphaRefinementConfig>
): boolean {
  currentRefinementConfig = { ...currentRefinementConfig, ...partial };
  if (!cachedMatte) return false;

  const refined = cleanRawNeuralAlphaMatte(
    cachedMatte.rawAlphaMask,
    cachedMatte.width,
    cachedMatte.height,
    {
      lowClamp: currentRefinementConfig.lowConfidenceCut,
      highClamp: currentRefinementConfig.highConfidenceCut,
      holeFillMode: currentRefinementConfig.holeFillMode,
      speckleCleanupStrength: currentRefinementConfig.speckleCleanupStrength,
      sourceRgba: cachedMatte.sourceRgba,
      bypassRefinement: currentRefinementConfig.bypassRefinement,
    }
  );

  cachedMatte.refinedBaseAlpha = refined;
  cachedMatte.alphaMask = new Uint8Array(refined);
  cachedMatte.undoStack = [];
  cachedMatte.redoStack = [];

  rebuildMaskCanvasFromAlpha(
    cachedMatte.sourceRgba,
    cachedMatte.alphaMask,
    cachedMatte.width,
    cachedMatte.height,
    cachedMatte.maskCanvas
  );
  cachedMatte.imageBitmap = cachedMatte.maskCanvas;

  const refinedDiagnostics = computeAlphaMatteDiagnostics(
    cachedMatte.alphaMask,
    cachedMatte.width,
    cachedMatte.height
  );
  cachedMatte.diagnostics.refinedDiagnostics = refinedDiagnostics;
  emitProgress({
    diagnostics: cachedMatte.diagnostics,
  });
  return true;
}

/**
 * Checks if an uploaded or pasted image already has a transparent background
 * (e.g., Samsung Gallery / iOS subject clipper cutout PNG).
 */
export function detectAndCachePreClippedImage(
  sourceImage: HTMLImageElement,
  modelTier: NeuralModelTier = 'rmbg_14'
): CachedNeuralMatte | null {
  try {
    const startMs = performance.now();
    const { rgba, width, height } = extractSourceRgba(sourceImage);
    if (!hasPreClippedTransparency(rgba, width, height)) {
      return null;
    }

    const numPixels = width * height;
    const rawAlpha = new Uint8Array(numPixels);
    for (let i = 0; i < numPixels; i++) {
      rawAlpha[i] = rgba[i * 4 + 3];
    }

    const rawDiag = computeAlphaMatteDiagnostics(rawAlpha, width, height);
    const cleanedAlpha = cleanRawNeuralAlphaMatte(rawAlpha, width, height, {
      lowClamp: currentRefinementConfig.lowConfidenceCut,
      highClamp: currentRefinementConfig.highConfidenceCut,
      holeFillMode: currentRefinementConfig.holeFillMode,
      speckleCleanupStrength: currentRefinementConfig.speckleCleanupStrength,
      sourceRgba: rgba,
      bypassRefinement: currentRefinementConfig.bypassRefinement,
    });
    const refinedDiag = computeAlphaMatteDiagnostics(
      cleanedAlpha,
      width,
      height
    );

    const maskCanvas = rebuildMaskCanvasFromAlpha(
      rgba,
      cleanedAlpha,
      width,
      height
    );

    const durationMs = Math.max(1, Math.round(performance.now() - startMs));
    const diagnostics: RuntimeMattingDiagnostics = {
      activeModelId: 'Pre-Clipped Transparent PNG',
      modelVersion: 'Native Alpha Channel',
      inferenceBackend: 'native-png-alpha (0ms GPU)',
      status: 'preclipped',
      inferenceDurationMs: durationMs,
      sourceWidth: width,
      sourceHeight: height,
      rawDiagnostics: rawDiag,
      refinedDiagnostics: refinedDiag,
      errorMessage: null,
    };

    const result: CachedNeuralMatte = {
      sourceSrc: sourceImage.src,
      modelTier,
      imageBitmap: maskCanvas,
      maskCanvas,
      rawAlphaMask: rawAlpha,
      refinedBaseAlpha: new Uint8Array(cleanedAlpha),
      alphaMask: new Uint8Array(cleanedAlpha),
      undoStack: [],
      redoStack: [],
      sourceRgba: rgba,
      width,
      height,
      engineName: 'Pre-Clipped Transparent PNG (Samsung / Native Cutout)',
      isPreClippedAlpha: true,
      diagnostics,
    };

    cachedMatte = result;
    emitProgress({
      status: 'preclipped',
      progressPct: 100,
      stageLabel: 'Pre-Clipped Transparent PNG Detected — Backdrop Studio Ready',
      detailText: `Instant 60fps Backdrop Fill • Speckles: ${refinedDiag.backgroundSpeckleCount} • Holes: ${refinedDiag.foregroundHoleCount}`,
      cachedInIndexedDB: true,
      engineName: result.engineName,
      modelTier,
      isPreClippedAlpha: true,
      diagnostics,
    });

    return result;
  } catch (err) {
    console.warn('Pre-clipped transparency detection skipped:', err);
    return null;
  }
}

/**
 * Push a snapshot of `alphaMask` onto the Undo stack before starting a new brush stroke.
 */
export function beginAlphaBrushStroke(): void {
  if (!cachedMatte) return;
  cachedMatte.undoStack.push(new Uint8Array(cachedMatte.alphaMask));
  if (cachedMatte.undoStack.length > 25) {
    cachedMatte.undoStack.shift();
  }
  cachedMatte.redoStack = [];
}

/**
 * Undo the last manual Touch-Up Brush stroke on the alpha mask.
 */
export function undoAlphaBrushStroke(): boolean {
  if (!cachedMatte || cachedMatte.undoStack.length === 0) return false;
  const prev = cachedMatte.undoStack.pop()!;
  cachedMatte.redoStack.push(new Uint8Array(cachedMatte.alphaMask));
  cachedMatte.alphaMask = prev;
  rebuildMaskCanvasFromAlpha(
    cachedMatte.sourceRgba,
    cachedMatte.alphaMask,
    cachedMatte.width,
    cachedMatte.height,
    cachedMatte.maskCanvas
  );
  cachedMatte.imageBitmap = cachedMatte.maskCanvas;
  return true;
}

/**
 * Redo a previously undone Touch-Up Brush stroke.
 */
export function redoAlphaBrushStroke(): boolean {
  if (!cachedMatte || cachedMatte.redoStack.length === 0) return false;
  const next = cachedMatte.redoStack.pop()!;
  cachedMatte.undoStack.push(new Uint8Array(cachedMatte.alphaMask));
  cachedMatte.alphaMask = next;
  rebuildMaskCanvasFromAlpha(
    cachedMatte.sourceRgba,
    cachedMatte.alphaMask,
    cachedMatte.width,
    cachedMatte.height,
    cachedMatte.maskCanvas
  );
  cachedMatte.imageBitmap = cachedMatte.maskCanvas;
  return true;
}

/**
 * Resets all manual Touch-Up Brush edits back to the refined neural alpha mask.
 */
export function resetManualAlphaBrushEdits(): boolean {
  if (!cachedMatte) return false;
  cachedMatte.undoStack.push(new Uint8Array(cachedMatte.alphaMask));
  cachedMatte.redoStack = [];
  cachedMatte.alphaMask = new Uint8Array(cachedMatte.refinedBaseAlpha);
  rebuildMaskCanvasFromAlpha(
    cachedMatte.sourceRgba,
    cachedMatte.alphaMask,
    cachedMatte.width,
    cachedMatte.height,
    cachedMatte.maskCanvas
  );
  cachedMatte.imageBitmap = cachedMatte.maskCanvas;
  return true;
}

export function getBrushUndoRedoCounts(): { undo: number; redo: number } {
  if (!cachedMatte) return { undo: 0, redo: 0 };
  return {
    undo: cachedMatte.undoStack.length,
    redo: cachedMatte.redoStack.length,
  };
}

export function canUndoAlphaBrush(): boolean {
  return Boolean(cachedMatte && cachedMatte.undoStack.length > 0);
}

export function canRedoAlphaBrush(): boolean {
  return Boolean(cachedMatte && cachedMatte.redoStack.length > 0);
}

/**
 * Paints a circular Erase (`0`) or Restore (`255`) stroke directly onto the cached
 * alpha mask at normalized source-image coordinates `(normX, normY)` in `[0, 1]`.
 */
export function paintCachedAlphaBrushStroke(
  normX: number,
  normY: number,
  brushRadiusSourcePx: number,
  mode: 'erase' | 'restore'
): boolean {
  if (!cachedMatte) return false;
  const { width, height, alphaMask, sourceRgba, maskCanvas } = cachedMatte;
  const cx = Math.round(normX * (width - 1));
  const cy = Math.round(normY * (height - 1));
  const r = Math.max(2, Math.round(brushRadiusSourcePx));
  const rSq = r * r;
  const targetVal = mode === 'erase' ? 0 : 255;

  const minY = Math.max(0, cy - r);
  const maxY = Math.min(height - 1, cy + r);
  const minX = Math.max(0, cx - r);
  const maxX = Math.min(width - 1, cx + r);

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    const rowOffset = y * width;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rSq) {
        const dist = Math.sqrt(distSq);
        const edgeRatio = dist / r;
        if (edgeRatio <= 0.75) {
          alphaMask[rowOffset + x] = targetVal;
        } else {
          const blend = (1 - edgeRatio) / 0.25;
          const cur = alphaMask[rowOffset + x];
          alphaMask[rowOffset + x] = Math.round(
            cur + (targetVal - cur) * blend
          );
        }
      }
    }
  }

  rebuildMaskCanvasFromAlpha(sourceRgba, alphaMask, width, height, maskCanvas);
  cachedMatte.imageBitmap = maskCanvas;
  return true;
}

/**
 * Verified `@huggingface/transformers@3.1.2` execution for `briaai/RMBG-1.4` and `Xenova/modnet`
 * with aspect-preserving letterbox input and bilinear continuous unpadding.
 */
async function runTransformersSegmentation(
  sourceImage: HTMLImageElement,
  modelTier: 'rmbg_14' | 'modnet',
  tierLabel: string
): Promise<{ rawAlpha: Uint8Array; backendUsed: string; modelId: string }> {
  const hfModelId =
    modelTier === 'modnet' ? 'Xenova/modnet' : 'briaai/RMBG-1.4';
  const targetSquareSize = modelTier === 'modnet' ? 512 : 1024;

  emitProgress({
    status: 'downloading',
    progressPct: 8,
    stageLabel: `Loading ${tierLabel} (8%)`,
    detailText: `Importing @huggingface/transformers@3.1.2 (${hfModelId})…`,
    cachedInIndexedDB: modelWeightsCachedInSession,
    engineName: tierLabel,
    modelTier,
    isPreClippedAlpha: false,
    diagnostics: {
      ...currentProgress.diagnostics,
      activeModelId: hfModelId,
      modelVersion: '@huggingface/transformers@3.1.2',
      status: 'downloading',
      errorMessage: null,
    },
  });

  const transformers = await dynamicImportEsm(TRANSFORMERS_CDN_URL);
  const { AutoModel, AutoProcessor, RawImage, env } = transformers;

  if (env) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.numThreads = 1;
    }
  }

  let pair = loadedTransformersPipelines.get(hfModelId);
  if (!pair) {
    const fileProgress = new Map<string, { loaded: number; total: number }>();
    const progressCallback = (info: any) => {
      if (
        info &&
        (info.status === 'progress' || info.status === 'downloading') &&
        typeof info.loaded === 'number' &&
        typeof info.total === 'number' &&
        info.total > 0
      ) {
        const key = String(info.file || 'weights');
        fileProgress.set(key, { loaded: info.loaded, total: info.total });
        let sumLoaded = 0;
        let sumTotal = 0;
        for (const item of fileProgress.values()) {
          sumLoaded += item.loaded;
          sumTotal += item.total;
        }
        const ratio = sumTotal > 0 ? Math.min(1, sumLoaded / sumTotal) : 0.4;
        const pct = Math.max(10, Math.min(76, Math.round(10 + ratio * 66)));
        const mbLoaded = (sumLoaded / (1024 * 1024)).toFixed(1);
        const mbTotal = (sumTotal / (1024 * 1024)).toFixed(1);

        emitProgress({
          status: 'downloading',
          progressPct: pct,
          stageLabel: `Downloading ${hfModelId}: ${pct}%`,
          detailText: `${mbLoaded} / ${mbTotal} MB • Cached in Browser IndexedDB`,
          cachedInIndexedDB: modelWeightsCachedInSession,
          engineName: tierLabel,
          modelTier,
          isPreClippedAlpha: false,
        });
      }
    };

    const hasWebGPU =
      typeof navigator !== 'undefined' && Boolean((navigator as any).gpu);

    const buildModelOptions = (useWebGpu: boolean): Record<string, any> => {
      const opts: Record<string, any> = {
        device: useWebGpu ? 'webgpu' : 'wasm',
        dtype: useWebGpu ? 'fp32' : 'q8',
        progress_callback: progressCallback,
      };
      if (hfModelId === 'briaai/RMBG-1.4') {
        opts.config = { model_type: 'custom' };
      }
      return opts;
    };

    let backendUsed = 'wasm (q8, 1-thread)';
    const loadModelWithVerifiedBackend = async () => {
      if (hasWebGPU) {
        try {
          const m = await AutoModel.from_pretrained(
            hfModelId,
            buildModelOptions(true)
          );
          backendUsed = 'webgpu (fp32)';
          return m;
        } catch (gpuErr) {
          console.warn(
            `WebGPU adapter failed for ${hfModelId}, using WASM q8 engine:`,
            gpuErr
          );
        }
      }
      backendUsed = 'wasm (q8, 1-thread)';
      return await AutoModel.from_pretrained(
        hfModelId,
        buildModelOptions(false)
      );
    };

    const processorConfig =
      hfModelId === 'briaai/RMBG-1.4'
        ? {
            do_normalize: true,
            do_pad: false,
            do_rescale: true,
            do_resize: true,
            image_mean: [0.5, 0.5, 0.5],
            feature_extractor_type: 'ImageFeatureExtractor',
            image_std: [1, 1, 1],
            resample: 2,
            rescale_factor: 0.00392156862745098,
            size: { width: 1024, height: 1024 },
          }
        : undefined;

    const [model, processor] = await Promise.all([
      loadModelWithVerifiedBackend(),
      AutoProcessor.from_pretrained(hfModelId, {
        progress_callback: progressCallback,
        ...(processorConfig ? { config: processorConfig } : {}),
      }),
    ]);

    pair = { model, processor, backendUsed };
    loadedTransformersPipelines.set(hfModelId, pair);
    modelWeightsCachedInSession = true;
  }

  emitProgress({
    status: 'inferring',
    progressPct: 84,
    stageLabel: `Segmenting Subject (${hfModelId}): 84%`,
    detailText: `Running ${pair.backendUsed} inference with aspect-preserved geometry…`,
    cachedInIndexedDB: true,
    engineName: tierLabel,
    modelTier,
    isPreClippedAlpha: false,
    diagnostics: {
      ...currentProgress.diagnostics,
      activeModelId: hfModelId,
      inferenceBackend: pair.backendUsed,
      status: 'inferring',
    },
  });

  const origW = Math.max(1, sourceImage.naturalWidth || sourceImage.width);
  const origH = Math.max(1, sourceImage.naturalHeight || sourceImage.height);

  // Preserve source photograph's aspect ratio via letterbox padding
  const { dataUrl, letterbox } = createAspectPreservedInputDataUrl(
    sourceImage,
    targetSquareSize
  );

  const rawImage = await RawImage.fromURL(dataUrl);
  const { pixel_values } = await pair.processor(rawImage);
  const { output } = await pair.model({ input: pixel_values });

  const predTensor = output[0].mul(255).to('uint8');
  const predMaskImg = await RawImage.fromTensor(predTensor);
  const predW = Math.max(1, predMaskImg.width);
  const predH = Math.max(1, predMaskImg.height);
  const predData = predMaskImg.data as Uint8Array | Uint8ClampedArray;
  const totalPred = predW * predH;
  const channels = Math.max(1, Math.round(predData.length / totalPred));

  const singleChannelPred = new Uint8Array(totalPred);
  for (let i = 0; i < totalPred; i++) {
    singleChannelPred[i] = predData[i * channels];
  }

  // Reverse the letterbox padding and resize continuously with bilinear interpolation to (origW × origH)
  const rawAlpha = unpadAndResizeAlphaBilinear(
    singleChannelPred,
    predW,
    predH,
    origW,
    origH,
    letterbox
  );

  // Verify that the generated alpha mask is valid and non-empty
  let maxAlpha = 0;
  for (let i = 0; i < rawAlpha.length; i++) {
    if (rawAlpha[i] > maxAlpha) maxAlpha = rawAlpha[i];
  }
  if (maxAlpha === 0) {
    throw new Error(`${hfModelId} produced an empty alpha mask.`);
  }

  return {
    rawAlpha,
    backendUsed: pair.backendUsed,
    modelId: hfModelId,
  };
}

/**
 * Runs `@imgly/background-removal@1.7.0` with the explicitly configured `publicPath`.
 */
async function runImglySegmentation(
  sourceImage: HTMLImageElement,
  sourceBlob: Blob | null | undefined,
  tierLabel: string
): Promise<{ rawAlpha: Uint8Array; backendUsed: string; modelId: string }> {
  const mod = await dynamicImportEsm(IMGLY_ESM_URL);
  const removeBackground = (mod.removeBackground ?? mod.default) as
    | ((image: Blob | string, config?: Record<string, unknown>) => Promise<Blob>)
    | undefined;
  if (typeof removeBackground !== 'function') {
    throw new Error(
      'removeBackground export not found in @imgly/background-removal@1.7.0'
    );
  }

  const hasWebGPU =
    typeof navigator !== 'undefined' && Boolean((navigator as any).gpu);
  const deviceUsed = hasWebGPU ? 'gpu' : 'cpu';
  const backendUsed = hasWebGPU ? 'webgpu (imgly)' : 'wasm (imgly cpu)';

  const inputSource: Blob | string = sourceBlob ?? sourceImage.src;
  const downloadTotals = new Map<string, { cur: number; tot: number }>();

  const segmentedBlob = await removeBackground(inputSource, {
    publicPath: IMGLY_PUBLIC_PATH,
    model: 'medium',
    device: deviceUsed,
    output: {
      format: 'image/png',
      quality: 1.0,
    },
    progress: (key: string, current: number, total: number) => {
      if (key.startsWith('fetch:')) {
        downloadTotals.set(key, {
          cur: Math.max(0, current),
          tot: Math.max(1, total),
        });
        let sumCur = 0;
        let sumTot = 0;
        for (const item of downloadTotals.values()) {
          sumCur += item.cur;
          sumTot += item.tot;
        }
        const ratio = sumTot > 0 ? Math.min(1, sumCur / sumTot) : 0.5;
        const pct = Math.max(8, Math.min(75, Math.round(8 + ratio * 67)));
        emitProgress({
          status: 'downloading',
          progressPct: pct,
          stageLabel: `Downloading ${tierLabel}: ${pct}%`,
          detailText: `${tierLabel} • staticimgly.com CDN`,
          cachedInIndexedDB: modelWeightsCachedInSession,
          engineName: tierLabel,
          modelTier: 'imgly_medium',
          isPreClippedAlpha: false,
        });
      } else if (key.startsWith('compute:')) {
        modelWeightsCachedInSession = true;
        const ratio = total > 0 ? Math.min(1, current / total) : 0.6;
        const pct = Math.max(76, Math.min(98, Math.round(76 + ratio * 22)));
        emitProgress({
          status: 'inferring',
          progressPct: pct,
          stageLabel: `Segmenting Portrait: ${pct}%`,
          detailText: `Running ${tierLabel} neural inference…`,
          cachedInIndexedDB: true,
          engineName: tierLabel,
          modelTier: 'imgly_medium',
          isPreClippedAlpha: false,
        });
      }
    },
  });

  const url = URL.createObjectURL(segmentedBlob);
  try {
    const segImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = (e) => reject(e);
      im.src = url;
    });
    const { rgba, width, height } = extractSourceRgba(segImg);
    const totalPixels = width * height;
    const rawAlpha = new Uint8Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      rawAlpha[i] = rgba[i * 4 + 3];
    }
    return {
      rawAlpha,
      backendUsed,
      modelId: '@imgly/background-removal@1.7.0 (medium)',
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Runs the selected neural model (`rmbg_14`, `modnet`, or `imgly_medium`) WITHOUT silently
 * switching to another model or falling back to pixel-color heuristics.
 */
export async function runNeuralPortraitMatting(
  sourceImage: HTMLImageElement,
  sourceBlob?: Blob | null,
  modelTier: NeuralModelTier = 'rmbg_14',
  onComplete?: (matte: CachedNeuralMatte | null) => void,
  forceAiEvenIfPreClipped = false
): Promise<CachedNeuralMatte | null> {
  const srcKey = sourceImage.src;
  if (!srcKey) return null;

  if (!forceAiEvenIfPreClipped) {
    if (
      cachedMatte &&
      cachedMatte.sourceSrc === srcKey &&
      cachedMatte.isPreClippedAlpha
    ) {
      onComplete?.(cachedMatte);
      return cachedMatte;
    }
    const preClipped = detectAndCachePreClippedImage(sourceImage, modelTier);
    if (preClipped) {
      onComplete?.(preClipped);
      return preClipped;
    }
  }

  const jobKey = `${srcKey}::${modelTier}`;
  if (
    cachedMatte &&
    cachedMatte.sourceSrc === srcKey &&
    cachedMatte.modelTier === modelTier &&
    !cachedMatte.isPreClippedAlpha
  ) {
    emitProgress({
      status: 'ready',
      progressPct: 100,
      stageLabel: `${cachedMatte.diagnostics.activeModelId} Ready (${cachedMatte.diagnostics.inferenceDurationMs}ms)`,
      detailText: `${cachedMatte.diagnostics.inferenceBackend} • Speckles: ${cachedMatte.diagnostics.refinedDiagnostics?.backgroundSpeckleCount ?? 0} • Holes: ${cachedMatte.diagnostics.refinedDiagnostics?.foregroundHoleCount ?? 0}`,
      cachedInIndexedDB: true,
      engineName: cachedMatte.engineName,
      modelTier,
      isPreClippedAlpha: false,
      diagnostics: cachedMatte.diagnostics,
    });
    onComplete?.(cachedMatte);
    return cachedMatte;
  }

  if (activeJobKey === jobKey) {
    return null;
  }

  activeJobKey = jobKey;
  const tierLabel = MODEL_LABELS[modelTier] || MODEL_LABELS.rmbg_14;
  const startTimeMs = performance.now();

  try {
    const {
      rgba: sourceRgba,
      width,
      height,
    } = extractSourceRgba(sourceImage);

    let segResult: {
      rawAlpha: Uint8Array;
      backendUsed: string;
      modelId: string;
    };

    if (modelTier === 'rmbg_14' || modelTier === 'modnet') {
      segResult = await runTransformersSegmentation(
        sourceImage,
        modelTier,
        tierLabel
      );
    } else {
      segResult = await runImglySegmentation(
        sourceImage,
        sourceBlob,
        tierLabel
      );
    }

    const inferenceDurationMs = Math.max(
      1,
      Math.round(performance.now() - startTimeMs)
    );

    const rawDiagnostics = computeAlphaMatteDiagnostics(
      segResult.rawAlpha,
      width,
      height
    );

    const cleanedAlpha = cleanRawNeuralAlphaMatte(
      segResult.rawAlpha,
      width,
      height,
      {
        lowClamp: currentRefinementConfig.lowConfidenceCut,
        highClamp: currentRefinementConfig.highConfidenceCut,
        holeFillMode: currentRefinementConfig.holeFillMode,
        speckleCleanupStrength: currentRefinementConfig.speckleCleanupStrength,
        sourceRgba,
        bypassRefinement: currentRefinementConfig.bypassRefinement,
      }
    );

    const refinedDiagnostics = computeAlphaMatteDiagnostics(
      cleanedAlpha,
      width,
      height
    );

    const maskCanvas = rebuildMaskCanvasFromAlpha(
      sourceRgba,
      cleanedAlpha,
      width,
      height
    );

    const diagnostics: RuntimeMattingDiagnostics = {
      activeModelId: segResult.modelId,
      modelVersion:
        modelTier === 'imgly_medium'
          ? '@imgly/background-removal@1.7.0'
          : '@huggingface/transformers@3.1.2',
      inferenceBackend: segResult.backendUsed,
      status: 'ready',
      inferenceDurationMs,
      sourceWidth: width,
      sourceHeight: height,
      rawDiagnostics,
      refinedDiagnostics,
      errorMessage: null,
    };

    const result: CachedNeuralMatte = {
      sourceSrc: srcKey,
      modelTier,
      imageBitmap: maskCanvas,
      maskCanvas,
      rawAlphaMask: segResult.rawAlpha,
      refinedBaseAlpha: new Uint8Array(cleanedAlpha),
      alphaMask: new Uint8Array(cleanedAlpha),
      undoStack: [],
      redoStack: [],
      sourceRgba,
      width,
      height,
      engineName: tierLabel,
      isPreClippedAlpha: false,
      diagnostics,
    };

    cachedMatte = result;
    activeJobKey = null;

    emitProgress({
      status: 'ready',
      progressPct: 100,
      stageLabel: `${segResult.modelId} Ready (${inferenceDurationMs}ms)`,
      detailText: `${segResult.backendUsed} • Speckles: ${rawDiagnostics.backgroundSpeckleCount}→${refinedDiagnostics.backgroundSpeckleCount} • Holes: ${rawDiagnostics.foregroundHoleCount}→${refinedDiagnostics.foregroundHoleCount}`,
      cachedInIndexedDB: true,
      engineName: tierLabel,
      modelTier,
      isPreClippedAlpha: false,
      diagnostics,
    });

    onComplete?.(result);
    return result;
  } catch (err) {
    // CRITICAL: Never silently switch models or fall back to pixel-color heuristics.
    console.error(`Neural segmentation error (${modelTier}):`, err);
    activeJobKey = null;
    const exactMessage =
      err instanceof Error ? err.message : String(err || 'Unknown model error');
    const failedDiagnostics: RuntimeMattingDiagnostics = {
      activeModelId:
        modelTier === 'modnet'
          ? 'Xenova/modnet'
          : modelTier === 'imgly_medium'
            ? '@imgly/background-removal@1.7.0'
            : 'briaai/RMBG-1.4',
      modelVersion: '@huggingface/transformers@3.1.2',
      inferenceBackend: 'error',
      status: 'error',
      inferenceDurationMs: Math.round(performance.now() - startTimeMs),
      sourceWidth: sourceImage.naturalWidth || 0,
      sourceHeight: sourceImage.naturalHeight || 0,
      rawDiagnostics: null,
      refinedDiagnostics: null,
      errorMessage: exactMessage,
    };

    emitProgress({
      status: 'error',
      progressPct: 0,
      stageLabel: `Model Error (${failedDiagnostics.activeModelId}): ${exactMessage.slice(0, 42)}`,
      detailText: `Error: ${exactMessage} — Click to retry or select another engine.`,
      cachedInIndexedDB: false,
      engineName: tierLabel,
      modelTier,
      isPreClippedAlpha: false,
      diagnostics: failedDiagnostics,
    });
    onComplete?.(null);
    return null;
  }
}

/**
 * Side-by-Side Benchmark Runner for the Accuracy Test Suite:
 * Evaluates a given image with a specific model (`rmbg_14` or `modnet`) and returns both
 * the unrefined continuous mask and the refined mask + diagnostics (including IoU/F1/MAE if groundTruthAlpha is given).
 */
export async function evaluateImageWithNeuralModel(
  sourceImage: HTMLImageElement,
  modelTier: 'rmbg_14' | 'modnet',
  groundTruthAlpha?: Uint8Array | null
): Promise<{
  modelId: string;
  backendUsed: string;
  inferenceDurationMs: number;
  rawMaskCanvas: HTMLCanvasElement;
  refinedMaskCanvas: HTMLCanvasElement;
  rawDiagnostics: AlphaMatteDiagnostics;
  refinedDiagnostics: AlphaMatteDiagnostics;
  errorMessage: string | null;
}> {
  const startMs = performance.now();
  const { rgba: sourceRgba, width, height } = extractSourceRgba(sourceImage);
  const tierLabel = MODEL_LABELS[modelTier];

  const seg = await runTransformersSegmentation(
    sourceImage,
    modelTier,
    tierLabel
  );
  const durationMs = Math.max(1, Math.round(performance.now() - startMs));

  const refinedAlpha = cleanRawNeuralAlphaMatte(seg.rawAlpha, width, height, {
    lowClamp: currentRefinementConfig.lowConfidenceCut,
    highClamp: currentRefinementConfig.highConfidenceCut,
    holeFillMode: currentRefinementConfig.holeFillMode,
    speckleCleanupStrength: currentRefinementConfig.speckleCleanupStrength,
    sourceRgba,
  });

  const rawDiagnostics = computeAlphaMatteDiagnostics(
    seg.rawAlpha,
    width,
    height,
    groundTruthAlpha
  );
  const refinedDiagnostics = computeAlphaMatteDiagnostics(
    refinedAlpha,
    width,
    height,
    groundTruthAlpha
  );

  const rawMaskCanvas = rebuildMaskCanvasFromAlpha(
    sourceRgba,
    seg.rawAlpha,
    width,
    height
  );
  const refinedMaskCanvas = rebuildMaskCanvasFromAlpha(
    sourceRgba,
    refinedAlpha,
    width,
    height
  );

  return {
    modelId: seg.modelId,
    backendUsed: seg.backendUsed,
    inferenceDurationMs: durationMs,
    rawMaskCanvas,
    refinedMaskCanvas,
    rawDiagnostics,
    refinedDiagnostics,
    errorMessage: null,
  };
}
