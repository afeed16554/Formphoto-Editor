import {
  ADMISSION_PRESETS,
  BG_TONE_HEX,
  PRESET_CHIP_ORDER,
  THEMES,
} from './constants';
import {
  ProcessedExportResult,
  renderProcessedOutput,
} from './services/imageProcessor';
import {
  clearCachedNeuralMatte,
  getCachedNeuralMatte,
  NeuralMattingProgress,
  runNeuralPortraitMatting,
  subscribeNeuralProgress,
} from './services/neuralBgRemover';
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
import {
  applyAspectRatioLock,
  computeAspectRatio,
  evaluatePortalCompliance,
  pxToUnit,
  unitToPx,
} from './utils/photoMath';

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
  bgFeather: 1.5,
  sigHighContrast: false,
  sigInkColorMode: 'original',
  sigThreshold: 14, // Calibrated Bradley-Roth t = 0.14 (with w = 24)
  format: 'image/jpeg',
  formatExtLabel: 'JPG',
  targetCapKb: 75,
  qualityPct: 90,
  resolutionTier: 'standard',
  stripExif: true,
  viewMode: 'single', // Default to Output Only mode per user request
  zoomPct: 100,
  showGrid: true,
  splitPositionPct: 50,
  theme: 'oled', // Default to Pitch-Black OLED interface
};

const THEME_KEYS: ThemeKey[] = ['oled', 'warm', 'light', 'gray'];

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
  private rawImageEl: HTMLImageElement | null = null;
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
    }, 3000);
  }

  private triggerNeuralMattingIfNeeded(): void {
    if (
      !this.rawImageEl ||
      this.state.mode !== 'photo' ||
      !this.state.bgRemovalEnabled
    ) {
      return;
    }
    const existing = getCachedNeuralMatte(this.rawImageEl);
    if (existing) return;

    void runNeuralPortraitMatting(this.rawImageEl, () => {
      this.runPipelineAndSyncUI();
    });
  }

  private syncNeuralProgressUI(prog: NeuralMattingProgress): void {
    const labelEl = document.getElementById('neural-stage-label');
    const detailEl = document.getElementById('neural-stage-detail');
    const barEl = document.getElementById('neural-progress-bar');
    const badgeEl = document.getElementById('neural-idb-badge');
    const canvasOverlay = document.getElementById('canvas-neural-loading-pill');
    const canvasOverlayText = document.getElementById(
      'canvas-neural-loading-text'
    );

    if (labelEl) labelEl.textContent = prog.stageLabel;
    if (detailEl) detailEl.textContent = prog.detailText;
    if (barEl) {
      const pct =
        prog.status === 'idle'
          ? 100
          : Math.max(6, Math.min(100, prog.progressPct));
      barEl.style.width = `${pct}%`;
    }
    if (badgeEl) {
      badgeEl.textContent =
        prog.status === 'downloading' || prog.status === 'inferring'
          ? `${prog.progressPct}%`
          : prog.cachedInIndexedDB
            ? 'IDB CACHED'
            : 'READY';
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
    }, 18);
  }

  private runPipelineAndSyncUI(): void {
    const neuralMatte =
      this.state.mode === 'photo' && this.state.bgRemovalEnabled
        ? getCachedNeuralMatte(this.rawImageEl)
        : null;
    const result = renderProcessedOutput(
      this.state,
      this.rawImageEl,
      neuralMatte
    );
    this.lastResult = result;
    this.syncDynamicDOM(result);
  }

  private handleLocalFileUpload(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }
    if (this.customUploadedFile?.url) {
      URL.revokeObjectURL(this.customUploadedFile.url);
    }
    clearCachedNeuralMatte();

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.customUploadedFile = {
        name: file.name,
        sizeKb: Math.max(0.5, Math.round((file.size / 1024) * 10) / 10),
        width: img.naturalWidth || 600,
        height: img.naturalHeight || 700,
        url: objectUrl,
      };
      this.rawImageEl = img;
      this.runPipelineAndSyncUI();
      this.triggerNeuralMattingIfNeeded();
      this.showToast(
        `Loaded "${file.name}" (${this.customUploadedFile.width}×${this.customUploadedFile.height} px) locally.`
      );
    };
    img.onerror = () => {
      this.showToast('Could not decode that image file in browser.');
    };
    img.src = objectUrl;
  }

  private clearUploadedImage(): void {
    if (this.customUploadedFile?.url) {
      URL.revokeObjectURL(this.customUploadedFile.url);
    }
    clearCachedNeuralMatte();
    this.customUploadedFile = null;
    this.rawImageEl = null;
    this.runPipelineAndSyncUI();
    this.showToast('Cleared image from browser memory.');
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
      this.showToast('Select a photo or signature from your device first.');
      return;
    }
    if (!this.lastResult || !this.lastResult.hasSourceImage) {
      this.runPipelineAndSyncUI();
    }
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
    if (this.exportHistory.length > 4) {
      this.exportHistory.pop();
    }
    this.renderExportHistoryStrip();
    this.showToast(
      `Exported ${filename} (${this.lastResult.sizeKb} KB) locally.`
    );
  }

  private mountInitialShell(): void {
    const root = document.getElementById('root');
    if (!root) return;

    const presetsList = this.getAllPresetsList();

    root.innerHTML = `
      <!-- Hidden Native File Input (100% On-Device Browser Processing) -->
      <input id="local-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,image/*" class="hidden" />

      <!-- COMPACT FULL-SCREEN TOP HEADER RIBBON -->
      <header class="w-full h-12 px-3 sm:px-5 border-b border-[var(--m3-outline-variant)] m3-surface-1 flex items-center justify-between gap-2 shrink-0 z-40">
        
        <!-- Left: Minimal Studio Icon & Title + On-Device Privacy Pill -->
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg m3-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[17px]">crop_free</span>
          </div>
          <span class="font-display font-bold text-sm tracking-tight text-m3-text">FormPhoto</span>
          <button id="btn-privacy-badge" type="button" class="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition" title="100% Native Browser Processing — Zero Server Upload">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="hidden sm:inline">On-Device Native</span>
          </button>
        </div>

        <!-- Center: Mode Switcher (Photo | Signature) + Upload Action -->
        <div class="flex items-center gap-1 bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)]">
          <button id="mode-btn-photo" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">portrait</span>
            <span>Photo</span>
          </button>
          <button id="mode-btn-signature" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">draw</span>
            <span>Signature</span>
          </button>
          <button id="btn-top-upload" type="button" class="m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold m3-secondary-container hover:opacity-90">
            <span class="material-symbols-outlined text-[14px]">upload_file</span>
            <span>Upload</span>
          </button>
        </div>

        <!-- Right: 4-Theme Switcher (OLED Pitch Black, Warm, Light, Gray) -->
        <div id="theme-switcher-bar" class="flex items-center bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] gap-0.5">
          ${THEME_KEYS.map((key) => {
            const t = THEMES[key];
            return `
              <button
                type="button"
                data-theme="${key}"
                class="theme-pill m3-spring flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                title="${t.name}: ${t.subtitle}"
              >
                <span class="material-symbols-outlined text-[14px]">${t.icon}</span>
                <span class="hidden xl:inline">${t.name}</span>
              </button>
            `;
          }).join('')}
        </div>
      </header>

      <!-- MAIN WORKSPACE: Full-Screen Studio on Tablet & Large Monitors (md+) -->
      <main class="flex-1 w-full md:h-[calc(100vh-3rem)] md:overflow-hidden relative flex flex-col md:flex-row items-stretch">
        
        <!-- LEFT DOCKED CONTROL RAIL (Compact & Streamlined on Tablet/Desktop) -->
        <aside class="w-full md:w-[315px] lg:w-[335px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--m3-outline-variant)] m3-surface-1 p-3 sm:p-3.5 md:overflow-y-auto flex flex-col gap-3 z-20 order-2 md:order-1">
          
          <!-- 1. MINIMIZED ADMISSION PORTAL TRIGGER PILL (Opens Pop-up Modal) -->
          <div class="m3-surface rounded-2xl p-2.5 border border-[var(--m3-outline-variant)] flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">verified</span>
                <span class="text-[10px] font-mono uppercase tracking-wider m3-text-muted font-bold">Portal Preset</span>
              </div>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span id="minimized-portal-name" class="font-display font-bold text-xs truncate">BUET Engineering</span>
                <span id="minimized-portal-spec" class="font-mono text-[10px] px-1.5 py-0.5 rounded m3-primary-container font-bold shrink-0">300×350 • ≤75KB</span>
              </div>
            </div>
            <button id="btn-open-portal-popup" type="button" class="m3-spring px-2.5 py-1.5 rounded-xl m3-surface-2 hover:m3-surface-3 border border-[var(--m3-outline-variant)] text-[11px] font-bold flex items-center gap-1 shrink-0">
              <span>Portals</span>
              <span class="material-symbols-outlined text-[15px]">open_in_new</span>
            </button>
          </div>

          <!-- 2. DIMENSIONS & ASPECT RATIO -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">straighten</span>
                <span>Dimensions</span>
              </span>
              <div id="unit-selector-group" class="flex bg-[var(--m3-surface-2)] p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-[10px] font-mono font-bold">
                <button type="button" data-unit="px" class="unit-btn px-2 py-0.5 rounded-full">px</button>
                <button type="button" data-unit="mm" class="unit-btn px-2 py-0.5 rounded-full">mm</button>
                <button type="button" data-unit="cm" class="unit-btn px-2 py-0.5 rounded-full">cm</button>
                <button type="button" data-unit="in" class="unit-btn px-2 py-0.5 rounded-full">in</button>
              </div>
            </div>

            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
              <div class="m3-surface-1 p-2 rounded-xl border border-[var(--m3-outline-variant)]">
                <div class="flex items-center justify-between">
                  <label for="input-dim-w" class="text-[9px] font-mono uppercase m3-text-muted">Width</label>
                  <span id="label-unit-w" class="text-[9px] font-mono text-m3-primary font-bold">px</span>
                </div>
                <input id="input-dim-w" type="number" step="any" min="1" max="4000" class="w-full bg-transparent font-mono font-bold text-sm focus:outline-none text-m3-text" value="300" />
              </div>

              <div class="flex flex-col items-center gap-1">
                <button id="btn-lock-aspect" type="button" class="m3-spring w-8 h-8 rounded-xl m3-primary-container flex items-center justify-center" title="Lock Aspect Ratio">
                  <span id="icon-lock-aspect" class="material-symbols-outlined text-[15px]">lock</span>
                </button>
                <button id="btn-swap-dims" type="button" class="text-[10px] m3-text-muted hover:text-m3-text" title="Swap Width & Height">⇄</button>
              </div>

              <div class="m3-surface-1 p-2 rounded-xl border border-[var(--m3-outline-variant)]">
                <div class="flex items-center justify-between">
                  <label for="input-dim-h" class="text-[9px] font-mono uppercase m3-text-muted">Height</label>
                  <span id="label-unit-h" class="text-[9px] font-mono text-m3-primary font-bold">px</span>
                </div>
                <input id="input-dim-h" type="number" step="any" min="1" max="4000" class="w-full bg-transparent font-mono font-bold text-sm focus:outline-none text-m3-text" value="350" />
              </div>
            </div>

            <!-- Aspect Ratio Chips + DPI -->
            <div class="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[var(--m3-outline-variant)]">
              <div id="aspect-ratio-group" class="flex flex-wrap gap-1">
                ${['6:7', '1:1', '2:3', '7:9', '300:80', 'Free']
                  .map(
                    (ratio) => `
                  <button type="button" data-ratio="${ratio}" class="ratio-chip text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition">${ratio}</button>
                `
                  )
                  .join('')}
              </div>
              <div class="flex gap-1">
                <button id="dpi-btn-300" type="button" class="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">300 DPI</button>
                <button id="dpi-btn-72" type="button" class="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">72 DPI</button>
              </div>
            </div>
          </div>

          <!-- 3. ON-DEVICE NEURAL BACKGROUND STUDIO & EDGE REFINEMENT -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">auto_fix_high</span>
                <span>Background Studio</span>
              </span>
              <button id="btn-toggle-bg-remove" type="button" class="m3-spring px-2.5 py-1 rounded-full m3-primary-container font-mono font-bold text-[10px]">
                <span id="bg-remove-status-text">ACTIVE</span>
              </button>
            </div>

            <!-- Studio Fill Swatches (#ffffff White, #38bdf8 Sky Blue, etc.) -->
            <div class="flex items-center justify-between">
              <span class="text-[11px] m3-text-muted font-medium">Backdrop Fill</span>
              <div class="flex items-center gap-1.5 bg-[var(--m3-surface-1)] p-1 rounded-full border border-[var(--m3-outline-variant)]">
                <button type="button" data-bgtone="white" class="bg-swatch w-5 h-5 rounded-full bg-white border border-stone-400 transition hover:scale-110" title="Pure White (#ffffff)"></button>
                <button type="button" data-bgtone="blue" class="bg-swatch w-5 h-5 rounded-full bg-[#38bdf8] border border-white transition hover:scale-110" title="Passport Sky Blue (#38bdf8)"></button>
                <button type="button" data-bgtone="grey" class="bg-swatch w-5 h-5 rounded-full bg-slate-200 border border-white transition hover:scale-110" title="Neutral Off-White (#e2e8f0)"></button>
                <button type="button" data-bgtone="alpha" class="bg-swatch w-5 h-5 rounded-full checker-bg border border-stone-400 transition hover:scale-110" title="Transparent Alpha (PNG/WebP)"></button>
                <label class="w-5 h-5 rounded-full overflow-hidden border border-stone-400 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500" title="Custom Backdrop Color">
                  <input id="input-custom-bg-color" type="color" value="#dbeafe" class="opacity-0 w-0 h-0" />
                </label>
              </div>
            </div>

            <!-- Portrait Neural AI Progress Bar & Alpha Matte Edge Refinement Sliders -->
            <div id="portrait-matting-controls" class="flex flex-col gap-2.5 pt-1.5 border-t border-[var(--m3-outline-variant)]">
              
              <!-- Real-Time Neural Model Download / IndexedDB Caching Progress Box -->
              <div id="neural-progress-container" class="m3-surface-1 rounded-xl p-2 border border-[var(--m3-outline-variant)]">
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span id="neural-stage-label" class="text-[10px] font-mono font-bold text-m3-primary truncate">ISNet Neural Matting Ready</span>
                  <span id="neural-idb-badge" class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold shrink-0">IDB CACHE</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[var(--m3-surface-2)] overflow-hidden">
                  <div id="neural-progress-bar" class="h-full m3-primary transition-all duration-200" style="width: 100%;"></div>
                </div>
                <span id="neural-stage-detail" class="text-[9px] font-mono m3-text-muted mt-1 block truncate">@imgly/background-removal • 100% Local</span>
              </div>

              <!-- Alpha Matte Edge Refinement Sliders: Edge Choke / Defringe (-2px to +2px) & Edge Feather (0px to 3px) -->
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-bg-choke" class="text-[10px] font-semibold m3-text-muted" title="Shrink (-2px) or expand (+2px) alpha edge & remove room halo">Edge Choke / Defringe</label>
                    <span id="val-bg-choke" class="font-mono text-[10px] font-bold">0 px</span>
                  </div>
                  <input id="slider-bg-choke" type="range" min="-2" max="2" step="0.5" value="0" class="m3-slider" />
                  <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                    <span>-2px Halo</span>
                    <span>+2px</span>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label for="slider-bg-feather" class="text-[10px] font-semibold m3-text-muted" title="Soften alpha boundary before compositing (0px to 3px)">Edge Feather</label>
                    <span id="val-bg-feather" class="font-mono text-[10px] font-bold">1.5 px</span>
                  </div>
                  <input id="slider-bg-feather" type="range" min="0" max="3" step="0.5" value="1.5" class="m3-slider" />
                  <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                    <span>0px Sharp</span>
                    <span>3px Soft</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Signature Mode: O(N) Bradley-Roth Integral-Image Local Adaptive Thresholding (w = 24, t = 0.14) -->
            <div id="signature-matting-controls" class="hidden flex-col gap-2.5 pt-1.5 border-t border-[var(--m3-outline-variant)]">
              <div class="flex items-center justify-between text-[9px] font-mono m3-surface-1 px-2 py-1 rounded-lg border border-[var(--m3-outline-variant)]">
                <span class="text-m3-primary font-bold">Bradley-Roth Integral Image</span>
                <span class="m3-text-muted">O(N) • w=24</span>
              </div>

              <!-- Toggle: Preserve Original Blue/Black Ink Color vs. Pure Monochrome Black -->
              <div>
                <span class="text-[10px] font-semibold m3-text-muted block mb-1">Ink Color Output</span>
                <div class="grid grid-cols-2 gap-1 bg-[var(--m3-surface-1)] p-1 rounded-xl border border-[var(--m3-outline-variant)]">
                  <button id="btn-sig-ink-original" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition">
                    Original Blue/Black
                  </button>
                  <button id="btn-sig-ink-mono" type="button" class="m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition">
                    Pure Mono Black
                  </button>
                </div>
              </div>

              <!-- Ink Thickness / Contrast Slider (Calibrated around t = 0.14) -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-sig-threshold" class="text-[10px] font-semibold m3-text-muted">Ink Thickness / Contrast</label>
                  <span id="val-sig-threshold" class="font-mono text-[10px] font-bold">t = 0.14</span>
                </div>
                <input id="slider-sig-threshold" type="range" min="6" max="26" step="1" value="14" class="m3-slider" />
                <div class="flex justify-between text-[8px] font-mono m3-text-muted mt-0.5">
                  <span>Bold Stroke</span>
                  <span>Clean Shadow</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. CROP, PAN, ROTATE & STRICT KB CAP SLIDERS -->
          <div class="m3-surface rounded-2xl p-3 border border-[var(--m3-outline-variant)] flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-m3-primary text-[16px]">tune</span>
                <span>Crop &amp; KB Limit</span>
              </span>
              <button id="btn-reset-crop" type="button" class="text-[10px] font-mono font-semibold text-m3-primary hover:underline flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[13px]">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label for="slider-zoom" class="text-[11px] font-semibold">Zoom Scale</label>
                <span id="val-zoom" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded m3-surface-2">100%</span>
              </div>
              <input id="slider-zoom" type="range" min="50" max="240" value="100" class="m3-slider" />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-pan-x" class="text-[10px] font-semibold m3-text-muted">Pan X</label>
                  <span id="val-pan-x" class="font-mono text-[10px] font-bold">0 px</span>
                </div>
                <input id="slider-pan-x" type="range" min="-120" max="120" value="0" class="m3-slider" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-pan-y" class="text-[10px] font-semibold m3-text-muted">Pan Y</label>
                  <span id="val-pan-y" class="font-mono text-[10px] font-bold">0 px</span>
                </div>
                <input id="slider-pan-y" type="range" min="-120" max="120" value="0" class="m3-slider" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-rotation" class="text-[10px] font-semibold m3-text-muted">Rotate</label>
                  <div class="flex items-center gap-1">
                    <button id="btn-rot-left" type="button" class="px-1 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">-90°</button>
                    <span id="val-rotation" class="font-mono text-[10px] font-bold">0°</span>
                    <button id="btn-rot-right" type="button" class="px-1 rounded bg-[var(--m3-surface-2)] text-[9px] font-mono font-bold">+90°</button>
                  </div>
                </div>
                <input id="slider-rotation" type="range" min="-180" max="180" value="0" class="m3-slider" />
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label for="slider-quality" class="text-[10px] font-semibold m3-text-muted">Quality</label>
                  <span id="val-quality" class="font-mono text-[10px] font-bold">90%</span>
                </div>
                <input id="slider-quality" type="range" min="35" max="98" value="90" class="m3-slider" />
              </div>
            </div>

            <div class="pt-1.5 border-t border-[var(--m3-outline-variant)]">
              <div class="flex justify-between items-center mb-1">
                <label for="slider-max-kb" class="text-[11px] font-semibold">Max File Size Cap</label>
                <span id="val-max-kb" class="font-mono text-[10px] font-bold px-2 py-0.5 rounded m3-tertiary-container">≤ 75 KB</span>
              </div>
              <input id="slider-max-kb" type="range" min="15" max="200" step="5" value="75" class="m3-slider" />
            </div>
          </div>
        </aside>

        <!-- CENTER STAGE: Top Ribbon with Top-Right Export Corner + Centered Canvas Stage -->
        <section class="flex-1 relative flex flex-col items-center justify-between p-3 sm:p-5 studio-dot-grid overflow-hidden order-1 md:order-2 min-h-[480px]">
          
          <!-- TOP STAGE BAR: Left View Mode + Center Telemetry Pill + TOP-RIGHT EXPORT DOCK -->
          <div class="w-full flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 z-30 shrink-0">
            
            <!-- Left Group: View Mode Switcher + Minimized Spec Telemetry & Portal Validation Pill -->
            <div class="flex flex-wrap items-center gap-1.5 min-w-0">
              <div id="view-mode-group" class="flex items-center m3-surface-1 p-0.5 rounded-full border border-[var(--m3-outline-variant)] text-[11px] shadow-sm shrink-0">
                <button id="btn-view-single" type="button" data-view="single" class="view-mode-btn px-2.5 py-1 rounded-full font-bold transition">Output Only</button>
                <button id="btn-view-dual" type="button" data-view="dual" class="view-mode-btn px-2.5 py-1 rounded-full font-semibold transition">Side-by-Side</button>
                <button id="btn-view-split" type="button" data-view="split" class="view-mode-btn px-2.5 py-1 rounded-full font-semibold transition">Split Wipe</button>
              </div>

              <!-- MINIMIZED SPEC TELEMETRY & PORTAL VALIDATION PILL (Click to open details popup) -->
              <button id="btn-telemetry-pill" type="button" class="m3-spring flex items-center gap-1.5 px-2.5 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)] shadow-sm text-[11px] font-mono hover:border-[var(--m3-primary)] shrink-0" title="Click to inspect full Spec Telemetry & Portal Validation Checks">
                <span id="pill-telemetry-dims" class="font-bold text-m3-text">300×350 px</span>
                <span class="opacity-40">•</span>
                <span id="pill-telemetry-kb" class="font-bold text-emerald-400">≤ 75 KB</span>
                <span class="opacity-40">•</span>
                <span id="pill-telemetry-ratio" class="m3-text-muted">6:7</span>
                <span class="opacity-40">•</span>
                <span id="pill-telemetry-checks" class="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">PASS 5/5</span>
                <span class="material-symbols-outlined text-[13px] m3-text-muted">info</span>
              </button>
            </div>

            <!-- TOP-RIGHT CORNER EXPORT DOCK (Never overlaps the canvas in Side-by-Side or Output Only mode) -->
            <div class="flex items-center gap-1.5 m3-surface-1 p-1 rounded-2xl border border-[var(--m3-outline-variant)] shadow-lg ml-auto shrink-0">
              <!-- Format Pills (JPG | JPEG | PNG | WEBP) -->
              <div id="format-selector-group" class="flex items-center gap-0.5 bg-[var(--m3-surface-2)] p-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                ${(
                  [
                    { mime: 'image/jpeg', ext: 'JPG' },
                    { mime: 'image/jpeg', ext: 'JPEG' },
                    { mime: 'image/png', ext: 'PNG' },
                    { mime: 'image/webp', ext: 'WEBP' },
                  ] as { mime: ImageFormat; ext: 'JPG' | 'JPEG' | 'PNG' | 'WEBP' }[]
                )
                  .map(
                    (item) => `
                  <button type="button" data-format="${item.mime}" data-ext="${item.ext}" class="format-btn m3-spring px-1.5 py-1 rounded-lg font-mono text-[10px] font-bold text-center transition">
                    ${item.ext}
                  </button>
                `
                  )
                  .join('')}
              </div>

              <!-- Resolution Tier Pills (Low | Std 1x | High 2x) -->
              <div id="resolution-tier-group" class="flex items-center gap-0.5 bg-[var(--m3-surface-2)] p-0.5 rounded-xl border border-[var(--m3-outline-variant)]">
                <button type="button" data-tier="low" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">Low 0.75×</button>
                <button type="button" data-tier="standard" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">Std 1×</button>
                <button type="button" data-tier="high" class="tier-btn m3-spring py-1 px-1.5 rounded-lg text-[10px] font-bold text-center">High 2×</button>
              </div>

              <!-- Primary Export Button at Top-Right Corner -->
              <button id="btn-export-primary" type="button" class="m3-spring py-1.5 px-3 rounded-xl m3-primary font-display font-bold text-xs shadow-md flex items-center justify-center gap-1.5 hover:opacity-95 whitespace-nowrap">
                <span class="material-symbols-outlined text-[15px]">download</span>
                <span id="export-btn-text">Export 300×350 JPG</span>
              </button>
            </div>
          </div>

          <!-- CENTER CANVAS STAGE (Dead-Center in Viewport, 100% Unobstructed) -->
          <div class="flex-1 w-full flex items-center justify-center my-2 relative">
            
            <!-- EMPTY STATE NATIVE UPLOAD DROPZONE (Shown when no photo is loaded yet — Zero Demo Photo) -->
            <div id="empty-upload-stage" class="w-full max-w-md m3-surface-1 rounded-[28px] p-6 sm:p-8 border-2 border-dashed border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition flex flex-col items-center text-center cursor-pointer shadow-xl">
              <div class="w-14 h-14 rounded-2xl m3-primary-container flex items-center justify-center mb-3 shadow-inner">
                <span class="material-symbols-outlined text-[30px]">add_photo_alternate</span>
              </div>
              <h2 class="font-display font-bold text-base sm:text-lg text-m3-text">Drop or Select Image from Device</h2>
              <p class="text-xs m3-text-muted mt-1 max-w-xs leading-relaxed">
                100% native browser processing. Neural portrait matting &amp; Bradley-Roth adaptive signature isolation run strictly on your device.
              </p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span class="px-4 py-2 rounded-full m3-primary font-display font-bold text-xs shadow flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Choose Local Image</span>
                </span>
              </div>
              <div class="mt-4 pt-3 border-t border-[var(--m3-outline-variant)] w-full flex items-center justify-center gap-3 text-[10px] font-mono m3-text-muted">
                <span id="empty-target-spec-hint">Target: BUET 300 × 350 px • ≤ 75 KB • JPG</span>
              </div>
            </div>

            <!-- ACTIVE IMAGE WORKBENCH (Shown as soon as user uploads an image) -->
            <div id="workbench-stage-grid" class="hidden items-center justify-center gap-6 w-full max-w-4xl">
              
              <!-- RAW INPUT CARD (Only visible when user switches to Side-by-Side 'dual' mode) -->
              <div id="stage-raw-card" class="hidden m3-surface-1 rounded-3xl p-3.5 border border-[var(--m3-outline-variant)] flex-col items-center shadow-lg">
                <div class="w-full flex items-center justify-between mb-2 px-1 gap-3">
                  <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full m3-surface-2 font-bold">Raw Input</span>
                  <span id="raw-meta-badge" class="text-[10px] font-mono m3-text-muted font-bold"></span>
                </div>
                <div id="raw-dropzone" class="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[var(--m3-outline-variant)] cursor-pointer" style="width: 240px; height: 280px;" title="Click to replace image">
                  <img id="raw-preview-img" alt="Uploaded Raw Source" referrerpolicy="no-referrer" class="w-full h-full object-contain" />
                </div>
              </div>

              <!-- CONVERTED OUTPUT STAGE (Centered Hero Canvas) -->
              <div id="stage-output-card" class="m3-surface-1 rounded-3xl p-4 border border-[var(--m3-outline-variant)] flex flex-col items-center shadow-2xl relative">
                <div class="w-full flex items-center justify-between gap-4 mb-2.5 px-1">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span class="text-[10px] font-mono uppercase tracking-wider font-bold">Converted Output</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span id="out-dim-badge" class="text-[11px] font-mono font-bold text-m3-primary">300 × 350 px</span>
                    <button id="btn-stage-replace" type="button" class="text-[10px] font-mono px-2 py-0.5 rounded-md m3-surface-2 hover:m3-surface-3 font-semibold" title="Replace Image">Replace</button>
                    <button id="btn-stage-clear" type="button" class="text-[10px] font-mono px-2 py-0.5 rounded-md m3-surface-2 hover:text-rose-400 font-semibold" title="Clear Image">Clear</button>
                  </div>
                </div>

                <!-- Calibrated Output Viewport -->
                <div id="output-viewport-box" class="relative rounded-2xl overflow-hidden flex items-center justify-center p-4 checker-bg select-none border border-[var(--m3-outline-variant)]">
                  <div id="calibrated-frame-wrap" class="relative shadow-2xl rounded-lg overflow-hidden border border-white/80 transition-all duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing" style="width: 240px; height: 280px;">
                    <img id="converted-preview-img" alt="Converted Admission Output" referrerpolicy="no-referrer" class="w-full h-full object-contain pointer-events-none select-none" />
                    
                    <!-- Split-Wipe Raw Comparison Overlay -->
                    <div id="split-wipe-overlay" class="hidden absolute inset-0 overflow-hidden pointer-events-none" style="width: 50%;">
                      <img id="split-wipe-raw-img" alt="Raw Split Comparison" referrerpolicy="no-referrer" class="h-full max-w-none object-cover" style="width: 240px; height: 280px;" />
                      <div class="absolute top-0 bottom-0 right-0 w-0.5 bg-sky-400 shadow"></div>
                    </div>

                    <!-- Biometric Alignment Guide Overlay -->
                    <div id="biometric-guide-overlay" class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                      <div id="biometric-oval" class="w-[62%] h-[68%] border border-dashed border-sky-300 rounded-full"></div>
                      <div class="w-full border-t border-dashed border-sky-300/60 absolute top-[50%]"></div>
                      <div class="h-full border-l border-dashed border-sky-300/60 absolute left-[50%]"></div>
                    </div>

                    <!-- Live Neural Segmentation Progress Overlay Pill -->
                    <div id="canvas-neural-loading-pill" class="hidden absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-sky-400/40 items-center justify-center gap-2 pointer-events-none">
                      <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0"></span>
                      <span id="canvas-neural-loading-text" class="text-[10px] font-mono font-bold text-white truncate">Running Neural Matting…</span>
                    </div>
                  </div>
                </div>

                <!-- Split Wipe Slider Row -->
                <div id="split-wipe-control-row" class="hidden w-full mt-2.5 px-1 items-center gap-2">
                  <span class="text-[10px] font-mono font-bold m3-text-muted">Wipe</span>
                  <input id="slider-split-wipe" type="range" min="5" max="95" value="50" class="m3-slider flex-1" />
                  <span id="val-split-wipe" class="text-[10px] font-mono font-bold">50%</span>
                </div>

                <!-- Bottom Canvas Quick Bar -->
                <div class="w-full mt-2.5 flex items-center justify-between text-[10px] font-mono px-1 gap-4">
                  <label class="flex items-center gap-1.5 m3-text-muted cursor-pointer select-none">
                    <input id="chk-biometric-grid" type="checkbox" checked class="accent-[var(--m3-primary)] rounded" />
                    <span>Alignment Grid</span>
                  </label>
                  <span id="canvas-live-pill" class="font-bold text-emerald-400">300×350 px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Helper Hint & Recent Local Exports Strip -->
          <div class="w-full flex flex-wrap items-center justify-between gap-2 z-10">
            <span id="stage-footer-hint" class="text-[11px] font-mono m3-text-muted px-3 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)]">
              Drag directly on canvas to pan • 100% On-Device Native Processing
            </span>
            <div id="export-history-container" class="hidden items-center gap-1.5">
              <div id="export-history-list" class="flex items-center gap-1.5"></div>
            </div>
          </div>
        </section>
      </main>

      <!-- POP-UP MODAL 1: Minimized Admission Portals & Ruleset Matrix -->
      <div id="modal-portals" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-3xl w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl max-h-[86vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary">verified</span>
              <div>
                <h3 class="font-display font-bold text-base">Select Admission Portal Preset</h3>
                <p class="text-[11px] m3-text-muted">Calibrates exact dimensions, aspect ratio, background tone, and KB cap.</p>
              </div>
            </div>
            <button data-close-modal="portals" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center hover:m3-surface-3">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 pr-1 mt-3 space-y-4">
            <!-- Quick Portal Cards Grid inside Pop-up -->
            <div id="preset-chips-container" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5"></div>

            <!-- Compact Ruleset Reference Table inside Pop-up -->
            <div class="border-t border-[var(--m3-outline-variant)] pt-3">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="m3-surface-2 font-mono uppercase text-[10px]">
                    <th class="p-2.5 rounded-l-lg">Portal</th>
                    <th class="p-2.5">Dimensions</th>
                    <th class="p-2.5">Ratio</th>
                    <th class="p-2.5">Size Limit</th>
                    <th class="p-2.5">Signature Spec</th>
                    <th class="p-2.5 rounded-r-lg text-right">Select</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--m3-outline-variant)]">
                  ${presetsList
                    .map(
                      (p) => `
                    <tr class="hover:bg-[var(--m3-surface-2)] transition">
                      <td class="p-2.5 font-bold">${p.shortName}<span class="block text-[10px] font-normal m3-text-muted">${p.name}</span></td>
                      <td class="p-2.5 font-mono font-bold">${p.widthPx}×${p.heightPx} px</td>
                      <td class="p-2.5 font-mono">${p.ratioLabel}</td>
                      <td class="p-2.5 font-mono text-emerald-400 font-semibold">≤ ${p.maxKb} KB</td>
                      <td class="p-2.5 font-mono text-[10px] m3-text-muted">${p.sigDims || 'N/A'}</td>
                      <td class="p-2.5 text-right">
                        <button type="button" data-apply-preset="${p.id}" class="px-2.5 py-1 rounded-full m3-primary text-[11px] font-bold">Use</button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 2: Minimized Spec Telemetry & Portal Validation Checks Inspector -->
      <div id="modal-telemetry" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-m3-primary">monitoring</span>
              <h3 class="font-display font-bold text-base">Spec Telemetry &amp; Validation</h3>
            </div>
            <button data-close-modal="telemetry" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2.5 my-3">
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Output Dimensions</span>
              <span id="spec-dimensions" class="font-mono font-bold text-sm mt-0.5 block">300 × 350 px</span>
              <span id="spec-physical" class="text-[10px] font-mono m3-text-muted block">25.4 × 29.6 mm</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Encoded Size</span>
              <span id="spec-filesize" class="font-mono font-bold text-sm text-emerald-400 mt-0.5 block">Ready</span>
              <span id="spec-cap-note" class="text-[10px] font-mono m3-text-muted block">Cap: ≤ 75.0 KB</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Aspect Ratio</span>
              <span id="spec-ratio" class="font-mono font-bold text-sm mt-0.5 block">6 : 7</span>
              <span id="spec-lock-label" class="text-[10px] font-mono m3-text-muted block">Locked</span>
            </div>
            <div class="m3-surface-2 p-2.5 rounded-xl border border-[var(--m3-outline-variant)]">
              <span class="text-[10px] font-mono uppercase m3-text-muted block">Container</span>
              <span id="spec-format" class="font-mono font-bold text-sm mt-0.5 block">JPG (sRGB)</span>
              <span id="spec-quality" class="text-[10px] font-mono m3-text-muted block">Quality: 90%</span>
            </div>
          </div>

          <div class="mt-2">
            <h4 class="font-mono uppercase text-[10px] m3-text-muted font-bold mb-2">Portal Validation Checks</h4>
            <ul id="compliance-checklist-ul" class="space-y-1.5 text-xs"></ul>
          </div>
        </div>
      </div>

      <!-- POP-UP MODAL 3: 100% On-Device Data Privacy Inspector -->
      <div id="modal-privacy" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="m3-surface-1 max-w-md w-full rounded-[28px] p-5 border border-[var(--m3-outline-variant)] shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--m3-outline-variant)]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-400">shield_lock</span>
              <h3 class="font-display font-bold text-base">100% On-Device Native Privacy</h3>
            </div>
            <button data-close-modal="privacy" type="button" class="w-8 h-8 rounded-full m3-surface-2 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <p class="text-xs m3-text-muted my-3 leading-relaxed">
            All image decoding, neural portrait matting (@imgly/background-removal with IndexedDB weight caching), Edge Choke/Defringe &amp; Feather refinement, and O(N) Bradley-Roth Integral-Image signature isolation run strictly inside your browser memory. Zero files are ever uploaded to any server.
          </p>
          <div class="flex justify-end">
            <button data-close-modal="privacy" type="button" class="px-4 py-1.5 rounded-full m3-primary text-xs font-bold">Close</button>
          </div>
        </div>
      </div>

      <!-- Floating Toast Notification -->
      <div id="m3-toast-banner" class="fixed bottom-4 left-4 z-50 max-w-sm m3-primary px-3.5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold opacity-0 pointer-events-none translate-y-4 transition-all duration-200">
        <span class="material-symbols-outlined text-[16px]">verified</span>
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
          class="preset-chip m3-spring text-left p-2.5 rounded-2xl border transition flex flex-col justify-between ${
            isSelected
              ? 'm3-primary-container border-[var(--m3-primary)]'
              : 'm3-surface-2 hover:m3-surface-3 border-[var(--m3-outline-variant)]'
          }"
        >
          <div class="flex items-center justify-between w-full">
            <span class="font-bold text-xs truncate">${p.shortName}</span>
            <span class="w-2 h-2 rounded-full ${
              isSelected ? 'bg-[var(--m3-primary)]' : 'bg-emerald-400/70'
            } shrink-0"></span>
          </div>
          <div class="font-mono text-[11px] font-semibold mt-1">${
            p.widthPx
          }×${p.heightPx} px</div>
          <div class="text-[10px] opacity-75 truncate">≤ ${p.maxKb} KB • ${
            p.bgLabel
          }</div>
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
    const wrap = document.getElementById('export-history-container');
    const list = document.getElementById('export-history-list');
    if (!wrap || !list) return;

    if (this.exportHistory.length === 0) {
      wrap.classList.add('hidden');
      wrap.classList.remove('flex');
      return;
    }
    wrap.classList.remove('hidden');
    wrap.classList.add('flex');
    list.innerHTML = this.exportHistory
      .slice(0, 2)
      .map(
        (item) => `
        <a href="${item.dataUrl}" download="${item.filename}" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full m3-surface-1 border border-[var(--m3-outline-variant)] text-[10px] hover:border-[var(--m3-primary)] transition">
          <img src="${item.dataUrl}" alt="${item.filename}" referrerpolicy="no-referrer" class="w-4 h-4 rounded object-cover shrink-0" />
          <span class="font-mono font-bold truncate">${item.width}×${item.height} (${item.sizeKb}KB)</span>
        </a>
      `
      )
      .join('');
  }

  private bindEvents(): void {
    const fileInput = document.getElementById(
      'local-file-input'
    ) as HTMLInputElement | null;

    const triggerFileDialog = () => {
      fileInput?.click();
    };

    document
      .getElementById('btn-top-upload')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('empty-upload-stage')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('btn-stage-replace')
      ?.addEventListener('click', triggerFileDialog);
    document
      .getElementById('raw-dropzone')
      ?.addEventListener('click', triggerFileDialog);

    document
      .getElementById('btn-stage-clear')
      ?.addEventListener('click', () => {
        this.clearUploadedImage();
      });

    // Global drag & drop onto center stage
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

    // Theme switcher pills
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

    // Minimized Pop-up Triggers
    document
      .getElementById('btn-open-portal-popup')
      ?.addEventListener('click', () => {
        document.getElementById('modal-portals')?.classList.remove('hidden');
      });

    document
      .getElementById('btn-telemetry-pill')
      ?.addEventListener('click', () => {
        document.getElementById('modal-telemetry')?.classList.remove('hidden');
      });

    document
      .getElementById('btn-privacy-badge')
      ?.addEventListener('click', () => {
        document.getElementById('modal-privacy')?.classList.remove('hidden');
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

    document
      .querySelectorAll<HTMLButtonElement>('[data-apply-preset]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.applyPreset;
          if (id && ADMISSION_PRESETS[id]) {
            this.applyPreset(ADMISSION_PRESETS[id]);
            document.getElementById('modal-portals')?.classList.add('hidden');
          }
        });
      });

    // Unit selector buttons (px, mm, cm, in)
    document
      .querySelectorAll<HTMLButtonElement>('#unit-selector-group .unit-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const unit = btn.dataset.unit as UnitType;
          if (unit) {
            this.state.unit = unit;
            this.syncDimensionInputsFromPx();
            if (this.lastResult) {
              this.syncDynamicDOM(this.lastResult);
            }
          }
        });
      });

    // Width & Height inputs
    const inputW = document.getElementById(
      'input-dim-w'
    ) as HTMLInputElement | null;
    const inputH = document.getElementById(
      'input-dim-h'
    ) as HTMLInputElement | null;

    inputW?.addEventListener('input', () => {
      const val = parseFloat(inputW.value);
      if (!Number.isFinite(val) || val <= 0) return;
      const newW = unitToPx(val, this.state.unit, this.state.dpi);
      const locked = applyAspectRatioLock(
        'w',
        newW,
        this.state.aspectRatioLock,
        this.state.widthPx,
        this.state.heightPx
      );
      this.state.widthPx = locked.widthPx;
      this.state.heightPx = locked.heightPx;
      if (this.state.aspectRatioLock !== 'Free') {
        this.syncDimensionInputsFromPx('width');
      }
      this.schedulePipelineUpdate();
    });

    inputH?.addEventListener('input', () => {
      const val = parseFloat(inputH.value);
      if (!Number.isFinite(val) || val <= 0) return;
      const newH = unitToPx(val, this.state.unit, this.state.dpi);
      const locked = applyAspectRatioLock(
        'h',
        newH,
        this.state.aspectRatioLock,
        this.state.widthPx,
        this.state.heightPx
      );
      this.state.widthPx = locked.widthPx;
      this.state.heightPx = locked.heightPx;
      if (this.state.aspectRatioLock !== 'Free') {
        this.syncDimensionInputsFromPx('height');
      }
      this.schedulePipelineUpdate();
    });

    // Lock aspect ratio button
    document
      .getElementById('btn-lock-aspect')
      ?.addEventListener('click', () => {
        if (this.state.aspectRatioLock === 'Free') {
          const computed = computeAspectRatio(
            this.state.widthPx,
            this.state.heightPx
          );
          this.state.aspectRatioLock = computed.ratioText;
        } else {
          this.state.aspectRatioLock = 'Free';
        }
        this.schedulePipelineUpdate(true);
      });

    // Swap Width & Height
    document.getElementById('btn-swap-dims')?.addEventListener('click', () => {
      const prevW = this.state.widthPx;
      this.state.widthPx = this.state.heightPx;
      this.state.heightPx = prevW;
      const computed = computeAspectRatio(
        this.state.widthPx,
        this.state.heightPx
      );
      this.state.aspectRatioLock = computed.ratioText;
      this.syncDimensionInputsFromPx();
      this.schedulePipelineUpdate(true);
    });

    // Aspect Ratio chips
    document
      .querySelectorAll<HTMLButtonElement>('#aspect-ratio-group .ratio-chip')
      .forEach((chip) => {
        chip.addEventListener('click', () => {
          const ratio = chip.dataset.ratio || 'Free';
          this.state.aspectRatioLock = ratio;
          if (ratio !== 'Free') {
            const locked = applyAspectRatioLock(
              'w',
              this.state.widthPx,
              ratio,
              this.state.widthPx,
              this.state.heightPx
            );
            this.state.widthPx = locked.widthPx;
            this.state.heightPx = locked.heightPx;
            this.syncDimensionInputsFromPx();
          }
          this.schedulePipelineUpdate(true);
        });
      });

    // DPI selector
    document.getElementById('dpi-btn-300')?.addEventListener('click', () => {
      this.state.dpi = 300;
      this.syncDimensionInputsFromPx();
      this.schedulePipelineUpdate(true);
    });
    document.getElementById('dpi-btn-72')?.addEventListener('click', () => {
      this.state.dpi = 72;
      this.syncDimensionInputsFromPx();
      this.schedulePipelineUpdate(true);
    });

    // Resolution tier selector
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

    // Sliders: Zoom, Pan X, Pan Y, Rotation, Quality, Max KB, Edge Choke, Edge Feather, Sig Threshold
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
    bindSlider('slider-quality', (v) => {
      this.state.qualityPct = v;
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

    // Signature Ink Color Mode Toggle ("Original Blue/Black" vs "Pure Mono Black")
    const setSigInkMode = (mode: SigInkColorMode) => {
      this.state.sigInkColorMode = mode;
      this.state.sigHighContrast = mode === 'mono';
      this.schedulePipelineUpdate(true);
    };

    document
      .getElementById('btn-sig-ink-original')
      ?.addEventListener('click', () => setSigInkMode('original'));
    document
      .getElementById('btn-sig-ink-mono')
      ?.addEventListener('click', () => setSigInkMode('mono'));

    // Quick -90 / +90 rotation buttons
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
      this.state.qualityPct = 90;
      this.state.bgChokePx = 0;
      this.state.bgFeather = 1.5;
      this.schedulePipelineUpdate(true);
      this.showToast('Reset crop and edge parameters.');
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

    // View mode buttons (single | dual | split)
    document
      .querySelectorAll<HTMLButtonElement>('#view-mode-group .view-mode-btn')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.view as ViewMode;
          if (mode) {
            this.state.viewMode = mode;
            this.syncViewModeLayout();
          }
        });
      });

    // Split wipe slider
    const splitSlider = document.getElementById(
      'slider-split-wipe'
    ) as HTMLInputElement | null;
    splitSlider?.addEventListener('input', () => {
      this.state.splitPositionPct = parseFloat(splitSlider.value);
      this.syncViewModeLayout();
    });

    // Direct drag-to-pan on the calibrated output frame
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    frameWrap?.addEventListener('pointerdown', (e) => {
      this.isDraggingCanvas = true;
      this.dragStart = {
        x: e.clientX,
        y: e.clientY,
        offsetX: this.state.offsetX,
        offsetY: this.state.offsetY,
      };
      frameWrap.setPointerCapture(e.pointerId);
    });
    frameWrap?.addEventListener('pointermove', (e) => {
      if (!this.isDraggingCanvas) return;
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
    });

    // Background Cutout toggle
    document
      .getElementById('btn-toggle-bg-remove')
      ?.addEventListener('click', () => {
        this.state.bgRemovalEnabled = !this.state.bgRemovalEnabled;
        this.schedulePipelineUpdate(true);
        this.triggerNeuralMattingIfNeeded();
      });

    // Biometric Alignment Grid toggle
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

    // Studio background color swatches
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
              this.showToast(
                'Switched to PNG to preserve transparent alpha cutout.'
              );
            }
            this.schedulePipelineUpdate(true);
            this.triggerNeuralMattingIfNeeded();
          }
        });
      });

    // Custom background color input
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

    // Primary Export button at Top-Right Corner
    document
      .getElementById('btn-export-primary')
      ?.addEventListener('click', () => {
        this.handleExportCurrentFile();
      });
  }

  private syncDimensionInputsFromPx(skipField?: 'width' | 'height'): void {
    const inputW = document.getElementById(
      'input-dim-w'
    ) as HTMLInputElement | null;
    const inputH = document.getElementById(
      'input-dim-h'
    ) as HTMLInputElement | null;
    const labelW = document.getElementById('label-unit-w');
    const labelH = document.getElementById('label-unit-h');

    if (labelW) labelW.textContent = this.state.unit;
    if (labelH) labelH.textContent = this.state.unit;

    if (inputW && skipField !== 'width') {
      inputW.value = String(
        pxToUnit(this.state.widthPx, this.state.unit, this.state.dpi)
      );
    }
    if (inputH && skipField !== 'height') {
      inputH.value = String(
        pxToUnit(this.state.heightPx, this.state.unit, this.state.dpi)
      );
    }
  }

  private syncThemeButtons(): void {
    document
      .querySelectorAll<HTMLButtonElement>('#theme-switcher-bar .theme-pill')
      .forEach((btn) => {
        const isCurrent = btn.dataset.theme === this.state.theme;
        btn.className = `theme-pill m3-spring flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          isCurrent
            ? 'm3-primary shadow-sm'
            : 'm3-text-muted hover:text-m3-text'
        }`;
      });
  }

  private syncViewModeLayout(): void {
    const rawCard = document.getElementById('stage-raw-card');
    const splitOverlay = document.getElementById('split-wipe-overlay');
    const splitRow = document.getElementById('split-wipe-control-row');
    const valSplit = document.getElementById('val-split-wipe');

    document
      .querySelectorAll<HTMLButtonElement>('#view-mode-group .view-mode-btn')
      .forEach((btn) => {
        const active = btn.dataset.view === this.state.viewMode;
        btn.className = `view-mode-btn px-3 py-1 rounded-full transition ${
          active
            ? 'm3-primary font-bold shadow-sm'
            : 'm3-text-muted font-semibold hover:text-m3-text'
        }`;
      });

    if (!rawCard || !splitOverlay || !splitRow) return;

    if (this.state.viewMode === 'dual') {
      rawCard.classList.remove('hidden');
      rawCard.classList.add('flex');
      splitOverlay.classList.add('hidden');
      splitRow.classList.add('hidden');
      splitRow.classList.remove('flex');
    } else if (this.state.viewMode === 'single') {
      rawCard.classList.add('hidden');
      rawCard.classList.remove('flex');
      splitOverlay.classList.add('hidden');
      splitRow.classList.add('hidden');
      splitRow.classList.remove('flex');
    } else {
      rawCard.classList.add('hidden');
      rawCard.classList.remove('flex');
      splitOverlay.classList.remove('hidden');
      splitOverlay.style.width = `${this.state.splitPositionPct}%`;
      splitRow.classList.remove('hidden');
      splitRow.classList.add('flex');
      if (valSplit) valSplit.textContent = `${this.state.splitPositionPct}%`;
    }
  }

  private syncDynamicDOM(result: ProcessedExportResult): void {
    const preset = this.getActivePreset();
    this.renderPresetChips();
    this.syncThemeButtons();
    this.syncDimensionInputsFromPx();
    this.syncViewModeLayout();

    // Toggle Empty Upload Stage vs Active Workbench Stage
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

    // Mode buttons
    const btnPhoto = document.getElementById('mode-btn-photo');
    const btnSig = document.getElementById('mode-btn-signature');
    if (btnPhoto && btnSig) {
      btnPhoto.className = `m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
        this.state.mode === 'photo'
          ? 'm3-primary shadow-sm'
          : 'm3-text-muted hover:text-m3-text'
      }`;
      btnSig.className = `m3-spring flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
        this.state.mode === 'signature'
          ? 'm3-primary shadow-sm'
          : 'm3-text-muted hover:text-m3-text'
      }`;
    }

    // Minimized Portal Preset Pill
    const setText = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('minimized-portal-name', preset.name);
    setText(
      'minimized-portal-spec',
      `${preset.widthPx}×${preset.heightPx} • ≤${preset.maxKb}KB`
    );
    setText(
      'empty-target-spec-hint',
      `Target: ${preset.shortName} ${result.outWidth} × ${result.outHeight} px • ≤ ${this.state.targetCapKb} KB • ${this.state.formatExtLabel}`
    );

    // Unit buttons
    document
      .querySelectorAll<HTMLButtonElement>('#unit-selector-group .unit-btn')
      .forEach((btn) => {
        const active = btn.dataset.unit === this.state.unit;
        btn.className = `unit-btn px-2 py-0.5 rounded-full transition ${
          active ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });

    // Lock aspect ratio button & icon
    const isLocked = this.state.aspectRatioLock !== 'Free';
    const btnLock = document.getElementById('btn-lock-aspect');
    const iconLock = document.getElementById('icon-lock-aspect');
    if (btnLock && iconLock) {
      btnLock.className = `m3-spring w-8 h-8 rounded-xl flex items-center justify-center ${
        isLocked ? 'm3-primary-container' : 'm3-surface-2'
      }`;
      iconLock.textContent = isLocked ? 'lock' : 'lock_open';
    }

    // Aspect ratio chips
    document
      .querySelectorAll<HTMLButtonElement>('#aspect-ratio-group .ratio-chip')
      .forEach((chip) => {
        const active = chip.dataset.ratio === this.state.aspectRatioLock;
        chip.className = `ratio-chip text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold transition ${
          active ? 'm3-primary font-bold' : 'm3-surface-2 hover:m3-surface-3'
        }`;
      });

    // DPI buttons
    const dpi300 = document.getElementById('dpi-btn-300');
    const dpi72 = document.getElementById('dpi-btn-72');
    if (dpi300 && dpi72) {
      dpi300.className = `text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold transition ${
        this.state.dpi === 300
          ? 'm3-secondary-container'
          : 'm3-surface-2 m3-text-muted'
      }`;
      dpi72.className = `text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold transition ${
        this.state.dpi === 72
          ? 'm3-secondary-container'
          : 'm3-surface-2 m3-text-muted'
      }`;
    }

    // Resolution tier buttons in Top-Right Export Dock
    document
      .querySelectorAll<HTMLButtonElement>('#resolution-tier-group .tier-btn')
      .forEach((btn) => {
        const active = btn.dataset.tier === this.state.resolutionTier;
        btn.className = `tier-btn m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center ${
          active ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });

    // Sync sliders and value pills
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
      `${this.state.offsetX > 0 ? '+' : ''}${this.state.offsetX} px`
    );
    setSliderAndText(
      'slider-pan-y',
      'val-pan-y',
      this.state.offsetY,
      `${this.state.offsetY > 0 ? '+' : ''}${this.state.offsetY} px`
    );
    setSliderAndText(
      'slider-rotation',
      'val-rotation',
      this.state.rotationDeg,
      `${this.state.rotationDeg}°`
    );
    setSliderAndText(
      'slider-quality',
      'val-quality',
      this.state.qualityPct,
      `${this.state.qualityPct}%`
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

    const tVal = (this.state.sigThreshold / 100).toFixed(2);
    setSliderAndText(
      'slider-sig-threshold',
      'val-sig-threshold',
      this.state.sigThreshold,
      `t = ${tVal}`
    );

    // Signature Ink Color Mode buttons
    const btnInkOrig = document.getElementById('btn-sig-ink-original');
    const btnInkMono = document.getElementById('btn-sig-ink-mono');
    if (btnInkOrig && btnInkMono) {
      const isOrig = this.state.sigInkColorMode !== 'mono';
      btnInkOrig.className = `m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${
        isOrig ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
      }`;
      btnInkMono.className = `m3-spring py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${
        !isOrig ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
      }`;
    }

    // Format buttons in Top-Right Export Dock
    document
      .querySelectorAll<HTMLButtonElement>('#format-selector-group .format-btn')
      .forEach((btn) => {
        const active = btn.dataset.ext === this.state.formatExtLabel;
        btn.className = `format-btn m3-spring px-2 py-1 rounded-lg font-mono text-[10px] font-bold text-center transition ${
          active ? 'm3-primary shadow-sm' : 'm3-text-muted hover:text-m3-text'
        }`;
      });

    // Update Raw & Converted Stage Images when an image is uploaded
    const rawImg = document.getElementById(
      'raw-preview-img'
    ) as HTMLImageElement | null;
    const splitRawImg = document.getElementById(
      'split-wipe-raw-img'
    ) as HTMLImageElement | null;
    const outImg = document.getElementById(
      'converted-preview-img'
    ) as HTMLImageElement | null;
    const frameWrap = document.getElementById('calibrated-frame-wrap');
    const ovalGuide = document.getElementById('biometric-oval');

    if (this.rawImageEl && rawImg) {
      if (rawImg.src !== this.rawImageEl.src) {
        rawImg.src = this.rawImageEl.src;
      }
      if (splitRawImg && splitRawImg.src !== this.rawImageEl.src) {
        splitRawImg.src = this.rawImageEl.src;
      }
    }

    if (this.customUploadedFile) {
      setText(
        'raw-meta-badge',
        `${this.customUploadedFile.width}×${this.customUploadedFile.height} • ${this.customUploadedFile.sizeKb} KB`
      );
    }

    if (outImg && result.dataUrl) {
      outImg.src = result.dataUrl;
    }

    if (frameWrap) {
      const ratio = result.outWidth / Math.max(1, result.outHeight);
      const maxBoxW = this.state.viewMode === 'dual' ? 250 : 340;
      const maxBoxH = 290;
      let boxW = maxBoxH * ratio;
      let boxH = maxBoxH;
      if (boxW > maxBoxW) {
        boxW = maxBoxW;
        boxH = Math.max(72, boxW / ratio);
      }
      frameWrap.style.width = `${Math.round(boxW)}px`;
      frameWrap.style.height = `${Math.round(boxH)}px`;
      if (splitRawImg) {
        splitRawImg.style.width = `${Math.round(boxW)}px`;
        splitRawImg.style.height = `${Math.round(boxH)}px`;
      }
      const bgHex =
        this.state.bgTone === 'custom'
          ? this.state.customBgColor
          : BG_TONE_HEX[this.state.bgTone];
      frameWrap.style.backgroundColor =
        this.state.bgRemovalEnabled && this.state.bgTone !== 'alpha'
          ? bgHex
          : 'transparent';
    }

    const isSig =
      this.state.mode === 'signature' ||
      result.outWidth / result.outHeight > 1.8;

    if (ovalGuide) {
      ovalGuide.className = isSig
        ? 'w-[84%] h-[54%] border border-dashed border-sky-400/70 rounded-lg'
        : 'w-[62%] h-[68%] border border-dashed border-sky-300 rounded-full';
    }

    // Background cutout button & portrait vs signature matting controls
    const bgRemoveText = document.getElementById('bg-remove-status-text');
    const btnBgRemove = document.getElementById('btn-toggle-bg-remove');
    const portraitMatting = document.getElementById(
      'portrait-matting-controls'
    );
    const sigMatting = document.getElementById('signature-matting-controls');

    if (bgRemoveText) {
      bgRemoveText.textContent = this.state.bgRemovalEnabled ? 'ACTIVE' : 'OFF';
    }
    if (btnBgRemove) {
      btnBgRemove.className = `m3-spring px-2.5 py-1 rounded-full font-mono font-bold text-[10px] ${
        this.state.bgRemovalEnabled
          ? 'm3-primary-container'
          : 'm3-surface-2 m3-text-muted'
      }`;
    }
    if (portraitMatting && sigMatting) {
      portraitMatting.classList.toggle('hidden', isSig);
      portraitMatting.classList.toggle('flex', !isSig);
      sigMatting.classList.toggle('hidden', !isSig);
      sigMatting.classList.toggle('flex', isSig);
    }
    if (isSig || !this.state.bgRemovalEnabled) {
      const canvasOverlay = document.getElementById('canvas-neural-loading-pill');
      if (canvasOverlay) {
        canvasOverlay.classList.add('hidden');
        canvasOverlay.classList.remove('flex');
      }
    }

    // Swatch rings
    document
      .querySelectorAll<HTMLButtonElement>('.bg-swatch')
      .forEach((swatch) => {
        const active = swatch.dataset.bgtone === this.state.bgTone;
        swatch.classList.toggle('ring-2', active);
        swatch.classList.toggle('ring-[var(--m3-primary)]', active);
      });

    // Minimized Telemetry Pill & Pop-up Readouts
    const mmW = pxToUnit(result.outWidth, 'mm', this.state.dpi);
    const mmH = pxToUnit(result.outHeight, 'mm', this.state.dpi);
    const ratioInfo = computeAspectRatio(result.outWidth, result.outHeight);
    const fmtLabel = this.state.formatExtLabel;
    const kbDisplay = result.hasSourceImage
      ? `${result.sizeKb} / ${this.state.targetCapKb} KB`
      : `≤ ${this.state.targetCapKb} KB`;

    setText('out-dim-badge', `${result.outWidth} × ${result.outHeight} px`);
    setText(
      'canvas-live-pill',
      result.hasSourceImage
        ? `${result.outWidth}×${result.outHeight} px • ${result.sizeKb} KB`
        : `${result.outWidth}×${result.outHeight} px`
    );

    setText('pill-telemetry-dims', `${result.outWidth}×${result.outHeight} px`);
    setText('pill-telemetry-kb', kbDisplay);
    setText('pill-telemetry-ratio', ratioInfo.ratioText);

    setText('spec-dimensions', `${result.outWidth} × ${result.outHeight} px`);
    setText('spec-physical', `${mmW} × ${mmH} mm`);
    setText(
      'spec-filesize',
      result.hasSourceImage ? `${result.sizeKb} KB` : 'Awaiting Upload'
    );
    setText('spec-cap-note', `Cap: ≤ ${this.state.targetCapKb.toFixed(1)} KB`);
    setText('spec-ratio', ratioInfo.ratioText.replace(':', ' : '));
    setText(
      'spec-lock-label',
      this.state.aspectRatioLock !== 'Free'
        ? 'Locked Proportional'
        : 'Free Custom Ratio'
    );
    setText('spec-format', `${fmtLabel} (sRGB)`);
    setText('spec-quality', `Quality: ${result.qualityUsed}%`);

    const compliance = evaluatePortalCompliance(
      this.state,
      result.hasSourceImage ? result.sizeKb : this.state.targetCapKb * 0.7,
      preset
    );
    setText(
      'pill-telemetry-checks',
      `PASS ${compliance.passedCount}/${compliance.totalCount}`
    );

    const checklistUl = document.getElementById('compliance-checklist-ul');
    if (checklistUl) {
      checklistUl.innerHTML = compliance.checks
        .map(
          (c) => `
          <li class="flex items-center justify-between p-2 rounded-xl m3-surface-2 gap-2">
            <span class="flex items-center gap-2 font-medium text-[11px] leading-tight">
              <span class="material-symbols-outlined ${
                c.passed ? 'text-emerald-400' : 'text-amber-400'
              } text-[15px] shrink-0">${
                c.passed ? 'check_circle' : 'info'
              }</span>
              <span>${c.label}</span>
            </span>
          </li>
        `
        )
        .join('');
    }

    setText(
      'export-btn-text',
      result.hasSourceImage
        ? `Export ${result.outWidth}×${result.outHeight} ${fmtLabel} (${result.sizeKb} KB)`
        : `Export ${result.outWidth}×${result.outHeight} ${fmtLabel}`
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

