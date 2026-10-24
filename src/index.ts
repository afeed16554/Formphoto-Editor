import {
  ADMISSION_PRESETS,
  BG_TONE_HEX,
  PRESET_CHIP_ORDER,
  THEMES,
} from './constants';
import {
  BENCHMARK_SCENARIOS,
  BenchmarkRunComparison,
  BenchmarkScenarioId,
  generateBenchmarkScenario,
  runScenarioBenchmarkComparison,
} from './services/benchmarkSuite';
import {
  mapOutputPointToSourceNormalized,
  ProcessedExportResult,
  renderProcessedOutput,
} from './services/imageProcessor';
import {
  beginAlphaBrushStroke,
  canRedoAlphaBrush,
  canUndoAlphaBrush,
  clearCachedNeuralMatte,
  detectAndCachePreClippedImage,
  getAlphaRefinementConfig,
  getCachedNeuralMatte,
  getRuntimeDiagnostics,
  NeuralMattingProgress,
  NeuralModelTier,
  paintCachedAlphaBrushStroke,
  redoAlphaBrushStroke,
  resetManualAlphaBrushEdits,
  runNeuralPortraitMatting,
  subscribeNeuralProgress,
  undoAlphaBrushStroke,
  updateAlphaRefinementConfig,
} from './services/neuralBgRemover';
import { downloadA4PrintableSheetPdf } from './services/pdfSheetExporter';
import {
  AdmissionPreset,
  BgToneKey,
  ExportRecord,
  ImageFormat,
  ResolutionTier,
  SigInkColorMode,
  ThemeKey,
  TransformState,
  UnitType,
  ViewMode,
} from './types';
import { HoleFillMode } from './utils/bgRemoverCore';
import {
  applyAspectRatioLock,
  computeAspectRatio,
  evaluatePortalCompliance,
  pxToUnit,
  unitToPx,
} from './utils/photoMath';

export type WorkflowStep = 'photo' | 'adjust' | 'export';

const INITIAL_STATE: TransformState = {
  mode: 'photo',
  presetId: 'buet',
  widthPx: 300,
  heightPx: 350,
  unit: 'px',
  dpi: 300,
  aspectRatioLock: '6:7',
  rotationDeg: 0,
  scalePct: 100,
  offsetX: 0,
  offsetY: 0,
  flipH: false,
  flipV: false,
  bgTone: 'white',
  customBgColor: '#dbeafe',
  bgRemovalEnabled: true,
  bgTolerance: 30,
  bgChokePx: 0,
  bgFeather: 0,
  sigHighContrast: false,
  sigInkColorMode: 'original',
  sigThreshold: 14,
  format: 'image/jpeg',
  formatExtLabel: 'JPG',
  targetCapKb: 75,
  qualityPct: 90,
  resolutionTier: 'standard',
  stripExif: true,
  viewMode: 'single',
  zoomPct: 100,
  showGrid: true,
  showMaskOverlay: false,
  splitPositionPct: 50,
  theme: 'warm', // Default to student-friendly warm reading tone per requirements
};

const THEME_KEYS: ThemeKey[] = ['warm', 'oled', 'light', 'gray'];

type TouchUpBrushMode = 'off' | 'erase' | 'restore';
type BenchmarkBgKey = 'white' | 'black' | 'midgrey' | 'skyblue' | 'checker';

function triggerDataUrlDownload(dataUrl: string, filename: string): void {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

class FormPhotoProStudio {
  private state: TransformState = { ...INITIAL_STATE };
  private activeStep: WorkflowStep = 'photo';
  private rawImageEl: HTMLImageElement | null = null;
  private rawImageBlob: Blob | null = null;
  private neuralModelTier: NeuralModelTier = 'rmbg_14';
  private brushMode: TouchUpBrushMode = 'off';
  private brushSizePx = 22;
  private selectedBenchmarkScenario: BenchmarkScenarioId = 'black_shirt_hoodie';
  private benchmarkBgKey: BenchmarkBgKey = 'white';
  private lastBenchmarkComparison: BenchmarkRunComparison | null = null;

  private customUploadedFile: {
    name: string;
    sizeKb: number;
    width: number;
    height: number;
    url: string;
  } | null = null;

  private lastResult: ProcessedExportResult | null = null;
  private exportHistory: ExportRecord[] = [];
  private toastTimer: number | null = null;
  private renderDebounceTimer: number | null = null;
  private isDraggingCanvas = false;
  private dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };

  init(): void {
    this.applyThemeClass(this.state.theme);
    this.mountInitialShell();
    subscribeNeuralProgress((prog) => {
      this.syncNeuralProgressUI(prog);
      this.syncRuntimeDiagnosticsPanel();
    });
    this.runPipelineAndSyncUI();
  }

  private applyThemeClass(theme: ThemeKey): void {
    const html = document.documentElement;
    THEME_KEYS.forEach((k) => html.classList.remove(`theme-${k}`));
    html.classList.add(`theme-${theme}`);
    html.setAttribute('data-theme', theme);
  }

  private getAllPresetsList(): AdmissionPreset[] {
    return PRESET_CHIP_ORDER.map((id) => ADMISSION_PRESETS[id]).filter(Boolean);
  }

  private getActivePreset(): AdmissionPreset {
    return ADMISSION_PRESETS[this.state.presetId] || ADMISSION_PRESETS.buet;
  }

  private showToast(msg: string): void {
    const toastEl = document.getElementById('m3-toast-banner');
    const toastTextEl = document.getElementById('m3-toast-text');
    if (toastEl && toastTextEl) {
      toastTextEl.textContent = msg;
      toastEl.classList.remove(
        'opacity-0',
        'pointer-events-none',
        'translate-y-4'
      );
      toastEl.classList.add('opacity-100', 'translate-y-0');
    }
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      const el = document.getElementById('m3-toast-banner');
      if (el) {
        el.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        el.classList.remove('opacity-100', 'translate-y-0');
      }
    }, 3200);
  }

  private triggerNeuralMattingIfNeeded(forceAiEvenIfPreClipped = false): void {
    if (
      !this.rawImageEl ||
      this.state.mode !== 'photo' ||
      !this.state.bgRemovalEnabled
    ) {
      return;
    }

    if (!forceAiEvenIfPreClipped) {
      const existing = getCachedNeuralMatte(
        this.rawImageEl,
        this.neuralModelTier
      );
      if (existing) {
        this.runPipelineAndSyncUI();
        return;
      }
    }

    void runNeuralPortraitMatting(
      this.rawImageEl,
      this.rawImageBlob,
      this.neuralModelTier,
      () => {
        this.runPipelineAndSyncUI();
      },
      forceAiEvenIfPreClipped
    );
  }

  private syncNeuralProgressUI(prog: NeuralMattingProgress): void {
    const labelEl = document.getElementById('neural-stage-label');
    const barEl = document.getElementById('neural-progress-bar');
    const badgeEl = document.getElementById('neural-idb-badge');
    const canvasOverlay = document.getElementById('canvas-neural-loading-pill');
    const canvasOverlayText = document.getElementById(
      'canvas-neural-loading-text'
    );
    const bgStatusPill = document.getElementById('step1-bg-status');

    if (labelEl) labelEl.textContent = prog.stageLabel;
    if (barEl) {
      const pct =
        prog.status === 'idle' ||
        prog.status === 'ready' ||
        prog.status === 'preclipped'
          ? 100
          : Math.max(5, Math.min(100, prog.progressPct));
      barEl.style.width = `${pct}%`;
    }
    if (badgeEl) {
      badgeEl.textContent =
        prog.status === 'downloading' || prog.status === 'inferring'
          ? `${prog.progressPct}%`
          : prog.status === 'preclipped'
            ? 'PRE-CLIPPED'
            : prog.status === 'ready'
              ? 'ACTIVE'
              : prog.status === 'error'
                ? 'RETRY'
                : 'READY';
    }
    if (bgStatusPill) {
      if (prog.status === 'inferring' || prog.status === 'downloading') {
        bgStatusPill.textContent = 'Removing Background…';
        bgStatusPill.className =
          'text-[11px] font-mono font-bold text-amber-500 animate-pulse';
      } else if (prog.status === 'preclipped') {
        bgStatusPill.textContent = 'Pre-Clipped PNG (Ready)';
        bgStatusPill.className =
          'text-[11px] font-mono font-bold text-emerald-600';
      } else if (this.state.bgRemovalEnabled) {
        bgStatusPill.textContent = 'Background Removed Automatically';
        bgStatusPill.className =
          'text-[11px] font-mono font-bold text-emerald-600';
      } else {
        bgStatusPill.textContent = 'Original Background Kept';
        bgStatusPill.className = 'text-[11px] font-mono m3-text-muted';
      }
    }
    if (canvasOverlay && canvasOverlayText) {
      const isBusy =
        this.state.mode === 'photo' &&
        this.state.bgRemovalEnabled &&
        Boolean(this.rawImageEl) &&
        (prog.status === 'downloading' || prog.status === 'inferring');
      canvasOverlay.classList.toggle('hidden', !isBusy);
      canvasOverlay.classList.toggle('flex', isBusy);
      if (isBusy) {
        canvasOverlayText.textContent = `${prog.stageLabel}`;
      }
    }
  }

  private syncRuntimeDiagnosticsPanel(): void {
    const rt = getRuntimeDiagnostics();
    const cached = getCachedNeuralMatte(this.rawImageEl, this.neuralModelTier);
    const setText = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('diag-model-id', `${rt.activeModelId}`);
    setText('diag-model-version', rt.modelVersion);
    setText('diag-backend', rt.inferenceBackend);
    setText('diag-status', rt.status.toUpperCase());
    setText(
      'diag-duration',
      rt.inferenceDurationMs > 0 ? `${rt.inferenceDurationMs} ms` : '—'
    );
    setText(
      'diag-source-dims',
      rt.sourceWidth > 0 ? `${rt.sourceWidth}×${rt.sourceHeight}` : '—'
    );

    const errBox = document.getElementById('diag-error-box');
    const errText = document.getElementById('diag-error-text');
    if (errBox && errText) {
      if (rt.errorMessage) {
        errBox.classList.remove('hidden');
        errText.textContent = rt.errorMessage;
      } else {
        errBox.classList.add('hidden');
        errText.textContent = '';
      }
    }

    const d = cached?.diagnostics.refinedDiagnostics ?? rt.refinedDiagnostics;
    if (d) {
      setText('diag-speckles', String(d.backgroundSpeckleCount));
      setText('diag-holes', String(d.foregroundHoleCount));
      setText('diag-smoothness', `${d.boundarySmoothnessPct}%`);
    } else {
      setText('diag-speckles', '—');
      setText('diag-holes', '—');
      setText('diag-smoothness', '—');
    }

    const btnUndo = document.getElementById(
      'btn-brush-undo'
    ) as HTMLButtonElement | null;
    const btnRedo = document.getElementById(
      'btn-brush-redo'
    ) as HTMLButtonElement | null;
    if (btnUndo) {
      btnUndo.disabled = !canUndoAlphaBrush();
      btnUndo.classList.toggle('opacity-40', !canUndoAlphaBrush());
    }
    if (btnRedo) {
      btnRedo.disabled = !canRedoAlphaBrush();
      btnRedo.classList.toggle('opacity-40', !canRedoAlphaBrush());
    }
  }

  private schedulePipelineUpdate(immediate = false): void {
    if (this.renderDebounceTimer) {
      window.clearTimeout(this.renderDebounceTimer);
    }
    if (immediate) {
      this.runPipelineAndSyncUI();
      return;
    }
    this.renderDebounceTimer = window.setTimeout(() => {
      this.runPipelineAndSyncUI();
    }, 16);
  }

  private runPipelineAndSyncUI(): void {
    const cached = getCachedNeuralMatte(this.rawImageEl, this.neuralModelTier);
    const neuralMatte =
      this.state.mode === 'photo' &&
      cached &&
      (this.state.bgRemovalEnabled || cached.isPreClippedAlpha)
        ? cached
        : null;
    const result = renderProcessedOutput(
      this.state,
      this.rawImageEl,
      neuralMatte
    );
    this.lastResult = result;
    this.syncDynamicDOM(result);
    this.syncRuntimeDiagnosticsPanel();
  }

  private handleLocalFileUpload(file: File, sourceLabel = 'Loaded'): void {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select or paste a valid image (JPG, PNG, WebP).');
      return;
    }
    if (this.customUploadedFile?.url) {
      URL.revokeObjectURL(this.customUploadedFile.url);
    }
    clearCachedNeuralMatte();
    this.rawImageBlob = file;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.customUploadedFile = {
        name: file.name || 'Cutout.png',
        sizeKb: Math.max(0.5, Math.round((file.size / 1024) * 10) / 10),
        width: img.naturalWidth || 600,
        height: img.naturalHeight || 700,
        url: objectUrl,
      };
      this.rawImageEl = img;

      // Automatically advance to Step 2 (Adjust) for student convenience
      this.setWorkflowStep('adjust');

      if (this.state.mode === 'photo') {
        const preClipped = detectAndCachePreClippedImage(
          img,
          this.neuralModelTier
        );
        if (preClipped) {
          this.runPipelineAndSyncUI();
          this.showToast(
            'Transparent PNG Cutout Loaded — Background Studio Ready!'
          );
          return;
        }
      }

      this.runPipelineAndSyncUI();
      this.triggerNeuralMattingIfNeeded();
      this.showToast(
        `${sourceLabel} "${this.customUploadedFile.name}" (${this.customUploadedFile.width}×${this.customUploadedFile.height} px).`
      );
    };
    img.onerror = () => {
      this.showToast('Could not decode that image file in browser.');
    };
    img.src = objectUrl;
  }

  private async loadBenchmarkScenarioIntoEditor(
    scenarioId: BenchmarkScenarioId
  ): Promise<void> {
    const gen = await generateBenchmarkScenario(scenarioId);
    const res = await fetch(gen.sourceDataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${scenarioId}.png`, { type: 'image/png' });
    this.handleLocalFileUpload(file, 'Benchmark');
  }

  private async handleClipboardPasteButton(): Promise<void> {
    try {
      if (
        !navigator.clipboard ||
        typeof navigator.clipboard.read !== 'function'
      ) {
        this.showToast('Press Ctrl+V (or Cmd+V) anywhere to paste your photo.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `Pasted_Photo.${ext}`, {
            type: imageType,
          });
          this.handleLocalFileUpload(file, 'Pasted');
          return;
        }
      }
      this.showToast(
        'No image found in clipboard. Copy a photo or phone cutout first.'
      );
    } catch {
      this.showToast('Press Ctrl+V (or long-press Paste) to paste your photo.');
    }
  }

  private clearUploadedImage(): void {
    if (this.customUploadedFile?.url) {
      URL.revokeObjectURL(this.customUploadedFile.url);
    }
    clearCachedNeuralMatte();
    this.customUploadedFile = null;
    this.rawImageEl = null;
    this.rawImageBlob = null;
    this.brushMode = 'off';
    this.setWorkflowStep('photo');
    this.runPipelineAndSyncUI();
    this.showToast('Cleared image from studio.');
  }

  private applyPreset(preset: AdmissionPreset): void {
    this.state.presetId = preset.id;
    this.state.mode = preset.mode;
    this.state.widthPx = preset.widthPx;
    this.state.heightPx = preset.heightPx;
    this.state.aspectRatioLock = preset.ratioLabel;
    this.state.targetCapKb = preset.maxKb;
    this.state.dpi = preset.dpi;
    this.state.bgTone = preset.defaultBg;
    this.state.scalePct = 100;
    this.state.offsetX = 0;
    this.state.offsetY = 0;
    this.state.rotationDeg = 0;

    this.schedulePipelineUpdate(true);
    this.triggerNeuralMattingIfNeeded();
    this.showToast(
      `Preset: ${preset.shortName} (${preset.widthPx}×${preset.heightPx} px • ≤${preset.maxKb} KB)`
    );
  }

  private handleExportCurrentFile(): void {
    if (!this.rawImageEl) {
      document.getElementById('local-file-input')?.click();
      this.showToast('Please select or take a photo first.');
      return;
    }

    const prevOverlay = this.state.showMaskOverlay;
    this.state.showMaskOverlay = false;
    this.runPipelineAndSyncUI();
    this.state.showMaskOverlay = prevOverlay;

    if (!this.lastResult || !this.lastResult.dataUrl) return;

    const preset = this.getActivePreset();
    const ext = this.state.formatExtLabel.toLowerCase();
    const tierSuffix =
      this.state.resolutionTier === 'low'
        ? '_lowres'
        : this.state.resolutionTier === 'high'
          ? '_highres_300dpi'
          : '';
    const safePreset = preset.id.replace(/[^a-z0-9_-]/gi, '_');
    const filename = `FormPhoto_${safePreset}_${this.lastResult.outWidth}x${this.lastResult.outHeight}${tierSuffix}.${ext}`;

    triggerDataUrlDownload(this.lastResult.dataUrl, filename);

    const record: ExportRecord = {
      id: `${Date.now()}`,
      presetName: preset.shortName,
      filename,
      width: this.lastResult.outWidth,
      height: this.lastResult.outHeight,
      sizeKb: this.lastResult.sizeKb,
      formatLabel: this.state.formatExtLabel,
      resolutionTier: this.state.resolutionTier,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      dataUrl: this.lastResult.dataUrl,
    };
    this.exportHistory.unshift(record);
    if (this.exportHistory.length > 3) {
      this.exportHistory.pop();
    }
    this.renderExportHistoryStrip();
    if (prevOverlay) {
      this.runPipelineAndSyncUI();
    }
    this.showToast(
      `Downloaded ${filename} (${this.lastResult.sizeKb} KB) successfully!`
    );
  }

  private async handleExportA4PdfSheet(): Promise<void> {
    if (!this.rawImageEl) {
      document.getElementById('local-file-input')?.click();
      this.showToast('Upload a photo first to generate the A4 print sheet.');
      return;
    }
    const prevOverlay = this.state.showMaskOverlay;
    this.state.showMaskOverlay = false;
    this.runPipelineAndSyncUI();
    this.state.showMaskOverlay = prevOverlay;

    if (!this.lastResult || !this.lastResult.dataUrl) return;
    const preset = this.getActivePreset();
    const safePreset = preset.id.replace(/[^a-z0-9_-]/gi, '_');
    const filename = `FormPhoto_${safePreset}_A4_Print_Sheet.pdf`;
    try {
      this.showToast('Generating calibrated A4 PDF print sheet…');
      await downloadA4PrintableSheetPdf(
        this.lastResult.dataUrl,
        this.lastResult.outWidth,
        this.lastResult.outHeight,
        this.state,
        preset,
        filename
      );
      if (prevOverlay) {
        this.runPipelineAndSyncUI();
      }
      this.showToast('Downloaded calibrated A4 PDF print sheet!');
    } catch (err) {
      console.error('A4 PDF generation failed:', err);
      this.showToast('Could not generate A4 PDF sheet.');
    }
  }

  private setWorkflowStep(step: WorkflowStep): void {
    this.activeStep = step;
    const steps: WorkflowStep[] = ['photo', 'adjust', 'export'];

    steps.forEach((s) => {
      // Desktop & Mobile tab buttons
      const btn = document.getElementById(`tab-step-${s}`);
      const mBtn = document.getElementById(`nav-mobile-${s}`);
      const panel = document.getElementById(`panel-step-${s}`);
      const isCurrent = s === step;

      if (btn) {
        btn.className = `step-nav-btn m3-spring flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
          isCurrent
            ? 'm3-primary shadow-sm'
            : 'm3-surface-2 hover:m3-surface-3 m3-text-muted hover:text-m3-text'
        }`;
      }
      if (mBtn) {
        mBtn.className = `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition ${
          isCurrent
            ? 'text-[var(--m3-primary)]'
            : 'text-[var(--m3-text-muted)] hover:text-[var(--m3-text)]'
        }`;
      }
      if (panel) {
        panel.classList.toggle('hidden', !isCurrent);
        panel.classList.toggle('flex', isCurrent);
      }
    });
  }

  private applyTouchUpBrushAtPointer(clientX: number, clientY: number): void {
    if (
      this.brushMode === 'off' ||
      !this.rawImageEl ||
      !this.lastResult ||
      this.state.mode !== 'photo'
    ) {
      return;
    }
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    if (!frameWrap) return;
    const rect = frameWrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const normOutX = (clientX - rect.left) / rect.width;
    const normOutY = (clientY - rect.top) / rect.height;

    const cached = getCachedNeuralMatte(this.rawImageEl, this.neuralModelTier);
    if (!cached) return;

    const mapped = mapOutputPointToSourceNormalized(
      normOutX,
      normOutY,
      cached.width,
      cached.height,
      this.lastResult.outWidth,
      this.lastResult.outHeight,
      this.state
    );
    if (!mapped) return;

    const scaleRatio =
      Math.max(cached.width, cached.height) /
      Math.max(1, Math.max(rect.width, rect.height));
    const radiusSourcePx = Math.max(
      2,
      (this.brushSizePx / 2) *
        scaleRatio *
        (100 / Math.max(25, this.state.scalePct))
    );

    const changed = paintCachedAlphaBrushStroke(
      mapped.normX,
      mapped.normY,
      radiusSourcePx,
      this.brushMode
    );
    if (changed) {
      this.schedulePipelineUpdate();
    }
  }

  private mountInitialShell(): void {
    const root = document.getElementById('root');
    if (!root) return;

    const presetsList = this.getAllPresetsList();
    const refCfg = getAlphaRefinementConfig();

    root.innerHTML = `
      <!-- Hidden Native File Input (100% On-Device Browser Processing) -->
      <input id="local-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/*" class="hidden" />

      <!-- FIXED APPLICATION SHELL: Header (52px) + Main Content (100dvh - 52px) -->
      <div class="h-[100dvh] w-full flex flex-col overflow-hidden bg-[var(--m3-bg)] text-[var(--m3-text)]">
        
        <!-- COMPACT HEADER TOOLBAR (Fixed 52px) -->
        <header class="w-full h-[52px] px-3 sm:px-4 border-b border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-between gap-2 shrink-0 z-40 select-none">
          
          <!-- Left: Studio Logo + Portal Preset Trigger Pill -->
          <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div class="w-8 h-8 rounded-xl m3-primary flex items-center justify-center shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[19px]">crop_free</span>
            </div>
            <span class="hidden sm:inline font-display font-bold text-sm sm:text-base tracking-tight shrink-0">FormPhoto</span>
            
            <!-- Current Portal Preset Pill (Click to Change) -->
            <button id="btn-open-portal-popup" type="button" class="m3-spring flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-xs font-semibold shrink" title="Change Portal Preset">
              <span class="material-symbols-outlined text-m3-primary text-[15px] shrink-0">school</span>
              <span id="header-portal-label" class="font-bold truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[180px]">BUET Engineering</span>
              <span class="material-symbols-outlined text-[14px] m3-text-muted shrink-0">expand_more</span>
            </button>
          </div>

          <!-- Center: 3-Step Student Journey Navigation Tabs (Desktop & Tablet) -->
          <nav class="hidden md:flex items-center gap-1 bg-[var(--m3-surface-2)] p-1 rounded-full border border-[var(--m3-outline-variant)]">
            <button id="tab-step-photo" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-primary">
              <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Photo</span>
            </button>
            <button id="tab-step-adjust" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-text-muted hover:text-m3-text">
              <span class="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center text-[10px]">2</span>
              <span>Adjust</span>
            </button>
            <button id="tab-step-export" type="button" class="step-nav-btn m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition m3-text-muted hover:text-m3-text">
              <span class="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center text-[10px]">3</span>
              <span>Export</span>
            </button>
          </nav>

          <!-- Right: Mode Switcher (Photo/Signature) + Theme Picker + Info -->
          <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <!-- Mode switch -->
            <div class="flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-xs font-bold">
              <button id="mode-btn-photo" type="button" class="px-2 sm:px-2.5 py-1 rounded-full transition m3-primary" title="Admission Photo Mode">Photo</button>
              <button id="mode-btn-signature" type="button" class="px-2 sm:px-2.5 py-1 rounded-full transition m3-text-muted hover:text-m3-text" title="Signature Isolation Mode">Sig</button>
            </div>

            <!-- Mobile Single Theme Toggle -->
            <button id="btn-mobile-theme-toggle" type="button" class="sm:hidden w-7 h-7 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] flex items-center justify-center text-xs" title="Switch Theme">
              <span class="material-symbols-outlined text-[15px]">contrast</span>
            </button>

            <!-- Theme Picker (Desktop/Tablet) -->
            <div id="theme-switcher-bar" class="hidden sm:flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] gap-0.5">
              ${THEME_KEYS.map((key) => {
                const t = THEMES[key];
                return `
                  <button
                    type="button"
                    data-theme="${key}"
                    class="theme-pill w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-xs transition"
                    title="${t.name}: ${t.subtitle}"
                  >
                    <span class="material-symbols-outlined text-[14px] sm:text-[15px]">${t.icon}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Info / Privacy -->
            <button id="btn-privacy-badge" type="button" class="hidden xs:flex w-7 sm:w-8 h-7 sm:h-8 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] items-center justify-center text-emerald-500" title="100% On-Device Privacy — Zero Cloud Upload">
              <span class="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
            </button>
          </div>
        </header>

        <!-- MAIN WORKSPACE: Sidebar + Canvas Stage (Fills Remaining Viewport Without Whole-Page Scroll) -->
        <main class="flex-1 w-full min-h-0 flex flex-col md:flex-row overflow-hidden relative">
          
          <!-- LEFT EDITING SIDEBAR (Desktop: Scrollable Sidebar • Mobile: Bottom Panel Driven by Tabs) -->
          <aside class="w-full md:w-[340px] lg:w-[370px] h-auto md:h-full shrink-0 border-b md:border-b-0 md:border-r border-[var(--m3-outline-variant)] m3-surface-1 p-3 sm:p-4 overflow-y-auto min-h-0 flex flex-col gap-3.5 z-20 order-2 md:order-1">
            
            <!-- ================= STEP 1: PHOTO PANEL ================= -->
            <div id="panel-step-photo" class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">1</span>
                  <span>Upload &amp; Portal</span>
                </h3>
                <span id="step1-bg-status" class="text-[11px] font-mono font-bold text-emerald-600">Background Removed Automatically</span>
              </div>

              <!-- Big Primary Upload Button -->
              <button id="btn-sidebar-upload" type="button" class="w-full py-3.5 px-4 rounded-2xl m3-primary font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition">
                <span class="material-symbols-outlined text-[20px]">upload_file</span>
                <span id="btn-sidebar-upload-label">Upload Passport Photo</span>
              </button>

              <div class="flex items-center gap-2">
                <button id="btn-sidebar-paste" type="button" class="flex-1 py-2 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-semibold text-xs flex items-center justify-center gap-1.5 transition">
                  <span class="material-symbols-outlined text-[16px]">content_paste_go</span>
                  <span>Paste (Ctrl+V)</span>
                </button>
                <button id="btn-step1-change-portal" type="button" class="flex-1 py-2 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-semibold text-xs flex items-center justify-center gap-1.5 transition">
                  <span class="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Change Portal</span>
                </button>
              </div>

              <!-- Selected Portal Card Summary -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-m3-text" id="summary-portal-name">BUET Engineering</span>
                  <span class="font-mono text-[10px] px-2 py-0.5 rounded-full m3-primary-container font-bold" id="summary-portal-ratio">6:7</span>
                </div>
                <div class="text-[11px] m3-text-muted" id="summary-portal-note">300×350 px • ≤ 75 KB limit • Plain white background.</div>
                <div class="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[var(--m3-outline-variant)]">
                  <span>Target: <strong id="summary-portal-dims">300 × 350 px</strong></span>
                  <span>Max File: <strong id="summary-portal-maxkb">≤ 75 KB</strong></span>
                </div>
              </div>

              <!-- Background Cutout On/Off Toggle -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex items-center justify-between">
                <div>
                  <div class="font-bold text-xs">Automatic Background Removal</div>
                  <div class="text-[11px] m3-text-muted">On-device neural matting for studio cutouts</div>
                </div>
                <button id="btn-toggle-bg-remove" type="button" class="m3-spring px-3 py-1 rounded-full m3-primary font-mono font-bold text-[11px]">
                  <span id="bg-remove-status-text">ON</span>
                </button>
              </div>

              <button id="btn-goto-step-adjust" type="button" class="w-full py-2.5 px-3 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-bold text-xs flex items-center justify-center gap-1 transition">
                <span>Continue to Step 2: Adjust Photo</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <!-- ================= STEP 2: ADJUST PANEL ================= -->
            <div id="panel-step-adjust" class="hidden flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">2</span>
                  <span>Adjust &amp; Backdrop</span>
                </h3>
                <button id="btn-reset-crop" type="button" class="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[14px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              </div>

              <!-- 1. Studio Backdrop Fill Colors -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold">Studio Backdrop Color</span>
                  <span id="val-bg-tone-label" class="font-mono text-[10px] m3-text-muted">White (#fff)</span>
                </div>
                <div class="flex items-center justify-between gap-1.5">
                  <button type="button" data-bgtone="white" class="bg-swatch w-7 h-7 rounded-full bg-white border border-stone-400 transition hover:scale-110 ring-2 ring-[var(--m3-primary)]" title="Pure White (#ffffff) — BUET & DGME standard"></button>
                  <button type="button" data-bgtone="blue" class="bg-swatch w-7 h-7 rounded-full bg-[#38bdf8] border border-white transition hover:scale-110" title="Sky Blue (#38bdf8) — NEET/JEE & Passport"></button>
                  <button type="button" data-bgtone="grey" class="bg-swatch w-7 h-7 rounded-full bg-slate-200 border border-white transition hover:scale-110" title="Off-White (#e2e8f0)"></button>
                  <button type="button" data-bgtone="midgrey" class="bg-swatch w-7 h-7 rounded-full bg-[#808080] border border-stone-300 transition hover:scale-110" title="Mid-Grey (#808080)"></button>
                  <button type="button" data-bgtone="black" class="bg-swatch w-7 h-7 rounded-full bg-black border border-stone-500 transition hover:scale-110" title="Pitch Black (#000000)"></button>
                  <button type="button" data-bgtone="alpha" class="bg-swatch w-7 h-7 rounded-full checker-bg border border-stone-400 transition hover:scale-110" title="Transparent Alpha (PNG)"></button>
                  <label class="w-7 h-7 rounded-full overflow-hidden border border-stone-400 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 hover:scale-110 transition" title="Custom Backdrop Color">
                    <input id="input-custom-bg-color" type="color" value="#dbeafe" class="opacity-0 w-0 h-0" />
                  </label>
                </div>
              </div>

              <!-- 2. Crop, Zoom, Pan & Rotate Sliders -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-zoom" class="text-xs font-semibold">Face Size / Zoom</label>
                    <span id="val-zoom" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded m3-surface-2">100%</span>
                  </div>
                  <input id="slider-zoom" type="range" min="50" max="240" value="100" class="m3-slider" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label for="slider-pan-x" class="text-[11px] font-medium m3-text-muted">Pan Horizontal</label>
                      <span id="val-pan-x" class="font-mono text-[10px]">0</span>
                    </div>
                    <input id="slider-pan-x" type="range" min="-120" max="120" value="0" class="m3-slider" />
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label for="slider-pan-y" class="text-[11px] font-medium m3-text-muted">Pan Vertical</label>
                      <span id="val-pan-y" class="font-mono text-[10px]">0</span>
                    </div>
                    <input id="slider-pan-y" type="range" min="-120" max="120" value="0" class="m3-slider" />
                  </div>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-rotation" class="text-[11px] font-medium m3-text-muted">Straighten / Rotate</label>
                    <div class="flex items-center gap-1">
                      <button id="btn-rot-left" type="button" class="px-1.5 py-0.5 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">-90°</button>
                      <span id="val-rotation" class="font-mono text-[10px] font-bold">0°</span>
                      <button id="btn-rot-right" type="button" class="px-1.5 py-0.5 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">+90°</button>
                    </div>
                  </div>
                  <input id="slider-rotation" type="range" min="-180" max="180" value="0" class="m3-slider" />
                </div>
              </div>

              <!-- 3. Optional Touch-Up Brush for Hair & Glasses -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px] text-m3-primary">brush</span>
                    <span>Edge Touch-Up Brush</span>
                  </span>
                  <div class="flex items-center gap-1">
                    <button id="btn-brush-undo" type="button" class="px-2 py-0.5 rounded bg-[var(--m3-surface-2)] text-[10px] font-mono font-bold disabled:opacity-40" title="Undo (Ctrl+Z)">Undo</button>
                    <button id="btn-brush-redo" type="button" class="px-2 py-0.5 rounded bg-[var(--m3-surface-2)] text-[10px] font-mono font-bold disabled:opacity-40" title="Redo (Ctrl+Y)">Redo</button>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                  <button id="btn-brush-off" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-primary">Pan</button>
                  <button id="btn-brush-erase" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-text-muted hover:text-m3-text">Erase BG</button>
                  <button id="btn-brush-restore" type="button" class="py-1 px-1.5 rounded-lg text-xs font-bold text-center transition m3-text-muted hover:text-m3-text">Restore FG</button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] m3-text-muted">Size</span>
                  <input id="slider-brush-size" type="range" min="5" max="60" step="1" value="22" class="m3-slider flex-1" />
                  <span id="val-brush-size" class="font-mono text-[10px] font-bold w-8 text-right">22px</span>
                </div>
              </div>

              <!-- Signature Mode Ink Controls (Shown only in Signature mode) -->
              <div id="signature-adjust-controls" class="hidden m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex-col gap-2">
                <div class="font-bold text-xs">Bradley-Roth Signature Ink Isolation</div>
                <div class="grid grid-cols-2 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                  <button id="btn-sig-ink-original" type="button" class="py-1 px-2 rounded-lg text-xs font-bold m3-primary">Original Ink Color</button>
                  <button id="btn-sig-ink-mono" type="button" class="py-1 px-2 rounded-lg text-xs font-bold m3-text-muted">Pure Mono Black</button>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-1 text-[11px]">
                    <span class="font-medium">Ink Thickness / Contrast</span>
                    <span id="val-sig-threshold" class="font-mono font-bold">t = 0.14</span>
                  </div>
                  <input id="slider-sig-threshold" type="range" min="6" max="26" step="1" value="14" class="m3-slider" />
                </div>
              </div>

              <button id="btn-goto-step-export" type="button" class="w-full py-2.5 px-3 rounded-xl m3-primary font-bold text-xs flex items-center justify-center gap-1 shadow transition">
                <span>Continue to Step 3: Export Photo</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <!-- ================= STEP 3: EXPORT PANEL ================= -->
            <div id="panel-step-export" class="hidden flex-col gap-3">
              <div class="flex items-center justify-between">
                <h3 class="font-display font-bold text-sm uppercase tracking-wide text-m3-text flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full m3-primary flex items-center justify-center text-[10px]">3</span>
                  <span>Export &amp; Validation</span>
                </h3>
                <span id="export-validation-badge" class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-mono font-bold text-[10px]">PASS 5/5</span>
              </div>

              <!-- Output Dimensions & Format Selection -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold">Exact Output Dimensions</span>
                  <span id="export-exact-dims" class="font-mono font-bold text-sm text-m3-primary">300 × 350 px</span>
                </div>
                <div class="text-[11px] m3-text-muted" id="export-physical-dims">25.4 × 29.6 mm @ 300 DPI</div>

                <!-- Format Pills (JPG, JPEG, PNG, WEBP) -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">Image Format</span>
                  <div id="format-selector-group" class="grid grid-cols-4 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button type="button" data-format="image/jpeg" data-ext="JPG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-primary">JPG</button>
                    <button type="button" data-format="image/jpeg" data-ext="JPEG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">JPEG</button>
                    <button type="button" data-format="image/png" data-ext="PNG" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">PNG</button>
                    <button type="button" data-format="image/webp" data-ext="WEBP" class="format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition m3-text-muted">WEBP</button>
                  </div>
                </div>

                <!-- Resolution Quality (Low 0.75x, Standard 1x, High 2x) -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">Resolution Scale</span>
                  <div id="resolution-tier-group" class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button type="button" data-tier="low" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-text-muted">Low 0.75×</button>
                    <button type="button" data-tier="standard" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-primary">Std 1×</button>
                    <button type="button" data-tier="high" class="tier-btn py-1 px-1 rounded-lg text-xs font-bold transition m3-text-muted">High 2×</button>
                  </div>
                </div>

                <!-- File Size Cap Slider -->
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-max-kb" class="text-xs font-semibold">Maximum File Size Cap</label>
                    <span id="val-max-kb" class="font-mono text-[10px] font-bold px-2 py-0.5 rounded m3-surface-2">≤ 75 KB</span>
                  </div>
                  <input id="slider-max-kb" type="range" min="15" max="200" step="5" value="75" class="m3-slider" />
                  <div class="flex justify-between text-[10px] font-mono m3-text-muted mt-1">
                    <span>Result Size: <strong id="val-live-filesize" class="text-emerald-600 font-bold">54.2 KB</strong></span>
                    <span>Cap: <strong id="val-live-cap">75 KB</strong></span>
                  </div>
                </div>
              </div>

              <!-- Primary Export Action Button -->
              <button id="btn-export-primary" type="button" class="w-full py-3.5 px-4 rounded-2xl m3-primary font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition">
                <span class="material-symbols-outlined text-[20px]">download</span>
                <span id="export-btn-text">Download Admission Photo</span>
              </button>

              <!-- A4 PDF Contact Sheet Option -->
              <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex items-center justify-between">
                <div>
                  <div class="font-bold text-xs">Printable A4 Sheet (PDF)</div>
                  <div class="text-[11px] m3-text-muted">8 calibrated crop-marked copies on 210×297mm paper</div>
                </div>
                <button id="btn-export-pdf-sheet" type="button" class="m3-spring px-3 py-1.5 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-xs font-bold flex items-center gap-1 shrink-0">
                  <span class="material-symbols-outlined text-[15px] text-sky-500">picture_as_pdf</span>
                  <span>A4 PDF</span>
                </button>
              </div>
            </div>

            <!-- ================= COLLAPSIBLE ADVANCED SETTINGS ================= -->
            <!-- All technical settings, neural model selectors, edge choke/feather, and diagnostics live here, collapsed by default -->
            <details id="details-advanced-settings" class="m3-surface rounded-2xl border border-[var(--m3-outline-variant)] text-xs transition">
              <summary class="p-3 font-semibold text-m3-text cursor-pointer select-none flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[17px] m3-text-muted">tune</span>
                  <span>Advanced Matte &amp; Engine Settings</span>
                </span>
                <span class="material-symbols-outlined text-[16px] m3-text-muted transform transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              
              <div class="p-3 pt-0 flex flex-col gap-3 border-t border-[var(--m3-outline-variant)]/60 mt-2">
                <!-- Neural Model Selection -->
                <div>
                  <span class="text-[11px] font-semibold m3-text-muted block mb-1">On-Device Neural Model</span>
                  <div class="grid grid-cols-3 gap-1 bg-[var(--m3-surface-2)] p-1 rounded-xl">
                    <button id="btn-neural-tier-rmbg" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-primary" title="briaai/RMBG-1.4 (1024×1024)">RMBG-1.4</button>
                    <button id="btn-neural-tier-modnet" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-text-muted" title="Xenova/modnet (512×512)">MODNet</button>
                    <button id="btn-neural-tier-imgly" type="button" class="py-1 px-1 rounded-lg text-[10px] font-bold text-center transition m3-text-muted" title="IMG.LY 1.7">IMG.LY</button>
                  </div>
                </div>

                <!-- Edge Choke & Feather Sliders -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between text-[10px] font-medium mb-1">
                      <span>Edge Choke</span>
                      <span id="val-bg-choke" class="font-mono font-bold">0 px</span>
                    </div>
                    <input id="slider-bg-choke" type="range" min="-2" max="2" step="0.5" value="0" class="m3-slider" />
                  </div>
                  <div>
                    <div class="flex justify-between text-[10px] font-medium mb-1">
                      <span>Edge Feather</span>
                      <span id="val-bg-feather" class="font-mono font-bold">0 px</span>
                    </div>
                    <input id="slider-bg-feather" type="range" min="0" max="3" step="0.5" value="0" class="m3-slider" />
                  </div>
                </div>

                <!-- Enclosed Hole Fill & Raw Mask Inspection -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-medium">Hole Fill:</span>
                    <button id="btn-hole-smart" type="button" class="px-2 py-0.5 rounded text-[10px] font-bold m3-primary">Smart</button>
                    <button id="btn-hole-off" type="button" class="px-2 py-0.5 rounded text-[10px] font-bold m3-surface-2 m3-text-muted">Off</button>
                  </div>
                  <label class="flex items-center gap-1 text-[10px] font-mono cursor-pointer select-none">
                    <input id="chk-bypass-refinement" type="checkbox" ${refCfg.bypassRefinement ? 'checked' : ''} class="accent-[var(--m3-primary)] rounded" />
                    <span>Raw Mask</span>
                  </label>
                  <label class="flex items-center gap-1 text-[10px] font-mono cursor-pointer select-none">
                    <input id="chk-mask-overlay" type="checkbox" class="accent-[var(--m3-primary)] rounded" />
                    <span>Mask Overlay</span>
                  </label>
                </div>

                <!-- Technical Diagnostics Summary -->
                <div class="m3-surface-2 rounded-xl p-2 font-mono text-[9px] space-y-0.5">
                  <div class="flex justify-between"><span class="m3-text-muted">Model:</span> <span id="diag-model-id" class="font-bold">briaai/RMBG-1.4</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">Backend:</span> <span id="diag-backend" class="font-bold text-emerald-600">probing…</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">Duration:</span> <span id="diag-duration">—</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">BG Speckles:</span> <span id="diag-speckles">—</span></div>
                  <div class="flex justify-between"><span class="m3-text-muted">FG Holes:</span> <span id="diag-holes">—</span></div>
                  <div id="diag-error-box" class="hidden text-rose-500 font-sans text-[10px] pt-1">
                    <span id="diag-error-text"></span>
                  </div>
                </div>

                <!-- Benchmark Suite Button -->
                <button id="btn-open-benchmark-suite" type="button" class="w-full py-1.5 px-2 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-[11px] font-bold text-sky-600 flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">science</span>
                  <span>Open 8-Scenario Accuracy Benchmark Suite</span>
                </button>
              </div>
            </details>
          </aside>

          <!-- CENTER CANVAS WORKSPACE (Dead-Center, Responsive, 100% Unobstructed) -->
          <section class="flex-1 h-full min-h-0 flex flex-col items-center justify-center p-3 sm:p-5 studio-dot-grid overflow-hidden order-1 md:order-2 relative">
            
            <!-- EMPTY STATE DROPZONE (Shown before photo is uploaded) -->
            <div id="empty-upload-stage" class="w-full max-w-md m3-surface-1 rounded-3xl p-6 sm:p-8 border-2 border-dashed border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition flex flex-col items-center text-center cursor-pointer shadow-sm">
              <div class="w-14 h-14 rounded-2xl m3-primary-container flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-[32px] text-m3-primary">add_a_photo</span>
              </div>
              <h2 class="font-display font-bold text-base sm:text-lg text-m3-text">Select or Take a Photo</h2>
              <p class="text-xs m3-text-muted mt-1 max-w-xs leading-relaxed">
                Take a phone photo against any room wall. FormPhoto automatically removes the background and sizes it for your application.
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button id="btn-empty-choose" type="button" class="px-4 py-2 rounded-full m3-primary font-bold text-xs shadow flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Choose Photo</span>
                </button>
                <button id="btn-empty-paste" type="button" class="px-3.5 py-2 rounded-full m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] font-bold text-xs flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">content_paste</span>
                  <span>Paste (Ctrl+V)</span>
                </button>
              </div>
              <div class="mt-4 pt-3 border-t border-[var(--m3-outline-variant)] w-full flex items-center justify-center gap-3 text-[11px] font-mono m3-text-muted">
                <span id="empty-target-spec-hint">BUET 300 × 350 px • ≤ 75 KB JPG</span>
              </div>
            </div>

            <!-- ACTIVE WORKBENCH CANVAS (Shown when photo is loaded) -->
            <div id="workbench-stage-grid" class="hidden flex-col items-center justify-center w-full h-full max-w-4xl relative">
              
              <!-- Centered Calibrated Output Card -->
              <div id="stage-output-card" class="m3-surface-1 rounded-3xl p-3 sm:p-4 border border-[var(--m3-outline-variant)] flex flex-col items-center shadow-lg relative max-w-full max-h-full">
                
                <!-- Card Header with Clear & Replace actions -->
                <div class="w-full flex items-center justify-between gap-3 mb-2 px-1">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span id="canvas-live-pill" class="text-xs font-mono font-bold text-m3-text">300 × 350 px</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button id="btn-stage-replace" type="button" class="text-[11px] font-semibold px-2 py-0.5 rounded-lg m3-surface-2 hover:m3-surface-3" title="Replace Photo">Replace</button>
                    <button id="btn-stage-clear" type="button" class="text-[11px] font-semibold px-2 py-0.5 rounded-lg m3-surface-2 hover:text-rose-600" title="Clear Photo">Clear</button>
                  </div>
                </div>

                <!-- Viewport Frame Wrapper -->
                <div id="output-viewport-box" class="relative rounded-2xl overflow-hidden flex items-center justify-center p-3 checker-bg select-none border border-[var(--m3-outline-variant)]">
                  <div id="calibrated-frame-wrap" class="relative shadow-xl rounded-lg overflow-hidden border border-white/80 transition-all duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing" style="width: 240px; height: 280px;">
                    <img id="converted-preview-img" alt="Converted Admission Photo" referrerpolicy="no-referrer" class="w-full h-full object-contain pointer-events-none select-none" />
                    
                    <!-- Biometric Alignment Guide Overlay -->
                    <div id="biometric-guide-overlay" class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-35">
                      <div id="biometric-oval" class="w-[62%] h-[68%] border border-dashed border-sky-400 rounded-full"></div>
                      <div class="w-full border-t border-dashed border-sky-400/60 absolute top-[50%]"></div>
                      <div class="h-full border-l border-dashed border-sky-400/60 absolute left-[50%]"></div>
                    </div>

                    <!-- Live Brush Ring Indicator -->
                    <div id="brush-cursor-ring" class="hidden absolute rounded-full border-2 border-amber-400 bg-amber-400/20 pointer-events-none z-20" style="width: 22px; height: 22px; transform: translate(-50%, -50%);"></div>

                    <!-- Neural Loading Overlay Pill -->
                    <div id="canvas-neural-loading-pill" class="hidden absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 items-center justify-center gap-2 pointer-events-none">
                      <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                      <span id="canvas-neural-loading-text" class="text-[10px] font-mono font-bold text-white truncate">Removing Background…</span>
                    </div>
                  </div>
                </div>

                <!-- Bottom Helper Bar under Canvas -->
                <div class="w-full mt-2 flex items-center justify-between text-[11px] font-mono px-1">
                  <label class="flex items-center gap-1.5 m3-text-muted cursor-pointer select-none text-xs">
                    <input id="chk-biometric-grid" type="checkbox" checked class="accent-[var(--m3-primary)] rounded" />
                    <span>Alignment Grid</span>
                  </label>
                  <span id="out-filesize-badge" class="font-bold text-emerald-600">Ready</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- COMPACT MOBILE NAVIGATION BAR (Visible on <md screens) -->
        <nav class="md:hidden w-full h-[52px] border-t border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-around px-2 shrink-0 z-40 select-none pb-[env(safe-area-inset-bottom)]">
          <button id="nav-mobile-photo" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-primary)]">
            <span class="material-symbols-outlined text-[20px]">add_photo_alternate</span>
            <span>1. Photo</span>
          </button>
          <button id="nav-mobile-adjust" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-text-muted)]">
            <span class="material-symbols-outlined text-[20px]">palette</span>
            <span>2. Adjust</span>
          </button>
          <button id="nav-mobile-export" type="button" class="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold text-[var(--m3-text-muted)]">
            <span class="material-symbols-outlined text-[20px]">file_download</span>
            <span>3. Export</span>
          </button>
        </nav>
      </div>

      <!-- POP-UP MODAL 1: Admission Portals Selector -->
      <div id="modal-portals" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div class="m3-surface-1 max-w-2xl w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary text-[22px]">school</span>
              <div>
                <h3 class="font-display font-bold text-base">Select Admission Portal</h3>
                <p class="text-xs m3-text-muted">Automatically applies exact official dimensions, ratio, and file size caps.</p>
              </div>
            </div>
            <button data-close-modal="portals" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 mt-3 space-y-3 pr-1">
            <div id="preset-chips-container" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5"></div>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 2: 100% On-Device Privacy -->
      <div id="modal-privacy" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-500">lock</span>
              <h3 class="font-display font-bold text-base">Student Data Privacy</h3>
            </div>
            <button data-close-modal="privacy" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p class="text-xs m3-text-muted my-3 leading-relaxed">
            FormPhoto processes your photo <strong>100% locally inside your browser</strong>. Your portrait, background removal, and signatures never leave your device. Zero photos are sent to any remote server or cloud service.
          </p>
          <div class="flex justify-end">
            <button data-close-modal="privacy" type="button" class="px-4 py-1.5 rounded-full m3-primary text-xs font-bold">Understood</button>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 3: Accuracy Benchmark Suite -->
      <div id="modal-benchmark" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
        <div class="m3-surface-1 max-w-4xl w-full rounded-3xl p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[88vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sky-500 text-[22px]">science</span>
              <div>
                <h3 class="font-display font-bold text-base">Neural Matting Accuracy &amp; Benchmark Test Suite</h3>
                <p class="text-xs m3-text-muted">Compare briaai/RMBG-1.4 (1024×1024) vs Xenova/modnet across 8 difficult scenarios.</p>
              </div>
            </div>
            <button data-close-modal="benchmark" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 mt-3 space-y-3 pr-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-bold">Select Scenario:</span>
              <button id="btn-bench-load-into-studio" type="button" class="px-3 py-1 rounded-full m3-primary text-xs font-bold flex items-center gap-1 shadow">
                <span class="material-symbols-outlined text-[15px]">input</span>
                <span>Load Scenario Into Studio</span>
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${BENCHMARK_SCENARIOS.map(
                (s) => `
                <button type="button" data-scenario-id="${s.id}" class="bench-scenario-btn text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                  s.id === this.selectedBenchmarkScenario
                    ? 'm3-primary-container border-[var(--m3-primary)]'
                    : 'm3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]'
                }">
                  <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-black/10 font-bold mb-1">${s.challengeTag}</span>
                  <div class="font-bold text-xs leading-snug">${s.title}</div>
                </button>
              `
              ).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toast Banner -->
      <div id="m3-toast-banner" class="fixed bottom-14 md:bottom-4 left-4 z-50 max-w-sm m3-primary px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold opacity-0 pointer-events-none translate-y-4 transition-all duration-200">
        <span class="material-symbols-outlined text-[16px]">check_circle</span>
        <span id="m3-toast-text">Ready</span>
      </div>
    `;

    this.renderPresetChips();
    this.bindEvents();
  }

  private renderPresetChips(): void {
    const container = document.getElementById('preset-chips-container');
    if (!container) return;

    const presetsList = this.getAllPresetsList();
    container.innerHTML = presetsList
      .map((p) => {
        const isSelected = p.id === this.state.presetId;
        return `
        <button
          type="button"
          data-preset-id="${p.id}"
          class="preset-chip m3-spring text-left p-3 rounded-2xl border transition flex flex-col justify-between ${
            isSelected
              ? 'm3-primary-container border-[var(--m3-primary)] shadow-sm'
              : 'm3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]'
          }"
        >
          <div class="flex items-center justify-between w-full mb-1">
            <span class="font-bold text-xs sm:text-sm text-m3-text">${p.name}</span>
            <span class="w-2.5 h-2.5 rounded-full ${
              isSelected ? 'bg-[var(--m3-primary)]' : 'bg-emerald-500/70'
            } shrink-0"></span>
          </div>
          <div class="font-mono text-xs font-bold text-m3-primary mb-1">${
            p.widthPx
          } × ${p.heightPx} px (${p.ratioLabel})</div>
          <div class="text-[11px] opacity-75">${p.note}</div>
        </button>
      `;
      })
      .join('');

    container
      .querySelectorAll<HTMLButtonElement>('.preset-chip')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.presetId;
          if (id && ADMISSION_PRESETS[id]) {
            this.applyPreset(ADMISSION_PRESETS[id]);
            document.getElementById('modal-portals')?.classList.add('hidden');
          }
        });
      });
  }

  private renderExportHistoryStrip(): void {
    // History strip retained for local download reference
  }

  private bindEvents(): void {
    const fileInput = document.getElementById(
      'local-file-input'
    ) as HTMLInputElement | null;

    const triggerFileDialog = () => {
      fileInput?.click();
    };

    document
      .getElementById('btn-sidebar-upload')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('btn-empty-choose')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('btn-stage-replace')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('empty-upload-stage')
      ?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('#btn-empty-paste')) return;
        triggerFileDialog();
      });

    // Paste Cutout (Ctrl+V) buttons & global paste listener
    document
      .getElementById('btn-sidebar-paste')
      ?.addEventListener('click', () => {
        void this.handleClipboardPasteButton();
      });
    document
      .getElementById('btn-empty-paste')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        void this.handleClipboardPasteButton();
      });

    window.addEventListener('paste', (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            this.handleLocalFileUpload(file, 'Pasted');
            return;
          }
        }
      }
    });

    document
      .getElementById('btn-stage-clear')
      ?.addEventListener('click', () => {
        this.clearUploadedImage();
      });

    // Workflow Navigation Steps (Photo -> Adjust -> Export)
    ['photo', 'adjust', 'export'].forEach((s) => {
      document
        .getElementById(`tab-step-${s}`)
        ?.addEventListener('click', () => {
          this.setWorkflowStep(s as WorkflowStep);
        });
      document
        .getElementById(`nav-mobile-${s}`)
        ?.addEventListener('click', () => {
          this.setWorkflowStep(s as WorkflowStep);
        });
    });

    document
      .getElementById('btn-goto-step-adjust')
      ?.addEventListener('click', () => {
        this.setWorkflowStep('adjust');
      });
    document
      .getElementById('btn-goto-step-export')
      ?.addEventListener('click', () => {
        this.setWorkflowStep('export');
      });

    // Portal modal triggers
    const openPortalModal = () => {
      document.getElementById('modal-portals')?.classList.remove('hidden');
    };
    document
      .getElementById('btn-open-portal-popup')
      ?.addEventListener('click', openPortalModal);
    document
      .getElementById('btn-step1-change-portal')
      ?.addEventListener('click', openPortalModal);

    document
      .getElementById('btn-privacy-badge')
      ?.addEventListener('click', () => {
        document.getElementById('modal-privacy')?.classList.remove('hidden');
      });

    document
      .getElementById('btn-open-benchmark-suite')
      ?.addEventListener('click', () => {
        document.getElementById('modal-benchmark')?.classList.remove('hidden');
      });

    document
      .querySelectorAll<HTMLButtonElement>('[data-close-modal]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.closeModal;
          if (target) {
            document
              .getElementById(`modal-${target}`)
              ?.classList.add('hidden');
          }
        });
      });

    // Benchmark modal scenario loader
    document
      .querySelectorAll<HTMLButtonElement>('.bench-scenario-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.scenarioId as BenchmarkScenarioId;
          if (id) {
            this.selectedBenchmarkScenario = id;
            document
              .querySelectorAll<HTMLButtonElement>('.bench-scenario-btn')
              .forEach((b) => {
                const active = b.dataset.scenarioId === id;
                b.className = `bench-scenario-btn text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                  active
                    ? 'm3-primary-container border-[var(--m3-primary)]'
                    : 'm3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]'
                }`;
              });
          }
        });
      });

    document
      .getElementById('btn-bench-load-into-studio')
      ?.addEventListener('click', () => {
        document.getElementById('modal-benchmark')?.classList.add('hidden');
        void this.loadBenchmarkScenarioIntoEditor(
          this.selectedBenchmarkScenario
        );
      });

    // Drag and drop onto empty or active stage
    const emptyStage = document.getElementById('empty-upload-stage');
    [emptyStage, document.getElementById('stage-output-card')].forEach(
      (zone) => {
        zone?.addEventListener('dragover', (e) => {
          e.preventDefault();
          zone.classList.add('ring-2', 'ring-[var(--m3-primary)]');
        });
        zone?.addEventListener('dragleave', () => {
          zone.classList.remove('ring-2', 'ring-[var(--m3-primary)]');
        });
        zone?.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('ring-2', 'ring-[var(--m3-primary)]');
          const file = e.dataTransfer?.files?.[0];
          if (file) {
            this.handleLocalFileUpload(file);
          }
        });
      }
    );

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) {
        this.handleLocalFileUpload(file);
        fileInput.value = '';
      }
    });

    // Mode switchers (Photo vs Signature)
    document.getElementById('mode-btn-photo')?.addEventListener('click', () => {
      this.applyPreset(ADMISSION_PRESETS.buet);
    });
    document
      .getElementById('mode-btn-signature')
      ?.addEventListener('click', () => {
        this.applyPreset(ADMISSION_PRESETS.buet_sig);
      });

    // Theme selector
    document
      .querySelectorAll<HTMLButtonElement>('#theme-switcher-bar .theme-pill')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const themeKey = btn.dataset.theme as ThemeKey;
          if (themeKey) {
            this.state.theme = themeKey;
            this.applyThemeClass(themeKey);
            this.syncThemeButtons();
          }
        });
      });

    document
      .getElementById('btn-mobile-theme-toggle')
      ?.addEventListener('click', () => {
        const currentIndex = THEME_KEYS.indexOf(this.state.theme);
        const nextTheme = THEME_KEYS[(currentIndex + 1) % THEME_KEYS.length];
        this.state.theme = nextTheme;
        this.applyThemeClass(nextTheme);
        this.syncThemeButtons();
      });

    // Sliders
    const bindSlider = (id: string, onChange: (val: number) => void): void => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      el?.addEventListener('input', () => {
        onChange(parseFloat(el.value));
        this.schedulePipelineUpdate();
      });
    };

    bindSlider('slider-zoom', (v) => {
      this.state.scalePct = v;
    });
    bindSlider('slider-pan-x', (v) => {
      this.state.offsetX = v;
    });
    bindSlider('slider-pan-y', (v) => {
      this.state.offsetY = v;
    });
    bindSlider('slider-rotation', (v) => {
      this.state.rotationDeg = v;
    });
    bindSlider('slider-max-kb', (v) => {
      this.state.targetCapKb = v;
    });
    bindSlider('slider-bg-choke', (v) => {
      this.state.bgChokePx = v;
    });
    bindSlider('slider-bg-feather', (v) => {
      this.state.bgFeather = v;
    });
    bindSlider('slider-sig-threshold', (v) => {
      this.state.sigThreshold = v;
    });
    bindSlider('slider-brush-size', (v) => {
      this.brushSizePx = v;
      const cursorRing = document.getElementById('brush-cursor-ring');
      if (cursorRing) {
        cursorRing.style.width = `${v}px`;
        cursorRing.style.height = `${v}px`;
      }
    });

    // Quick rotation buttons
    document.getElementById('btn-rot-left')?.addEventListener('click', () => {
      this.state.rotationDeg =
        ((this.state.rotationDeg - 90 + 540) % 360) - 180;
      this.schedulePipelineUpdate(true);
    });
    document.getElementById('btn-rot-right')?.addEventListener('click', () => {
      this.state.rotationDeg =
        ((this.state.rotationDeg + 90 + 540) % 360) - 180;
      this.schedulePipelineUpdate(true);
    });

    // Reset crop button
    document.getElementById('btn-reset-crop')?.addEventListener('click', () => {
      this.state.scalePct = 100;
      this.state.offsetX = 0;
      this.state.offsetY = 0;
      this.state.rotationDeg = 0;
      this.state.bgChokePx = 0;
      this.state.bgFeather = 0;
      this.brushMode = 'off';
      this.schedulePipelineUpdate(true);
      this.showToast('Reset photo crop and alignment.');
    });

    // Background cutout on/off toggle
    document
      .getElementById('btn-toggle-bg-remove')
      ?.addEventListener('click', () => {
        this.state.bgRemovalEnabled = !this.state.bgRemovalEnabled;
        this.schedulePipelineUpdate(true);
        this.triggerNeuralMattingIfNeeded();
      });

    // Background color swatches
    document
      .querySelectorAll<HTMLButtonElement>('.bg-swatch')
      .forEach((swatch) => {
        swatch.addEventListener('click', () => {
          const tone = swatch.dataset.bgtone as BgToneKey;
          if (tone) {
            this.state.bgTone = tone;
            this.state.bgRemovalEnabled = true;
            if (tone === 'alpha' && this.state.format === 'image/jpeg') {
              this.state.format = 'image/png';
              this.state.formatExtLabel = 'PNG';
              this.showToast('Switched format to PNG to keep transparent background.');
            }
            this.schedulePipelineUpdate(true);
            this.triggerNeuralMattingIfNeeded();
          }
        });
      });

    // Custom background color
    const customColorInput = document.getElementById(
      'input-custom-bg-color'
    ) as HTMLInputElement | null;
    customColorInput?.addEventListener('input', () => {
      this.state.customBgColor = customColorInput.value;
      this.state.bgTone = 'custom';
      this.state.bgRemovalEnabled = true;
      this.schedulePipelineUpdate();
      this.triggerNeuralMattingIfNeeded();
    });

    // Format buttons (JPG, JPEG, PNG, WEBP)
    document
      .querySelectorAll<HTMLButtonElement>('#format-selector-group .format-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const fmt = btn.dataset.format as ImageFormat;
          const ext = btn.dataset.ext as 'JPG' | 'JPEG' | 'PNG' | 'WEBP';
          if (fmt && ext) {
            this.state.format = fmt;
            this.state.formatExtLabel = ext;
            this.schedulePipelineUpdate(true);
          }
        });
      });

    // Resolution scale tier buttons
    document
      .querySelectorAll<HTMLButtonElement>('#resolution-tier-group .tier-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const tier = btn.dataset.tier as ResolutionTier;
          if (tier) {
            this.state.resolutionTier = tier;
            this.schedulePipelineUpdate(true);
          }
        });
      });

    // Touch-up Brush buttons
    const setBrushMode = (mode: TouchUpBrushMode) => {
      this.brushMode = mode;
      this.syncBrushModeButtons();
      if (mode !== 'off') {
        this.showToast(
          mode === 'erase'
            ? 'Touch-Up Brush: Paint on canvas to erase stray background spots.'
            : 'Touch-Up Brush: Paint on canvas to restore hair, glasses, or clothing.'
        );
      }
    };

    document
      .getElementById('btn-brush-off')
      ?.addEventListener('click', () => setBrushMode('off'));
    document
      .getElementById('btn-brush-erase')
      ?.addEventListener('click', () => setBrushMode('erase'));
    document
      .getElementById('btn-brush-restore')
      ?.addEventListener('click', () => setBrushMode('restore'));

    document.getElementById('btn-brush-undo')?.addEventListener('click', () => {
      if (undoAlphaBrushStroke()) {
        this.schedulePipelineUpdate(true);
      }
    });
    document.getElementById('btn-brush-redo')?.addEventListener('click', () => {
      if (redoAlphaBrushStroke()) {
        this.schedulePipelineUpdate(true);
      }
    });

    // Canvas pointer interactions
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    const cursorRing = document.getElementById('brush-cursor-ring');

    frameWrap?.addEventListener('pointerenter', () => {
      if (this.brushMode !== 'off' && this.state.mode === 'photo' && cursorRing) {
        cursorRing.classList.remove('hidden');
      }
    });
    frameWrap?.addEventListener('pointerleave', () => {
      if (cursorRing) {
        cursorRing.classList.add('hidden');
      }
    });
    frameWrap?.addEventListener('pointerdown', (e) => {
      this.isDraggingCanvas = true;
      frameWrap.setPointerCapture(e.pointerId);
      if (this.brushMode !== 'off' && this.state.mode === 'photo') {
        beginAlphaBrushStroke();
        this.applyTouchUpBrushAtPointer(e.clientX, e.clientY);
        this.syncRuntimeDiagnosticsPanel();
        return;
      }
      this.dragStart = {
        x: e.clientX,
        y: e.clientY,
        offsetX: this.state.offsetX,
        offsetY: this.state.offsetY,
      };
    });
    frameWrap?.addEventListener('pointermove', (e) => {
      if (cursorRing && this.brushMode !== 'off' && this.state.mode === 'photo') {
        const rect = frameWrap.getBoundingClientRect();
        cursorRing.style.left = `${e.clientX - rect.left}px`;
        cursorRing.style.top = `${e.clientY - rect.top}px`;
        cursorRing.style.width = `${this.brushSizePx}px`;
        cursorRing.style.height = `${this.brushSizePx}px`;
        cursorRing.classList.remove('hidden');
      }
      if (!this.isDraggingCanvas) return;
      if (this.brushMode !== 'off' && this.state.mode === 'photo') {
        this.applyTouchUpBrushAtPointer(e.clientX, e.clientY);
        return;
      }
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.state.offsetX = Math.max(
        -120,
        Math.min(120, Math.round(this.dragStart.offsetX + dx * 0.6))
      );
      this.state.offsetY = Math.max(
        -120,
        Math.min(120, Math.round(this.dragStart.offsetY + dy * 0.6))
      );
      this.schedulePipelineUpdate();
    });
    frameWrap?.addEventListener('pointerup', () => {
      this.isDraggingCanvas = false;
      this.syncRuntimeDiagnosticsPanel();
    });

    // Biometric Grid
    const chkGrid = document.getElementById(
      'chk-biometric-grid'
    ) as HTMLInputElement | null;
    chkGrid?.addEventListener('change', () => {
      this.state.showGrid = chkGrid.checked;
      const overlay = document.getElementById('biometric-guide-overlay');
      if (overlay) {
        overlay.classList.toggle('hidden', !chkGrid.checked);
      }
    });

    // Advanced Neural Settings Controls
    const setNeuralTier = (tier: NeuralModelTier) => {
      this.neuralModelTier = tier;
      this.syncNeuralTierButtons();
      this.triggerNeuralMattingIfNeeded(true);
      this.schedulePipelineUpdate(true);
    };

    document
      .getElementById('btn-neural-tier-rmbg')
      ?.addEventListener('click', () => setNeuralTier('rmbg_14'));
    document
      .getElementById('btn-neural-tier-modnet')
      ?.addEventListener('click', () => setNeuralTier('modnet'));
    document
      .getElementById('btn-neural-tier-imgly')
      ?.addEventListener('click', () => setNeuralTier('imgly_medium'));

    document
      .getElementById('btn-hole-smart')
      ?.addEventListener('click', () => {
        updateAlphaRefinementConfig({ holeFillMode: 'smart' });
        this.syncHoleFillButtons('smart');
        this.schedulePipelineUpdate(true);
      });
    document
      .getElementById('btn-hole-off')
      ?.addEventListener('click', () => {
        updateAlphaRefinementConfig({ holeFillMode: 'off' });
        this.syncHoleFillButtons('off');
        this.schedulePipelineUpdate(true);
      });

    const chkBypass = document.getElementById(
      'chk-bypass-refinement'
    ) as HTMLInputElement | null;
    chkBypass?.addEventListener('change', () => {
      updateAlphaRefinementConfig({ bypassRefinement: chkBypass.checked });
      this.schedulePipelineUpdate(true);
    });

    const chkOverlay = document.getElementById(
      'chk-mask-overlay'
    ) as HTMLInputElement | null;
    chkOverlay?.addEventListener('change', () => {
      this.state.showMaskOverlay = chkOverlay.checked;
      this.schedulePipelineUpdate(true);
    });

    // Signature mode buttons
    document
      .getElementById('btn-sig-ink-original')
      ?.addEventListener('click', () => {
        this.state.sigInkColorMode = 'original';
        this.state.sigHighContrast = false;
        this.schedulePipelineUpdate(true);
      });
    document
      .getElementById('btn-sig-ink-mono')
      ?.addEventListener('click', () => {
        this.state.sigInkColorMode = 'mono';
        this.state.sigHighContrast = true;
        this.schedulePipelineUpdate(true);
      });

    // Export button
    document
      .getElementById('btn-export-primary')
      ?.addEventListener('click', () => {
        this.handleExportCurrentFile();
      });

    // A4 PDF sheet button
    document
      .getElementById('btn-export-pdf-sheet')
      ?.addEventListener('click', () => {
        void this.handleExportA4PdfSheet();
      });
  }

  private syncHoleFillButtons(activeMode: HoleFillMode): void {
    const btnSmart = document.getElementById('btn-hole-smart');
    const btnOff = document.getElementById('btn-hole-off');
    if (btnSmart) {
      btnSmart.className = `px-2 py-0.5 rounded text-[10px] font-bold ${
        activeMode === 'smart' ? 'm3-primary' : 'm3-surface-2 m3-text-muted'
      }`;
    }
    if (btnOff) {
      btnOff.className = `px-2 py-0.5 rounded text-[10px] font-bold ${
        activeMode === 'off' ? 'm3-primary' : 'm3-surface-2 m3-text-muted'
      }`;
    }
  }

  private syncThemeButtons(): void {
    document
      .querySelectorAll<HTMLButtonElement>('#theme-switcher-bar .theme-pill')
      .forEach((btn) => {
        const isCurrent = btn.dataset.theme === this.state.theme;
        btn.className = `theme-pill w-7 h-7 rounded-full flex items-center justify-center text-xs transition ${
          isCurrent ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });
  }

  private syncNeuralTierButtons(): void {
    const map: Record<NeuralModelTier, string> = {
      rmbg_14: 'btn-neural-tier-rmbg',
      modnet: 'btn-neural-tier-modnet',
      imgly_medium: 'btn-neural-tier-imgly',
    };
    (Object.keys(map) as NeuralModelTier[]).forEach((tier) => {
      const btn = document.getElementById(map[tier]);
      if (btn) {
        const active = this.neuralModelTier === tier;
        btn.className = `py-1 px-1 rounded-lg text-[10px] font-bold text-center transition ${
          active ? 'm3-primary' : 'm3-text-muted hover:text-m3-text'
        }`;
      }
    });
  }

  private syncBrushModeButtons(): void {
    const map: Record<TouchUpBrushMode, string> = {
      off: 'btn-brush-off',
      erase: 'btn-brush-erase',
      restore: 'btn-brush-restore',
    };
    (Object.keys(map) as TouchUpBrushMode[]).forEach((mode) => {
      const btn = document.getElementById(map[mode]);
      if (btn) {
        const active = this.brushMode === mode;
        btn.className = `py-1 px-1.5 rounded-lg text-xs font-bold text-center transition ${
          active ? 'm3-primary' : 'm3-text-muted hover:text-m3-text'
        }`;
      }
    });
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    const cursorRing = document.getElementById('brush-cursor-ring');
    if (frameWrap) {
      frameWrap.style.cursor =
        this.brushMode === 'off' ? 'grab' : 'crosshair';
    }
    if (cursorRing && this.brushMode === 'off') {
      cursorRing.classList.add('hidden');
    }
  }

  private syncDynamicDOM(result: ProcessedExportResult): void {
    const preset = this.getActivePreset();
    this.renderPresetChips();
    this.syncThemeButtons();
    this.syncNeuralTierButtons();
    this.syncBrushModeButtons();

    // Toggle Empty Stage vs Active Workbench Canvas
    const emptyStage = document.getElementById('empty-upload-stage');
    const workbenchGrid = document.getElementById('workbench-stage-grid');
    if (emptyStage && workbenchGrid) {
      if (result.hasSourceImage) {
        emptyStage.classList.add('hidden');
        workbenchGrid.classList.remove('hidden');
        workbenchGrid.classList.add('flex');
      } else {
        emptyStage.classList.remove('hidden');
        workbenchGrid.classList.add('hidden');
        workbenchGrid.classList.remove('flex');
      }
    }

    const setText = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    // Header portal label
    setText('header-portal-label', `${preset.shortName} • ${preset.widthPx}×${preset.heightPx}`);
    setText('summary-portal-name', preset.name);
    setText('summary-portal-ratio', preset.ratioLabel);
    setText('summary-portal-note', preset.note);
    setText('summary-portal-dims', `${preset.widthPx} × ${preset.heightPx} px`);
    setText('summary-portal-maxkb', `≤ ${preset.maxKb} KB`);
    setText('empty-target-spec-hint', `${preset.shortName} ${result.outWidth} × ${result.outHeight} px • ≤ ${this.state.targetCapKb} KB ${this.state.formatExtLabel}`);

    // Mode buttons
    const btnPhoto = document.getElementById('mode-btn-photo');
    const btnSig = document.getElementById('mode-btn-signature');
    if (btnPhoto && btnSig) {
      btnPhoto.className = `px-2.5 py-1 rounded-full transition ${
        this.state.mode === 'photo' ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
      }`;
      btnSig.className = `px-2.5 py-1 rounded-full transition ${
        this.state.mode === 'signature' ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
      }`;
    }

    // Signature vs Photo controls visibility
    const sigControls = document.getElementById('signature-adjust-controls');
    if (sigControls) {
      sigControls.classList.toggle('hidden', this.state.mode !== 'signature');
      sigControls.classList.toggle('flex', this.state.mode === 'signature');
    }

    // Sliders
    const setSliderAndText = (
      sliderId: string,
      textId: string,
      val: number,
      formatted: string
    ) => {
      const s = document.getElementById(sliderId) as HTMLInputElement | null;
      const t = document.getElementById(textId);
      if (s && document.activeElement !== s) s.value = String(val);
      if (t) t.textContent = formatted;
    };

    setSliderAndText(
      'slider-zoom',
      'val-zoom',
      this.state.scalePct,
      `${this.state.scalePct}%`
    );
    setSliderAndText(
      'slider-pan-x',
      'val-pan-x',
      this.state.offsetX,
      `${this.state.offsetX > 0 ? '+' : ''}${this.state.offsetX}`
    );
    setSliderAndText(
      'slider-pan-y',
      'val-pan-y',
      this.state.offsetY,
      `${this.state.offsetY > 0 ? '+' : ''}${this.state.offsetY}`
    );
    setSliderAndText(
      'slider-rotation',
      'val-rotation',
      this.state.rotationDeg,
      `${this.state.rotationDeg}°`
    );
    setSliderAndText(
      'slider-max-kb',
      'val-max-kb',
      this.state.targetCapKb,
      `≤ ${this.state.targetCapKb} KB`
    );

    const chokeSign = this.state.bgChokePx > 0 ? '+' : '';
    setSliderAndText(
      'slider-bg-choke',
      'val-bg-choke',
      this.state.bgChokePx,
      `${chokeSign}${this.state.bgChokePx} px`
    );
    setSliderAndText(
      'slider-bg-feather',
      'val-bg-feather',
      this.state.bgFeather,
      `${this.state.bgFeather} px`
    );
    setSliderAndText(
      'slider-brush-size',
      'val-brush-size',
      this.brushSizePx,
      `${this.brushSizePx}px`
    );

    const tVal = (this.state.sigThreshold / 100).toFixed(2);
    setSliderAndText(
      'slider-sig-threshold',
      'val-sig-threshold',
      this.state.sigThreshold,
      `t = ${tVal}`
    );

    // Background cutout on/off status
    const bgStatusText = document.getElementById('bg-remove-status-text');
    const btnBgRemove = document.getElementById('btn-toggle-bg-remove');
    if (bgStatusText) {
      bgStatusText.textContent = this.state.bgRemovalEnabled ? 'ON' : 'OFF';
    }
    if (btnBgRemove) {
      btnBgRemove.className = `m3-spring px-3 py-1 rounded-full font-mono font-bold text-[11px] ${
        this.state.bgRemovalEnabled ? 'm3-primary' : 'm3-surface-2 m3-text-muted'
      }`;
    }

    // Swatch rings
    document
      .querySelectorAll<HTMLButtonElement>('.bg-swatch')
      .forEach((swatch) => {
        const active = swatch.dataset.bgtone === this.state.bgTone;
        swatch.classList.toggle('ring-2', active);
        swatch.classList.toggle('ring-[var(--m3-primary)]', active);
      });

    // Format buttons in Export panel
    document
      .querySelectorAll<HTMLButtonElement>('#format-selector-group .format-btn')
      .forEach((btn) => {
        const active = btn.dataset.ext === this.state.formatExtLabel;
        btn.className = `format-btn py-1 px-1 rounded-lg font-mono text-xs font-bold transition ${
          active ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });

    // Resolution scale tier buttons
    document
      .querySelectorAll<HTMLButtonElement>('#resolution-tier-group .tier-btn')
      .forEach((btn) => {
        const active = btn.dataset.tier === this.state.resolutionTier;
        btn.className = `tier-btn py-1 px-1 rounded-lg text-xs font-bold transition ${
          active ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });

    // Canvas image update
    const outImg = document.getElementById(
      'converted-preview-img'
    ) as HTMLImageElement | null;
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    const ovalGuide = document.getElementById('biometric-oval');

    if (outImg && result.dataUrl) {
      outImg.src = result.dataUrl;
    }

    if (frameWrap) {
      const ratio = result.outWidth / Math.max(1, result.outHeight);
      const maxBoxW = 280;
      const maxBoxH = 320;
      let boxW = maxBoxH * ratio;
      let boxH = maxBoxH;
      if (boxW > maxBoxW) {
        boxW = maxBoxW;
        boxH = Math.max(72, boxW / ratio);
      }
      frameWrap.style.width = `${Math.round(boxW)}px`;
      frameWrap.style.height = `${Math.round(boxH)}px`;

      const bgHex =
        this.state.bgTone === 'custom'
          ? this.state.customBgColor
          : BG_TONE_HEX[this.state.bgTone];
      frameWrap.style.backgroundColor =
        (this.state.bgRemovalEnabled || result.isPreClippedAlpha) &&
        this.state.bgTone !== 'alpha'
          ? bgHex
          : 'transparent';
    }

    const isSig =
      this.state.mode === 'signature' ||
      result.outWidth / result.outHeight > 1.8;

    if (ovalGuide) {
      ovalGuide.className = isSig
        ? 'w-[84%] h-[54%] border border-dashed border-sky-400 rounded-lg'
        : 'w-[62%] h-[68%] border border-dashed border-sky-400 rounded-full';
    }

    // Export specs & validation readout
    const mmW = pxToUnit(result.outWidth, 'mm', this.state.dpi);
    const mmH = pxToUnit(result.outHeight, 'mm', this.state.dpi);
    setText('canvas-live-pill', `${result.outWidth} × ${result.outHeight} px`);
    setText('export-exact-dims', `${result.outWidth} × ${result.outHeight} px`);
    setText('export-physical-dims', `${mmW} × ${mmH} mm @ ${this.state.dpi} DPI (${this.state.formatExtLabel})`);
    setText(
      'val-live-filesize',
      result.hasSourceImage ? `${result.sizeKb} KB` : '—'
    );
    setText('val-live-cap', `≤ ${this.state.targetCapKb} KB`);
    setText(
      'out-filesize-badge',
      result.hasSourceImage ? `${result.sizeKb} KB` : 'Ready'
    );

    const compliance = evaluatePortalCompliance(
      this.state,
      result.hasSourceImage ? result.sizeKb : this.state.targetCapKb * 0.7,
      preset
    );
    const valBadge = document.getElementById('export-validation-badge');
    if (valBadge) {
      valBadge.textContent = `PASS ${compliance.passedCount}/${compliance.totalCount}`;
      valBadge.className = `px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
        compliance.allPassed
          ? 'bg-emerald-500/15 text-emerald-600'
          : 'bg-amber-500/15 text-amber-600'
      }`;
    }

    setText(
      'export-btn-text',
      result.hasSourceImage
        ? `Download ${result.outWidth}×${result.outHeight} ${this.state.formatExtLabel} (${result.sizeKb} KB)`
        : `Download ${result.outWidth}×${result.outHeight} ${this.state.formatExtLabel}`
    );
  }
}

declare global {
  interface Window {
    __FORMPHOTO_MOUNTED__?: boolean;
    __FORMPHOTO_BUNDLE_LOADING__?: boolean;
    __loadStaticBundle?: () => void;
  }
}

function bootstrapFormPhotoApp(): void {
  if (window.__FORMPHOTO_MOUNTED__) return;
  window.__FORMPHOTO_MOUNTED__ = true;
  const app = new FormPhotoProStudio();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapFormPhotoApp);
} else {
  bootstrapFormPhotoApp();
}
