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
  rgbToLab,
  labDistanceShadowAware,
  processPortraitHighQualityCutout,
  processSignatureAdaptiveInk,
  refineAlphaMatteAndDefringe,
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

test('refineAlphaMatteAndDefringe chokes (-2px) and expands (+2px) alpha mask and decontaminates halo', () => {
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
      // Interior is dark hair (20,20,25), border has bright halo (240,240,240)
      const isBorder =
        inSquare && (x === 5 || x === 14 || y === 5 || y === 14);
      rgba[idx] = isBorder ? 240 : 20;
      rgba[idx + 1] = isBorder ? 240 : 20;
      rgba[idx + 2] = isBorder ? 240 : 25;
      rgba[idx + 3] = 255;
    }
  }

  // Choke by -1px with 0 feather: border at x=5, y=10 should become transparent (alpha=0)
  const chokedRgba = new Uint8ClampedArray(rgba);
  refineAlphaMatteAndDefringe(chokedRgba, baseMask, width, height, -1, 0);
  assert.equal(chokedRgba[(10 * width + 5) * 4 + 3], 0);
  // Deep interior at x=10, y=10 remains opaque (alpha=255)
  assert.equal(chokedRgba[(10 * width + 10) * 4 + 3], 255);

  // Expand by +1px with 0 feather: outside neighbor at x=4, y=10 becomes opaque (alpha=255)
  const expandedRgba = new Uint8ClampedArray(rgba);
  refineAlphaMatteAndDefringe(expandedRgba, baseMask, width, height, 1, 0);
  assert.equal(expandedRgba[(10 * width + 4) * 4 + 3], 255);
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
        // Royal blue ballpoint pen ink
        dataOrig[idx] = 20;
        dataOrig[idx + 1] = 45;
        dataOrig[idx + 2] = 175;
        dataOrig[idx + 3] = 255;
      } else {
        // Strong phone shadow gradient across paper (245 on left down to 135 on right)
        const paper = 245 - Math.floor((x / width) * 110);
        dataOrig[idx] = paper;
        dataOrig[idx + 1] = paper;
        dataOrig[idx + 2] = paper;
        dataOrig[idx + 3] = 255;
      }
    }
  }

  const dataMono = new Uint8ClampedArray(dataOrig);

  // 1. Test Preserve Original Blue/Black Ink ('original') with w=24, t=0.14 (14)
  processSignatureAdaptiveInk(dataOrig, width, height, true, 14, 'original', 24);
  const shadowPaperIdx = (3 * width + 44) * 4;
  assert.equal(dataOrig[shadowPaperIdx + 3], 0); // Phone shadow on paper cleanly removed
  const inkIdx = (12 * width + 24) * 4;
  assert.ok(dataOrig[inkIdx + 3] > 200); // Thin pen stroke preserved
  assert.ok(dataOrig[inkIdx + 2] > dataOrig[inkIdx] + 40); // Blue ink channel remains distinctly blue

  // 2. Test Pure Monochrome Black ('mono')
  processSignatureAdaptiveInk(dataMono, width, height, true, 14, 'mono', 24);
  assert.equal(dataMono[shadowPaperIdx + 3], 0);
  assert.ok(dataMono[inkIdx + 3] > 200);
  assert.equal(dataMono[inkIdx], 10);
  assert.equal(dataMono[inkIdx + 1], 12);
  assert.equal(dataMono[inkIdx + 2], 16);
});

test('processPortraitHighQualityCutout removes background while preserving center subject', () => {
  const width = 40;
  const height = 40;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - 20;
      const dy = y - 22;
      const isSubject = dx * dx + dy * dy <= 100;
      if (isSubject) {
        data[idx] = 35;
        data[idx + 1] = 45;
        data[idx + 2] = 75;
        data[idx + 3] = 255;
      } else {
        data[idx] = 225 - Math.floor(y * 0.4);
        data[idx + 1] = 230 - Math.floor(y * 0.4);
        data[idx + 2] = 238 - Math.floor(y * 0.4);
        data[idx + 3] = 255;
      }
    }
  }

  processPortraitHighQualityCutout(data, width, height, 36, 1.5, 0);

  const cornerIdx = (1 * width + 1) * 4;
  assert.equal(data[cornerIdx + 3], 0);

  const centerIdx = (22 * width + 20) * 4;
  assert.equal(data[centerIdx + 3], 255);
});

test('rgbToLab and labDistanceShadowAware compute perceptual distances', () => {
  const white = rgbToLab(250, 250, 250);
  const shadowedWhite = rgbToLab(215, 215, 215);
  const darkHair = rgbToLab(25, 22, 20);
  const distShadow = labDistanceShadowAware(white, shadowedWhite);
  const distHair = labDistanceShadowAware(white, darkHair);
  assert.ok(distShadow < distHair);
});
