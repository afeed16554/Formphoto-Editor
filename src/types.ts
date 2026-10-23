export type UnitType = 'px' | 'mm' | 'cm' | 'in';

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export type ResolutionTier = 'standard' | 'low' | 'high';

export type StudioMode = 'photo' | 'signature';

export type ViewMode = 'single' | 'dual' | 'split';

export type ThemeKey = 'oled' | 'warm' | 'light' | 'gray';

export type BgToneKey = 'blue' | 'white' | 'grey' | 'alpha' | 'custom';

export type SigInkColorMode = 'original' | 'mono';

export interface AdmissionPreset {
  id: string;
  name: string;
  shortName: string;
  category: 'Bangladesh' | 'India & Global' | 'Signature';
  mode: StudioMode;
  widthPx: number;
  heightPx: number;
  minKb: number;
  maxKb: number;
  ratioLabel: string;
  defaultBg: BgToneKey;
  bgLabel: string;
  dpi: 72 | 300;
  icon: string;
  note: string;
  sigDims?: string;
  sigMaxKb?: string;
}

export interface TransformState {
  mode: StudioMode;
  presetId: string;
  widthPx: number;
  heightPx: number;
  unit: UnitType;
  dpi: 72 | 300;
  aspectRatioLock: string;
  rotationDeg: number;
  scalePct: number;
  offsetX: number;
  offsetY: number;
  flipH: boolean;
  flipV: boolean;
  bgTone: BgToneKey;
  customBgColor: string;
  bgRemovalEnabled: boolean;
  bgTolerance: number;
  bgChokePx: number;
  bgFeather: number;
  sigHighContrast: boolean;
  sigInkColorMode: SigInkColorMode;
  sigThreshold: number;
  format: ImageFormat;
  formatExtLabel: 'JPG' | 'JPEG' | 'PNG' | 'WEBP';
  targetCapKb: number;
  qualityPct: number;
  resolutionTier: ResolutionTier;
  stripExif: boolean;
  viewMode: ViewMode;
  zoomPct: number;
  showGrid: boolean;
  splitPositionPct: number;
  theme: ThemeKey;
}

export interface ComplianceCheckResult {
  id: string;
  label: string;
  passed: boolean;
}

export interface ExportRecord {
  id: string;
  timestamp: string;
  presetName: string;
  width: number;
  height: number;
  sizeKb: number;
  formatLabel: string;
  resolutionTier: ResolutionTier;
  dataUrl: string;
  filename: string;
}
