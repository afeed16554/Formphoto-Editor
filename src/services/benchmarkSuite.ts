import { AlphaMatteDiagnostics } from '../utils/bgRemoverCore';
import { evaluateImageWithNeuralModel } from './neuralBgRemover';

export type BenchmarkScenarioId =
  | 'dark_hair_dark_bg'
  | 'black_shirt_hoodie'
  | 'glasses_portrait'
  | 'hands_fingers_gap'
  | 'fine_hair_bright_wall'
  | 'outdoor_night'
  | 'uneven_lighting_shadow'
  | 'multi_person_distracting';

export interface BenchmarkScenario {
  id: BenchmarkScenarioId;
  title: string;
  subtitle: string;
  challengeTag: string;
  width: number;
  height: number;
}

export interface GeneratedScenarioData {
  scenario: BenchmarkScenario;
  sourceDataUrl: string;
  sourceImage: HTMLImageElement;
  groundTruthAlpha: Uint8Array;
}

export interface ModelEvaluationView {
  modelId: string;
  backendUsed: string;
  inferenceMs: number;
  diagnostics: AlphaMatteDiagnostics;
  unrefinedDiagnostics: AlphaMatteDiagnostics;
  unrefinedMaskDataUrl: string;
  composites: {
    white: string;
    black: string;
    midgrey: string;
    skyblue: string;
    checker: string;
  };
}

export interface BenchmarkRunComparison {
  scenario: BenchmarkScenario;
  sourceDataUrl: string;
  rmbg14: ModelEvaluationView | null;
  modnet: ModelEvaluationView | null;
  recommendedTier: 'rmbg_14' | 'modnet';
  recommendationReason: string;
}

export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  {
    id: 'dark_hair_dark_bg',
    title: '1. Dark Hair on Dark Background',
    subtitle: 'Low-contrast dark curls against a charcoal studio wall',
    challengeTag: 'Low Contrast Silhouette',
    width: 320,
    height: 380,
  },
  {
    id: 'black_shirt_hoodie',
    title: '2. Black Shirt / Hoodie',
    subtitle: 'Deep matte-black fabric prone to salt-and-pepper interior holes',
    challengeTag: 'Interior Solidity',
    width: 320,
    height: 380,
  },
  {
    id: 'glasses_portrait',
    title: '3. Subject Wearing Glasses',
    subtitle: 'Thin dark eyeglass frames with specular lens reflections',
    challengeTag: 'Fine Frame Preservation',
    width: 320,
    height: 380,
  },
  {
    id: 'hands_fingers_gap',
    title: '4. Hands / Fingers & Arm-Torso Gap',
    subtitle: 'Raised hand near shoulder with a real background gap under arm',
    challengeTag: 'Smart Hole Distinction',
    width: 320,
    height: 380,
  },
  {
    id: 'fine_hair_bright_wall',
    title: '5. Fine Hair on Bright Wall',
    subtitle: 'Backlit wisps against a high-luminance sunlit wall (halo test)',
    challengeTag: 'Edge Halo & Defringe',
    width: 320,
    height: 380,
  },
  {
    id: 'outdoor_night',
    title: '6. Outdoor Night / Bokeh Lights',
    subtitle: 'Warm streetlamps and high-ISO background chroma grain',
    challengeTag: 'Background Speckle Suppression',
    width: 320,
    height: 380,
  },
  {
    id: 'uneven_lighting_shadow',
    title: '7. Uneven Lighting & Wall Shadow',
    subtitle: 'Directional desk lamp casting a diagonal shadow behind shoulder',
    challengeTag: 'Shadow Rejection',
    width: 320,
    height: 380,
  },
  {
    id: 'multi_person_distracting',
    title: '8. Distracting Background Objects',
    subtitle: 'Primary applicant with a secondary bystander silhouette in corner',
    challengeTag: 'Primary Subject Isolation',
    width: 320,
    height: 380,
  },
];

function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

/**
 * Generates a deterministic, realistic multi-layered portrait test image and its exact
 * ground-truth alpha mask `(width × height)` so the benchmark suite can compute real
 * IoU, Boundary F1, MAE, background speckle counts, and interior hole counts.
 */
export async function generateBenchmarkScenario(
  scenarioId: BenchmarkScenarioId
): Promise<GeneratedScenarioData> {
  const scenario =
    BENCHMARK_SCENARIOS.find((s) => s.id === scenarioId) ||
    BENCHMARK_SCENARIOS[0];
  const { width: w, height: h } = scenario;

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = w;
  bgCanvas.height = h;
  const bgCtx = bgCanvas.getContext('2d')!;

  // 1. Render scenario-specific background
  if (scenario.id === 'dark_hair_dark_bg') {
    const grad = bgCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1e222b');
    grad.addColorStop(1, '#12151c');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, w, h);
  } else if (scenario.id === 'black_shirt_hoodie') {
    const grad = bgCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#64748b');
    grad.addColorStop(1, '#334155');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, w, h);
  } else if (scenario.id === 'fine_hair_bright_wall') {
    bgCtx.fillStyle = '#f8fafc';
    bgCtx.fillRect(0, 0, w, h);
    const radial = bgCtx.createRadialGradient(
      w * 0.5,
      h * 0.3,
      20,
      w * 0.5,
      h * 0.3,
      w * 0.75
    );
    radial.addColorStop(0, '#ffffff');
    radial.addColorStop(1, '#e2e8f0');
    bgCtx.fillStyle = radial;
    bgCtx.fillRect(0, 0, w, h);
  } else if (scenario.id === 'outdoor_night') {
    bgCtx.fillStyle = '#0f172a';
    bgCtx.fillRect(0, 0, w, h);
    const bokehColors = [
      'rgba(251, 191, 36, 0.35)',
      'rgba(56, 189, 248, 0.28)',
      'rgba(244, 63, 94, 0.25)',
    ];
    for (let i = 0; i < 14; i++) {
      bgCtx.fillStyle = bokehColors[i % bokehColors.length];
      bgCtx.beginPath();
      bgCtx.arc(
        ((i * 73) % (w - 40)) + 20,
        ((i * 53) % (h * 0.65)) + 20,
        14 + (i % 4) * 6,
        0,
        Math.PI * 2
      );
      bgCtx.fill();
    }
  } else if (scenario.id === 'uneven_lighting_shadow') {
    const grad = bgCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.55, '#cbd5e1');
    grad.addColorStop(1, '#475569');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, w, h);
    // Cast wall shadow behind right shoulder
    bgCtx.fillStyle = 'rgba(15, 23, 42, 0.42)';
    bgCtx.beginPath();
    bgCtx.ellipse(w * 0.68, h * 0.62, w * 0.26, h * 0.32, 0.2, 0, Math.PI * 2);
    bgCtx.fill();
  } else if (scenario.id === 'multi_person_distracting') {
    bgCtx.fillStyle = '#cbd5e1';
    bgCtx.fillRect(0, 0, w, h);
    // Distracting background frame & distant secondary figure on left edge
    bgCtx.fillStyle = '#475569';
    bgCtx.fillRect(14, 30, 58, 76);
    bgCtx.fillStyle = '#64748b';
    bgCtx.beginPath();
    bgCtx.arc(42, h * 0.58, 22, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.fillRect(16, h * 0.65, 52, 95);
  } else {
    const grad = bgCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(1, '#475569');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, w, h);
  }

  // 2. Render primary foreground subject onto a separate transparent canvas to capture exact ground-truth alpha
  const fgCanvas = document.createElement('canvas');
  fgCanvas.width = w;
  fgCanvas.height = h;
  const fgCtx = fgCanvas.getContext('2d')!;

  const cx = w * 0.5;
  const headY = h * 0.37;
  const headRx = w * 0.19;
  const headRy = h * 0.21;

  // Hair back layer
  fgCtx.fillStyle =
    scenario.id === 'dark_hair_dark_bg' || scenario.id === 'black_shirt_hoodie'
      ? '#0f1319'
      : '#1e1b18';
  fgCtx.beginPath();
  fgCtx.ellipse(cx, headY - 8, headRx * 1.16, headRy * 1.12, 0, 0, Math.PI * 2);
  fgCtx.fill();

  if (scenario.id === 'fine_hair_bright_wall') {
    fgCtx.strokeStyle = 'rgba(30, 27, 24, 0.65)';
    fgCtx.lineWidth = 2.2;
    for (let a = -150; a <= -30; a += 8) {
      const rad = (a * Math.PI) / 180;
      const sx = cx + Math.cos(rad) * headRx * 1.05;
      const sy = headY - 8 + Math.sin(rad) * headRy * 1.05;
      fgCtx.beginPath();
      fgCtx.moveTo(sx, sy);
      fgCtx.quadraticCurveTo(
        sx + Math.cos(rad) * 14,
        sy + Math.sin(rad) * 10 - 6,
        sx + Math.cos(rad) * 20,
        sy + Math.sin(rad) * 18
      );
      fgCtx.stroke();
    }
  }

  // Torso / Shoulders / Hoodie
  const shirtColor =
    scenario.id === 'black_shirt_hoodie' || scenario.id === 'dark_hair_dark_bg'
      ? '#0b0d12'
      : scenario.id === 'outdoor_night'
        ? '#172554'
        : '#1e293b';
  fgCtx.fillStyle = shirtColor;
  fgCtx.beginPath();
  fgCtx.moveTo(cx - w * 0.36, h);
  fgCtx.quadraticCurveTo(cx - w * 0.35, h * 0.67, cx - w * 0.14, h * 0.62);
  fgCtx.lineTo(cx + w * 0.14, h * 0.62);
  fgCtx.quadraticCurveTo(cx + w * 0.35, h * 0.67, cx + w * 0.36, h);
  fgCtx.closePath();
  fgCtx.fill();

  // Optional raised arm & hand with genuine arm-torso background gap
  if (scenario.id === 'hands_fingers_gap') {
    // Outer raised arm loop creating an enclosed background opening between arm and torso
    fgCtx.lineWidth = 26;
    fgCtx.lineCap = 'round';
    fgCtx.lineJoin = 'round';
    fgCtx.strokeStyle = shirtColor;
    fgCtx.beginPath();
    fgCtx.moveTo(cx + w * 0.25, h * 0.92);
    fgCtx.lineTo(cx + w * 0.41, h * 0.75);
    fgCtx.lineTo(cx + w * 0.28, h * 0.59);
    fgCtx.stroke();

    // Hand & fingers near collar
    fgCtx.fillStyle = '#dca582';
    fgCtx.beginPath();
    fgCtx.arc(cx + w * 0.24, h * 0.57, 13, 0, Math.PI * 2);
    fgCtx.fill();
  }

  // Neck
  fgCtx.fillStyle = '#d49b78';
  fgCtx.fillRect(cx - w * 0.08, h * 0.52, w * 0.16, h * 0.14);

  // Shirt V-neck / collar highlight
  fgCtx.fillStyle =
    scenario.id === 'black_shirt_hoodie' ? '#181c24' : '#f8fafc';
  fgCtx.beginPath();
  fgCtx.moveTo(cx - w * 0.09, h * 0.61);
  fgCtx.lineTo(cx, h * 0.72);
  fgCtx.lineTo(cx + w * 0.09, h * 0.61);
  fgCtx.closePath();
  fgCtx.fill();

  // Ears
  fgCtx.fillStyle = '#d49b78';
  fgCtx.beginPath();
  fgCtx.ellipse(cx - headRx * 0.98, headY + 4, 8, 16, 0, 0, Math.PI * 2);
  fgCtx.ellipse(cx + headRx * 0.98, headY + 4, 8, 16, 0, 0, Math.PI * 2);
  fgCtx.fill();

  // Face oval
  const faceGrad = fgCtx.createRadialGradient(
    cx - 10,
    headY - 12,
    8,
    cx,
    headY,
    headRy * 1.05
  );
  faceGrad.addColorStop(0, '#ecc0a1');
  faceGrad.addColorStop(1, '#cfa17e');
  fgCtx.fillStyle = faceGrad;
  fgCtx.beginPath();
  fgCtx.ellipse(cx, headY, headRx, headRy, 0, 0, Math.PI * 2);
  fgCtx.fill();

  // Top Hair Crown
  fgCtx.fillStyle =
    scenario.id === 'dark_hair_dark_bg' || scenario.id === 'black_shirt_hoodie'
      ? '#0a0d12'
      : '#1b1815';
  fgCtx.beginPath();
  fgCtx.ellipse(
    cx,
    headY - headRy * 0.45,
    headRx * 1.04,
    headRy * 0.62,
    0,
    Math.PI,
    0,
    false
  );
  fgCtx.fill();

  // Eyes & Brows
  fgCtx.fillStyle = '#1e293b';
  fgCtx.beginPath();
  fgCtx.arc(cx - headRx * 0.36, headY - 4, 5, 0, Math.PI * 2);
  fgCtx.arc(cx + headRx * 0.36, headY - 4, 5, 0, Math.PI * 2);
  fgCtx.fill();

  // Glasses scenario
  if (scenario.id === 'glasses_portrait') {
    fgCtx.strokeStyle = '#0f172a';
    fgCtx.lineWidth = 3.2;
    fgCtx.strokeRect(cx - headRx * 0.68, headY - 18, headRx * 0.56, 26);
    fgCtx.strokeRect(cx + headRx * 0.12, headY - 18, headRx * 0.56, 26);
    fgCtx.beginPath();
    fgCtx.moveTo(cx - headRx * 0.12, headY - 6);
    fgCtx.lineTo(cx + headRx * 0.12, headY - 6);
    fgCtx.stroke();
    // Subtle specular glare on lenses
    fgCtx.fillStyle = 'rgba(255, 255, 255, 0.26)';
    fgCtx.fillRect(cx - headRx * 0.62, headY - 14, 14, 8);
    fgCtx.fillRect(cx + headRx * 0.18, headY - 14, 14, 8);
  }

  // Lips
  fgCtx.fillStyle = '#9f4a54';
  fgCtx.beginPath();
  fgCtx.ellipse(cx, headY + headRy * 0.46, 15, 6.5, 0, 0, Math.PI * 2);
  fgCtx.fill();

  // Extract ground-truth alpha mask from fgCanvas
  const fgData = fgCtx.getImageData(0, 0, w, h).data;
  const groundTruthAlpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    groundTruthAlpha[i] = fgData[i * 4 + 3];
  }

  // Composite fgCanvas onto bgCanvas
  bgCtx.drawImage(fgCanvas, 0, 0);
  const sourceDataUrl = bgCanvas.toDataURL('image/png');
  const sourceImage = await createImageFromDataUrl(sourceDataUrl);

  return {
    scenario,
    sourceDataUrl,
    sourceImage,
    groundTruthAlpha,
  };
}

function renderMaskCompositeOnBackground(
  maskCanvas: HTMLCanvasElement,
  bgHexOrChecker: string
): string {
  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  if (bgHexOrChecker === 'checker') {
    const tile = 12;
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const even = ((x / tile + y / tile) | 0) % 2 === 0;
        ctx.fillStyle = even ? '#cbd5e1' : '#94a3b8';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  } else {
    ctx.fillStyle = bgHexOrChecker;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(maskCanvas, 0, 0);
  return c.toDataURL('image/png');
}

function buildEvaluationView(
  res: Awaited<ReturnType<typeof evaluateImageWithNeuralModel>>
): ModelEvaluationView {
  return {
    modelId: res.modelId,
    backendUsed: res.backendUsed,
    inferenceMs: res.inferenceDurationMs,
    diagnostics: res.refinedDiagnostics,
    unrefinedDiagnostics: res.rawDiagnostics,
    unrefinedMaskDataUrl: res.rawMaskCanvas.toDataURL('image/png'),
    composites: {
      white: renderMaskCompositeOnBackground(res.refinedMaskCanvas, '#ffffff'),
      black: renderMaskCompositeOnBackground(res.refinedMaskCanvas, '#000000'),
      midgrey: renderMaskCompositeOnBackground(res.refinedMaskCanvas, '#808080'),
      skyblue: renderMaskCompositeOnBackground(res.refinedMaskCanvas, '#38bdf8'),
      checker: renderMaskCompositeOnBackground(res.refinedMaskCanvas, 'checker'),
    },
  };
}

/**
 * Runs a side-by-side comparison of `briaai/RMBG-1.4` and `Xenova/modnet`
 * on a benchmark scenario (or custom uploaded photo) and returns quantitative
 * diagnostics and composite previews.
 */
export async function runScenarioBenchmarkComparison(
  scenarioId: BenchmarkScenarioId,
  onStatus?: (msg: string) => void
): Promise<BenchmarkRunComparison> {
  onStatus?.('Synthesizing calibrated portrait scenario & ground-truth mask…');
  const generated = await generateBenchmarkScenario(scenarioId);

  let rmbg14: ModelEvaluationView | null = null;
  let modnet: ModelEvaluationView | null = null;

  try {
    onStatus?.('Evaluating briaai/RMBG-1.4 (1024×1024)…');
    const rawRmbg = await evaluateImageWithNeuralModel(
      generated.sourceImage,
      'rmbg_14',
      generated.groundTruthAlpha
    );
    rmbg14 = buildEvaluationView(rawRmbg);
  } catch (err) {
    console.warn('RMBG-1.4 benchmark error:', err);
  }

  try {
    onStatus?.('Evaluating Xenova/modnet (512×512)…');
    const rawModnet = await evaluateImageWithNeuralModel(
      generated.sourceImage,
      'modnet',
      generated.groundTruthAlpha
    );
    modnet = buildEvaluationView(rawModnet);
  } catch (err) {
    console.warn('MODNet benchmark error:', err);
  }

  let recommendedTier: 'rmbg_14' | 'modnet' = 'rmbg_14';
  let recommendationReason =
    'briaai/RMBG-1.4 operates at 1024×1024 resolution, preserving finer hair, glasses frames, and torso edges with lower MAE.';

  if (rmbg14 && modnet) {
    const rmbgIoU = rmbg14.diagnostics.iouPct ?? 0;
    const modnetIoU = modnet.diagnostics.iouPct ?? 0;
    if (modnetIoU > rmbgIoU + 1.5) {
      recommendedTier = 'modnet';
      recommendationReason = `Xenova/modnet achieved higher IoU (${modnetIoU}% vs ${rmbgIoU}%) on this portrait scenario.`;
    } else {
      recommendedTier = 'rmbg_14';
      recommendationReason = `briaai/RMBG-1.4 achieved ${rmbgIoU}% IoU (${rmbg14.diagnostics.boundaryF1Pct ?? 0}% Boundary F1) with ${rmbg14.diagnostics.backgroundSpeckleCount} background speckles and ${rmbg14.diagnostics.foregroundHoleCount} interior holes.`;
    }
  }

  onStatus?.('Benchmark complete.');
  return {
    scenario: generated.scenario,
    sourceDataUrl: generated.sourceDataUrl,
    rmbg14,
    modnet,
    recommendedTier,
    recommendationReason,
  };
}

export function formatDiagnosticsSummary(d: AlphaMatteDiagnostics): string {
  const parts = [
    `BG Speckles: ${d.backgroundSpeckleCount}`,
    `FG Holes: ${d.foregroundHoleCount}`,
    `Edge Smoothness: ${d.boundarySmoothnessPct}%`,
  ];
  if (d.iouPct !== undefined) {
    parts.unshift(`IoU: ${d.iouPct}%`);
  }
  if (d.boundaryF1Pct !== undefined) {
    parts.push(`Boundary F1: ${d.boundaryF1Pct}%`);
  }
  return parts.join(' • ');
}
