import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAspectRatioLock,
  computeAspectRatio,
  estimateCompressionStats,
  evaluatePortalCompliance,
  pxToUnit,
  resolveOutputDimensions,
  unitToPx,
} from './photoMath';
import {
  cleanRawNeuralAlphaMatte,
  computeAlphaMatteDiagnostics,
  computeLetterboxGeometry,
  hasPreClippedTransparency,
  processSignatureAdaptiveInk,
  refineAlphaMatteAndDefringe,
  unpadAndResizeAlphaBilinear,
} from './bgRemoverCore';
import { ADMISSION_PRESETS } from '../constants';
import { TransformState } from '../types';

test('pxToUnit and unitToPx convert accurately at 300 DPI', () => {
  assert.equal(pxToUnit(300, 'px', 300), 300);
  assert.equal(pxToUnit(600, 'in', 300), 2);
  assert.equal(pxToUnit(300, 'mm', 300), 25.4);
  assert.equal(unitToPx(2, 'in', 300), 600);
  assert.equal(unitToPx(25.4, 'mm', 300), 300);
});

test('computeAspectRatio returns exact BUET 6:7 and signature 300:80 ratios', () => {
  assert.equal(computeAspectRatio(300, 350).ratioText, '6:7');
  assert.equal(computeAspectRatio(300, 300).ratioText, '1:1');
  assert.equal(computeAspectRatio(360, 540).ratioText, '2:3');
  assert.equal(computeAspectRatio(300, 80).ratioText, '300:80');
});

test('applyAspectRatioLock locks height when width changes in 6:7 ratio', () => {
  const locked = applyAspectRatioLock('w', 600, '6:7', 300, 350);
  assert.equal(locked.widthPx, 600);
  assert.equal(locked.heightPx, 700);

  const free = applyAspectRatioLock('w', 420, 'Free', 300, 350);
  assert.equal(free.widthPx, 420);
  assert.equal(free.heightPx, 350);
});

test('resolveOutputDimensions scales for standard, low, and high resolution tiers', () => {
  assert.deepEqual(resolveOutputDimensions(300, 350, 'standard'), {
    outWidth: 300,
    outHeight: 350,
    scaleFactor: 1,
  });
  assert.deepEqual(resolveOutputDimensions(300, 350, 'high'), {
    outWidth: 600,
    outHeight: 700,
    scaleFactor: 2,
  });
  assert.deepEqual(resolveOutputDimensions(300, 350, 'low'), {
    outWidth: 225,
    outHeight: 263,
    scaleFactor: 0.75,
  });
});

test('estimateCompressionStats calculates weight and headroom under portal cap', () => {
  const stats = estimateCompressionStats(75, null);
  assert.equal(stats.computedKb, 54.2);
  assert.equal(stats.headroomKb, 20.8);
  assert.equal(stats.withinCap, true);
});

test('evaluatePortalCompliance passes 5/5 checks for valid BUET state', () => {
  const state: TransformState = {
    mode: 'photo',
    presetId: 'buet',
    widthPx: 300,
    heightPx: 350,
    unit: 'px',
    dpi: 300,
    aspectRatioLock: '6:7',
    rotationDeg: 0,
    scalePct: 115,
    offsetX: 12,
    offsetY: -4,
    flipH: false,
    flipV: false,
    bgTone: 'white',
    customBgColor: '#ffffff',
    bgRemovalEnabled: true,
    bgTolerance: 36,
    bgChokePx: 0,
    bgFeather: 1.5,
    sigHighContrast: false,
    sigInkColorMode: 'original',
    sigThreshold: 14,
    format: 'image/jpeg',
    formatExtLabel: 'JPG',
    targetCapKb: 75,
    qualityPct: 92,
    resolutionTier: 'standard',
    stripExif: true,
    viewMode: 'single',
    zoomPct: 100,
    showGrid: true,
    splitPositionPct: 50,
    theme: 'oled',
  };
  const res = evaluatePortalCompliance(state, 54.2, ADMISSION_PRESETS.buet);
  assert.equal(res.passedCount, 5);
  assert.equal(res.allPassed, true);
});

test('hasPreClippedTransparency detects Samsung Gallery pre-clipped transparent PNGs vs opaque JPEGs', () => {
  const width = 20;
  const height = 20;
  const opaqueRgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    opaqueRgba[i * 4 + 3] = 255;
  }
  assert.equal(hasPreClippedTransparency(opaqueRgba, width, height), false);

  const preClippedRgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const inCenter = x >= 5 && x <= 14 && y >= 4 && y <= 16;
      preClippedRgba[idx] = 40;
      preClippedRgba[idx + 1] = 60;
      preClippedRgba[idx + 2] = 90;
      preClippedRgba[idx + 3] = inCenter ? 255 : 0;
    }
  }
  assert.equal(hasPreClippedTransparency(preClippedRgba, width, height), true);
});

test('computeLetterboxGeometry and unpadAndResizeAlphaBilinear preserve aspect ratio without distortion', () => {
  const geo = computeLetterboxGeometry(600, 800, 1024);
  assert.equal(geo.targetSize, 1024);
  assert.equal(geo.scaledH, 1024);
  assert.equal(geo.scaledW, 768);
  assert.equal(geo.padLeft, 128);
  assert.equal(geo.padTop, 0);

  // Create a synthetic 16x16 model output with letterbox padding for a 6x8 source
  const smallGeo = computeLetterboxGeometry(6, 8, 16);
  const modelAlpha = new Uint8Array(16 * 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Fill the active letterboxed region with 255, padding with 180 (to prove padding is ignored)
      const inContent =
        x >= smallGeo.padLeft && x < smallGeo.padLeft + smallGeo.scaledW;
      modelAlpha[y * 16 + x] = inContent ? 255 : 180;
    }
  }
  const unpadded = unpadAndResizeAlphaBilinear(
    modelAlpha,
    16,
    16,
    6,
    8,
    smallGeo
  );
  assert.equal(unpadded.length, 6 * 8);
  for (let i = 0; i < unpadded.length; i++) {
    assert.equal(unpadded[i], 255);
  }
});

test('cleanRawNeuralAlphaMatte clamps wall noise to 0, solidifies shirt holes to 255, and removes stray islands', () => {
  const width = 30;
  const height = 30;
  const rawAlpha = new Uint8Array(width * height);

  // Faint background wall noise (alpha = 14) everywhere
  rawAlpha.fill(14);

  // Stray disconnected background island at top-left (2x2 pixels with alpha = 240)
  rawAlpha[1 * width + 1] = 240;
  rawAlpha[1 * width + 2] = 240;

  // Main portrait silhouette in center (10..22, 8..25)
  for (let y = 8; y <= 25; y++) {
    for (let x = 10; x <= 22; x++) {
      rawAlpha[y * width + x] = 235;
    }
  }

  // Create an enclosed pinhole inside the shirt at (16, 16) with alpha = 0
  rawAlpha[16 * width + 16] = 0;
  rawAlpha[16 * width + 17] = 10;

  const cleaned = cleanRawNeuralAlphaMatte(rawAlpha, width, height);

  // Wall noise (< 18) must be clamped to 0
  assert.equal(cleaned[0], 0);
  // Disconnected small island must be removed
  assert.equal(cleaned[1 * width + 1], 0);
  // Interior pinhole inside shirt must be filled to 255
  assert.equal(cleaned[16 * width + 16], 255);
  assert.equal(cleaned[16 * width + 17], 255);
  // Main subject interior is locked to 255
  assert.equal(cleaned[14 * width + 15], 255);
});

test('cleanRawNeuralAlphaMatte smart hole-fill preserves genuine arm-torso background openings while filling dark-shirt defects', () => {
  const width = 40;
  const height = 40;
  const rawAlpha = new Uint8Array(width * height);
  const srcRgba = new Uint8ClampedArray(width * height * 4);

  // Bright studio wall background (RGB = 220, 225, 235)
  for (let i = 0; i < width * height; i++) {
    srcRgba[i * 4] = 220;
    srcRgba[i * 4 + 1] = 225;
    srcRgba[i * 4 + 2] = 235;
    srcRgba[i * 4 + 3] = 255;
  }

  // Dark shirt silhouette (8..32, 8..34) with dark fabric RGB = (15, 18, 22)
  for (let y = 8; y <= 34; y++) {
    for (let x = 8; x <= 32; x++) {
      const i = y * width + x;
      rawAlpha[i] = 245;
      srcRgba[i * 4] = 15;
      srcRgba[i * 4 + 1] = 18;
      srcRgba[i * 4 + 2] = 22;
    }
  }

  // Case 1: Small dark-shirt defect at (14..15, 14..15) where RGB is dark shirt (15, 18, 22)
  for (let y = 14; y <= 15; y++) {
    for (let x = 14; x <= 15; x++) {
      rawAlpha[y * width + x] = 5;
    }
  }

  // Case 2: Genuine enclosed arm-torso gap at (22..27, 20..26) where RGB matches the bright studio wall (220, 225, 235) and rawAlpha = 0
  for (let y = 20; y <= 26; y++) {
    for (let x = 22; x <= 27; x++) {
      const i = y * width + x;
      rawAlpha[i] = 0;
      srcRgba[i * 4] = 220;
      srcRgba[i * 4 + 1] = 225;
      srcRgba[i * 4 + 2] = 235;
    }
  }

  const smartCleaned = cleanRawNeuralAlphaMatte(rawAlpha, width, height, {
    lowClamp: 18,
    highClamp: 230,
    sourceRgba: srcRgba,
    holeFillMode: 'smart',
  });

  // Dark shirt defect is filled to 255
  assert.equal(smartCleaned[14 * width + 14], 255);
  // Genuine bright-wall opening between arm and torso stays 0 (transparent)
  assert.equal(smartCleaned[23 * width + 24], 0);
});

test('computeAlphaMatteDiagnostics calculates IoU, Boundary F1, MAE, speckles, and holes', () => {
  const width = 24;
  const height = 24;
  const gt = new Uint8Array(width * height);
  const pred = new Uint8Array(width * height);

  for (let y = 6; y <= 18; y++) {
    for (let x = 6; x <= 18; x++) {
      gt[y * width + x] = 255;
      pred[y * width + x] = 255;
    }
  }

  const diag = computeAlphaMatteDiagnostics(pred, width, height, gt);
  assert.equal(diag.backgroundSpeckleCount, 0);
  assert.equal(diag.foregroundHoleCount, 0);
  assert.equal(diag.iouPct, 100);
  assert.equal(diag.maePct, 0);
});

test('refineAlphaMatteAndDefringe chokes (-1px) and expands (+1px) boundary while locking deep interior to 255', () => {
  const width = 20;
  const height = 20;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const baseMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const inSquare = x >= 5 && x <= 14 && y >= 5 && y <= 14;
      baseMask[i] = inSquare ? 255 : 0;
      const isBorder =
        inSquare && (x === 5 || x === 14 || y === 5 || y === 14);
      rgba[idx] = isBorder ? 240 : 20;
      rgba[idx + 1] = isBorder ? 240 : 20;
      rgba[idx + 2] = isBorder ? 240 : 25;
      rgba[idx + 3] = 255;
    }
  }

  const chokedRgba = new Uint8ClampedArray(rgba);
  refineAlphaMatteAndDefringe(chokedRgba, baseMask, width, height, -1, 0);
  assert.equal(chokedRgba[(10 * width + 5) * 4 + 3], 0);
  assert.equal(chokedRgba[(10 * width + 10) * 4 + 3], 255);

  const expandedRgba = new Uint8ClampedArray(rgba);
  refineAlphaMatteAndDefringe(expandedRgba, baseMask, width, height, 1, 0);
  assert.equal(expandedRgba[(10 * width + 4) * 4 + 3], 255);
  assert.equal(expandedRgba[(10 * width + 10) * 4 + 3], 255);
});

test('processSignatureAdaptiveInk (Bradley-Roth w=24, t=0.14) isolates blue/black ink and removes shadow', () => {
  const width = 48;
  const height = 24;
  const dataOrig = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isInk = y === 12 && x >= 8 && x <= 40;
      if (isInk) {
        dataOrig[idx] = 20;
        dataOrig[idx + 1] = 45;
        dataOrig[idx + 2] = 175;
        dataOrig[idx + 3] = 255;
      } else {
        const paper = 245 - Math.floor((x / width) * 110);
        dataOrig[idx] = paper;
        dataOrig[idx + 1] = paper;
        dataOrig[idx + 2] = paper;
        dataOrig[idx + 3] = 255;
      }
    }
  }

  const dataMono = new Uint8ClampedArray(dataOrig);

  processSignatureAdaptiveInk(dataOrig, width, height, true, 14, 'original', 24);
  const shadowPaperIdx = (3 * width + 44) * 4;
  assert.equal(dataOrig[shadowPaperIdx + 3], 0);
  const inkIdx = (12 * width + 24) * 4;
  assert.ok(dataOrig[inkIdx + 3] > 200);
  assert.ok(dataOrig[inkIdx + 2] > dataOrig[inkIdx] + 40);

  processSignatureAdaptiveInk(dataMono, width, height, true, 14, 'mono', 24);
  assert.equal(dataMono[shadowPaperIdx + 3], 0);
  assert.ok(dataMono[inkIdx + 3] > 200);
  assert.equal(dataMono[inkIdx], 10);
  assert.equal(dataMono[inkIdx + 1], 12);
  assert.equal(dataMono[inkIdx + 2], 16);
});
