/**
 * Two-Tier Commercial-Grade On-Device Neural Portrait Matting Engine
 * - Tier 1 (Default): @imgly/background-removal@1.7.0 (`isnet_quint8` quantized neural model)
 * - Tier 2 (Studio Pro): @imgly/background-removal@1.7.0 (`isnet_fp16` half-precision neural model)
 * - Passes the uploaded image Blob directly into `removeBackground(blob, { model, progress })`
 * - Caches the returned transparent PNG `ImageBitmap` in memory so changing Backdrop Fill colors
 *   (White, Sky Blue, Custom), Zoom, Pan, Rotate, or Edge Feather re-renders instantaneously at 60fps
 *   without re-running the model.
 */

export type NeuralMattingStatus =
  | 'idle'
  | 'downloading'
  | 'inferring'
  | 'ready'
  | 'error';

export type NeuralModelTier = 'isnet_quint8' | 'isnet_fp16';

export interface NeuralMattingProgress {
  status: NeuralMattingStatus;
  progressPct: number;
  stageLabel: string;
  detailText: string;
  cachedInIndexedDB: boolean;
  engineName: string;
  modelTier: NeuralModelTier;
}

export interface CachedNeuralMatte {
  sourceSrc: string;
  modelTier: NeuralModelTier;
  imageBitmap: ImageBitmap | HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  engineName: string;
}

type ProgressListener = (state: NeuralMattingProgress) => void;

const IMGLY_ESM_URL_PRIMARY =
  'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
const IMGLY_ESM_URL_FALLBACK =
  'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm';

// Dynamic ESM loader that bypasses static bundler rewriting so CDN ESM loads natively in browser
const dynamicImportEsm = new Function(
  'moduleUrl',
  'return import(moduleUrl)'
) as (moduleUrl: string) => Promise<Record<string, unknown>>;

let cachedMatte: CachedNeuralMatte | null = null;
let activeJobKey: string | null = null;
let modelWeightsCachedInSession = false;
const listeners = new Set<ProgressListener>();

let currentProgress: NeuralMattingProgress = {
  status: 'idle',
  progressPct: 0,
  stageLabel: 'ISNet Neural Matting Ready',
  detailText: '@imgly/background-removal@1.7.0 • 100% On-Device',
  cachedInIndexedDB: false,
  engineName: 'ISNet Quint8 (@imgly/background-removal@1.7.0)',
  modelTier: 'isnet_quint8',
};

export function subscribeNeuralProgress(fn: ProgressListener): () => void {
  listeners.add(fn);
  fn(currentProgress);
  return () => listeners.delete(fn);
}

function emitProgress(next: Partial<NeuralMattingProgress>): void {
  currentProgress = { ...currentProgress, ...next };
  for (const fn of listeners) {
    fn(currentProgress);
  }
}

export function getCachedNeuralMatte(
  sourceImage: HTMLImageElement | null,
  modelTier: NeuralModelTier = 'isnet_quint8'
): CachedNeuralMatte | null {
  if (!sourceImage || !cachedMatte) return null;
  if (
    cachedMatte.sourceSrc === sourceImage.src &&
    cachedMatte.modelTier === modelTier
  ) {
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

/**
 * Fallback helper: converts an HTMLImageElement to a PNG Blob ONLY when no raw File/Blob was provided.
 */
async function imageElementToBlob(img: HTMLImageElement): Promise<Blob> {
  const natW = Math.max(1, img.naturalWidth || img.width);
  const natH = Math.max(1, img.naturalHeight || img.height);
  const c = document.createElement('canvas');
  c.width = natW;
  c.height = natH;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, natW, natH);
  }
  return new Promise<Blob>((resolve, reject) => {
    c.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to encode image element to Blob'));
    }, 'image/png');
  });
}

/**
 * Decodes the transparent PNG Blob returned by `@imgly/background-removal` into both:
 * 1. An in-memory `ImageBitmap` for instant 60fps GPU canvas rendering (`ctx.drawImage(imageBitmap, ...)`).
 * 2. An offscreen `maskCanvas` for optional Edge Choke / Defringe (-2px..+2px) and Edge Feather (0px..3px) refinement.
 */
async function decodeSegmentedBlobToBitmapAndCanvas(
  segmentedBlob: Blob
): Promise<{
  imageBitmap: ImageBitmap | HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(segmentedBlob);
    const width = Math.max(1, bitmap.width);
    const height = Math.max(1, bitmap.height);
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, width, height);
    }
    return { imageBitmap: bitmap, maskCanvas, width, height };
  }

  // Fallback for environments without createImageBitmap
  const url = URL.createObjectURL(segmentedBlob);
  try {
    const segImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = (e) => reject(e);
      im.src = url;
    });
    const width = Math.max(1, segImg.naturalWidth || segImg.width);
    const height = Math.max(1, segImg.naturalHeight || segImg.height);
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(segImg, 0, 0, width, height);
    }
    return { imageBitmap: maskCanvas, maskCanvas, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadRemoveBackgroundFn(): Promise<
  (image: Blob, config?: Record<string, unknown>) => Promise<Blob>
> {
  try {
    const mod = await dynamicImportEsm(IMGLY_ESM_URL_PRIMARY);
    const fn = (mod.removeBackground ?? mod.default) as
      | ((image: Blob, config?: Record<string, unknown>) => Promise<Blob>)
      | undefined;
    if (typeof fn === 'function') {
      return fn;
    }
  } catch (err) {
    console.warn(
      '@imgly/background-removal@1.7.0 failed to import, trying @1.5.5 fallback:',
      err
    );
  }

  const fallbackMod = await dynamicImportEsm(IMGLY_ESM_URL_FALLBACK);
  const fallbackFn = (fallbackMod.removeBackground ?? fallbackMod.default) as
    | ((image: Blob, config?: Record<string, unknown>) => Promise<Blob>)
    | undefined;
  if (typeof fallbackFn !== 'function') {
    throw new Error(
      'removeBackground export not found in @imgly/background-removal'
    );
  }
  return fallbackFn;
}

/**
 * Runs 100% on-device neural portrait background removal using `@imgly/background-removal@1.7.0`.
 * Passes the uploaded image `Blob` directly into `removeBackground(blob, { model, progress })`
 * and caches the returned transparent PNG `ImageBitmap` in memory for 60fps re-rendering.
 */
export async function runNeuralPortraitMatting(
  sourceImage: HTMLImageElement,
  sourceBlob?: Blob | null,
  modelTier: NeuralModelTier = 'isnet_quint8',
  onComplete?: (matte: CachedNeuralMatte | null) => void
): Promise<CachedNeuralMatte | null> {
  const srcKey = sourceImage.src;
  if (!srcKey) return null;

  const jobKey = `${srcKey}::${modelTier}`;
  if (
    cachedMatte &&
    cachedMatte.sourceSrc === srcKey &&
    cachedMatte.modelTier === modelTier
  ) {
    emitProgress({
      status: 'ready',
      progressPct: 100,
      stageLabel: 'Neural Cutout Cached (60fps)',
      detailText: `${cachedMatte.engineName} • ImageBitmap in Memory`,
      cachedInIndexedDB: true,
      modelTier,
    });
    onComplete?.(cachedMatte);
    return cachedMatte;
  }

  if (activeJobKey === jobKey) {
    return null;
  }

  activeJobKey = jobKey;
  const tierLabel =
    modelTier === 'isnet_fp16' ? 'ISNet FP16 Studio Pro' : 'ISNet Quint8 Neural';

  emitProgress({
    status: 'downloading',
    progressPct: 5,
    stageLabel: `Loading ${tierLabel} (5%)`,
    detailText: 'Importing @imgly/background-removal@1.7.0…',
    cachedInIndexedDB: modelWeightsCachedInSession,
    engineName: tierLabel,
    modelTier,
  });

  try {
    const inputBlob = sourceBlob ?? (await imageElementToBlob(sourceImage));
    const removeBackground = await loadRemoveBackgroundFn();

    const downloadTotals = new Map<string, { cur: number; tot: number }>();

    const segmentedBlob = await removeBackground(inputBlob, {
      model: modelTier,
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
          const pct = Math.max(6, Math.min(72, Math.round(6 + ratio * 66)));
          const mbCur = (sumCur / (1024 * 1024)).toFixed(1);
          const mbTot = (sumTot / (1024 * 1024)).toFixed(1);

          emitProgress({
            status: 'downloading',
            progressPct: pct,
            stageLabel: modelWeightsCachedInSession
              ? `Loading Neural Model: ${pct}%`
              : `Downloading Neural Model: ${pct}%`,
            detailText:
              sumTot > 10000
                ? `${mbCur} / ${mbTot} MB • ${tierLabel}`
                : `${tierLabel} (@imgly/background-removal@1.7.0)`,
            cachedInIndexedDB: modelWeightsCachedInSession,
            modelTier,
          });
        } else if (key.startsWith('compute:')) {
          modelWeightsCachedInSession = true;
          const ratio = total > 0 ? Math.min(1, current / total) : 0.6;
          const pct = Math.max(74, Math.min(99, Math.round(74 + ratio * 25)));
          emitProgress({
            status: 'inferring',
            progressPct: pct,
            stageLabel: `Segmenting Portrait: ${pct}%`,
            detailText:
              key === 'compute:inference'
                ? `Running ${tierLabel} neural segmentation…`
                : 'Decoding transparent PNG ImageBitmap…',
            cachedInIndexedDB: true,
            modelTier,
          });
        }
      },
    });

    modelWeightsCachedInSession = true;
    const decoded = await decodeSegmentedBlobToBitmapAndCanvas(segmentedBlob);

    // Release previous cached ImageBitmap if any
    if (
      cachedMatte?.imageBitmap &&
      typeof (cachedMatte.imageBitmap as ImageBitmap).close === 'function'
    ) {
      try {
        (cachedMatte.imageBitmap as ImageBitmap).close();
      } catch {
        // Ignore
      }
    }

    const result: CachedNeuralMatte = {
      sourceSrc: srcKey,
      modelTier,
      imageBitmap: decoded.imageBitmap,
      maskCanvas: decoded.maskCanvas,
      width: decoded.width,
      height: decoded.height,
      engineName: tierLabel,
    };

    cachedMatte = result;
    activeJobKey = null;

    emitProgress({
      status: 'ready',
      progressPct: 100,
      stageLabel: 'Neural Cutout Ready (100%)',
      detailText: `${tierLabel} • ImageBitmap Cached (60fps)`,
      cachedInIndexedDB: true,
      modelTier,
    });

    onComplete?.(result);
    return result;
  } catch (err) {
    console.error('On-device neural background removal error:', err);
    activeJobKey = null;
    emitProgress({
      status: 'error',
      progressPct: 0,
      stageLabel: 'Neural Model Load Error — Click Retry',
      detailText:
        err instanceof Error
          ? err.message
          : 'Check network connection to load @imgly/background-removal@1.7.0',
      cachedInIndexedDB: false,
      modelTier,
    });
    onComplete?.(null);
    return null;
  }
}
