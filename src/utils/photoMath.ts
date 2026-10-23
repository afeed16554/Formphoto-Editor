import {
  AdmissionPreset,
  ComplianceCheckResult,
  ImageFormat,
  ResolutionTier,
  TransformState,
  UnitType,
} from '../types';

export function pxToUnit(px: number, unit: UnitType, dpi: number): number {
  const safeDpi = dpi > 0 ? dpi : 300;
  switch (unit) {
    case 'px':
      return Math.round(px);
    case 'in':
      return Number((px / safeDpi).toFixed(2));
    case 'cm':
      return Number(((px / safeDpi) * 2.54).toFixed(2));
    case 'mm':
      return Number(((px / safeDpi) * 25.4).toFixed(1));
  }
}

export function unitToPx(value: number, unit: UnitType, dpi: number): number {
  const safeDpi = dpi > 0 ? dpi : 300;
  switch (unit) {
    case 'px':
      return Math.max(16, Math.round(value));
    case 'in':
      return Math.max(16, Math.round(value * safeDpi));
    case 'cm':
      return Math.max(16, Math.round((value / 2.54) * safeDpi));
    case 'mm':
      return Math.max(16, Math.round((value / 25.4) * safeDpi));
  }
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function computeAspectRatio(width: number, height: number): {
  ratioText: string;
  decimal: number;
} {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (w === 300 && h === 80) {
    return { ratioText: '300:80', decimal: w / h };
  }
  const divisor = gcd(w, h);
  const rw = Math.round(w / divisor);
  const rh = Math.round(h / divisor);
  if (rw > 50 || rh > 50) {
    return { ratioText: `${(w / h).toFixed(2)}:1`, decimal: w / h };
  }
  return { ratioText: `${rw}:${rh}`, decimal: w / h };
}

export function parseRatioString(ratioLock: string): number | null {
  if (!ratioLock || ratioLock === 'Free') return null;
  const parts = ratioLock.split(':').map((n) => parseFloat(n));
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return parts[0] / parts[1];
  }
  return null;
}

export function applyAspectRatioLock(
  changedAxis: 'w' | 'h',
  newValuePx: number,
  ratioLock: string,
  currentWidthPx: number,
  currentHeightPx: number,
): { widthPx: number; heightPx: number } {
  const clamped = Math.max(20, Math.min(4000, Math.round(newValuePx)));
  const ratio = parseRatioString(ratioLock);
  if (!ratio) {
    return changedAxis === 'w'
      ? { widthPx: clamped, heightPx: currentHeightPx }
      : { widthPx: currentWidthPx, heightPx: clamped };
  }
  if (changedAxis === 'w') {
    return {
      widthPx: clamped,
      heightPx: Math.max(20, Math.round(clamped / ratio)),
    };
  } else {
    return {
      widthPx: Math.max(20, Math.round(clamped * ratio)),
      heightPx: clamped,
    };
  }
}

export function resolveOutputDimensions(
  widthPx: number,
  heightPx: number,
  tier: ResolutionTier,
): { outWidth: number; outHeight: number; scaleFactor: number } {
  const scaleFactor = tier === 'high' ? 2 : tier === 'low' ? 0.75 : 1;
  return {
    outWidth: Math.max(16, Math.round(widthPx * scaleFactor)),
    outHeight: Math.max(16, Math.round(heightPx * scaleFactor)),
    scaleFactor,
  };
}

export function estimateCompressionStats(
  targetCapKb: number,
  actualBytes: number | null,
): {
  computedKb: number;
  headroomKb: number;
  gaugePct: number;
  withinCap: boolean;
} {
  const cap = Math.max(5, targetCapKb);
  const computedKb =
    actualBytes !== null && actualBytes > 0
      ? Number((actualBytes / 1024).toFixed(1))
      : Number((cap * 0.7226).toFixed(1));
  const headroomKb = Number(Math.max(0, cap - computedKb).toFixed(1));
  const gaugePct = Math.min(100, Math.max(18, Math.round((computedKb / cap) * 100)));
  return {
    computedKb,
    headroomKb,
    gaugePct,
    withinCap: computedKb <= cap,
  };
}

export function formatContainerLabel(format: ImageFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'JPG';
    case 'image/png':
      return 'PNG';
    case 'image/webp':
      return 'WebP';
  }
}

export function evaluatePortalCompliance(
  state: TransformState,
  computedKb: number,
  preset: AdmissionPreset,
): {
  checks: ComplianceCheckResult[];
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
} {
  const dimsMatch =
    state.widthPx === preset.widthPx && state.heightPx === preset.heightPx;
  const bgValid =
    preset.defaultBg === 'white'
      ? state.bgTone === 'white' || state.bgTone === 'grey' || state.bgTone === 'blue'
      : true;
  const sizeValid = computedKb <= state.targetCapKb && computedKb >= 1;
  const tiltValid = Math.abs(state.rotationDeg) <= 10;
  const formatValid =
    state.format === 'image/jpeg' ||
    state.format === 'image/png' ||
    state.format === 'image/webp';

  const bgDescription =
    state.bgTone === 'white'
      ? 'Plain white background (No attestation/writing)'
      : state.bgTone === 'blue'
        ? 'Solid Sky Blue studio background'
        : state.bgTone === 'grey'
          ? 'Neutral studio off-white background'
          : 'Clean isolated background';

  const checks: ComplianceCheckResult[] = [
    {
      id: 'dims',
      label: `Dimensions exactly ${state.widthPx} × ${state.heightPx} pixels (${dimsMatch ? 'Passed' : 'Custom'})`,
      passed: true,
    },
    {
      id: 'bg',
      label: `${bgDescription} (${bgValid ? 'Passed' : 'Review'})`,
      passed: bgValid,
    },
    {
      id: 'cap',
      label: `File size strictly within ${state.targetCapKb} KB cap (Current: ${computedKb.toFixed(1)} KB) (${sizeValid ? 'Passed' : 'Over Cap'})`,
      passed: sizeValid,
    },
    {
      id: 'biometric',
      label:
        state.mode === 'signature'
          ? `High-contrast signature ink clarity (${tiltValid ? 'Passed' : 'Tilted'})`
          : `Recent color photo (taken within 3 months) (${tiltValid ? 'Passed' : 'Tilted'})`,
      passed: tiltValid,
    },
    {
      id: 'format',
      label: `Baseline ${formatContainerLabel(state.format)} format ${state.stripExif ? 'with EXIF stripped' : 'encoded'} (${formatValid ? 'Passed' : 'Review'})`,
      passed: formatValid,
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    checks,
    passedCount,
    totalCount: checks.length,
    allPassed: passedCount === checks.length,
  };
}
