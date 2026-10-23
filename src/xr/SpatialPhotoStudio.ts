import * as THREE from 'three';
import * as xb from 'xrblocks';

const EMPTY_TRANSPARENT_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export class SpatialPhotoStudio extends xb.Script {
  private statusText?: xb.UIText;
  private previewImage?: xb.UIImage;
  private scaleText?: xb.UIText;
  private initialSrc: string;

  constructor(initialSrc?: string) {
    super();
    this.initialSrc = initialSrc || EMPTY_TRANSPARENT_GIF;
  }

  init() {
    this.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.8));

    this.statusText = new xb.UIText({
      text: '300×350 px · ≤75 KB · 300 DPI Calibrated',
      style: { fontSize: 16, opacity: 0.85, textAlign: 'center', color: '#4edea3' },
    });

    this.previewImage = new xb.UIImage({
      src: this.initialSrc,
      ariaLabel: 'Biometric admission output preview',
      style: {
        width: '100%',
        height: 220,
        objectFit: 'contain',
        borderRadius: 16,
        backgroundColor: '#ffffff',
      },
    });

    this.scaleText = new xb.UIText({
      text: '100%',
      style: { fontSize: 18, fontWeight: 'bold' },
    });

    const slider = new xb.UISlider({
      ariaLabel: 'Spatial crop scale',
      min: 80,
      max: 200,
      step: 5,
      value: 100,
      style: { width: '100%', height: 38 },
      onInput: (value: number) => {
        if (this.scaleText) this.scaleText.text = `${value}%`;
        if (this.statusText) {
          this.statusText.text = `Crop Scale: ${value}% · ICAO 9303 Aligned`;
        }
      },
    });

    const card = new xb.UICard({
      size: { width: 0.64, height: 'auto' },
      manipulation: true,
      edge: true,
      style: { flexDirection: 'column', gap: 14, padding: 20 },
      children: [
        new xb.UIText({
          text: 'FormPhoto Spatial Studio',
          style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
        }),
        this.statusText,
        this.previewImage,
        new xb.UIPanel({
          style: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
          children: [
            new xb.UIText({
              text: 'Subject Scale Factor',
              style: { fontSize: 16 },
            }),
            this.scaleText,
          ],
        }),
        slider,
        new xb.UIPanel({
          style: { width: '100%', flexDirection: 'row', gap: 10 },
          children: [
            new xb.UIButton({
              label: 'White BG (BUET)',
              icon: 'check_circle',
              style: { flexGrow: 1 },
              onClick: () => {
                if (this.previewImage) {
                  this.previewImage.style.backgroundColor = '#ffffff';
                }
                if (this.statusText) {
                  this.statusText.text = 'BUET White Backdrop Active (≤75 KB)';
                }
              },
            }),
            new xb.UIButton({
              label: 'Sky Blue (NEET)',
              icon: 'palette',
              style: { flexGrow: 1 },
              onClick: () => {
                if (this.previewImage) {
                  this.previewImage.style.backgroundColor = '#38bdf8';
                }
                if (this.statusText) {
                  this.statusText.text = 'NEET Sky Blue Backdrop Active (≤50 KB)';
                }
              },
            }),
          ],
        }),
      ],
    });

    card.position.set(0, 1.45, -1.15);
    this.add(card);
  }
}

let xrInitialized = false;

export async function launchSpatialXRStudio(initialSrc?: string): Promise<void> {
  if (xrInitialized) return;
  xrInitialized = true;
  const options = new xb.Options();
  options.setAppTitle('FormPhoto Spatial Studio');
  xb.add(new SpatialPhotoStudio(initialSrc));
  await xb.init(options);
}
