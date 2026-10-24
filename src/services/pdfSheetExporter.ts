import { AdmissionPreset, TransformState } from '../types';
import { pxToUnit } from '../utils/photoMath';

/**
 * Generates an A4 (210mm × 297mm) printable admission photo/signature sheet
 * and triggers a direct `.pdf` file download 100% locally in the browser
 * (zero external network dependencies, exact A4 page geometry 595.28 × 841.89 pt).
 */
export async function downloadA4PrintableSheetPdf(
  photoDataUrl: string,
  outWidth: number,
  outHeight: number,
  state: TransformState,
  preset: AdmissionPreset,
  filename: string
): Promise<void> {
  // Render a crisp 150 DPI A4 sheet canvas (1240 × 1754 px)
  const a4W = 1240;
  const a4H = 1754;
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = a4W;
  sheetCanvas.height = a4H;
  const ctx = sheetCanvas.getContext('2d');
  if (!ctx) return;

  // Pure white A4 paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4W, a4H);

  // Header banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(60, 52, a4W - 120, 74);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(
    `FormPhoto Pro — A4 Calibrated Admission Print Sheet (${preset.shortName})`,
    84,
    86
  );

  const mmW = pxToUnit(outWidth, 'mm', state.dpi);
  const mmH = pxToUnit(outHeight, 'mm', state.dpi);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px monospace';
  ctx.fillText(
    `Spec: ${outWidth}×${outHeight} px (${mmW}×${mmH} mm @ ${state.dpi} DPI) • Cap: <=${state.targetCapKb} KB • A4 (210×297 mm)`,
    84,
    110
  );

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = (e) => reject(e);
    im.src = photoDataUrl;
  });

  // Compute physical cell size on 150 DPI A4 canvas (150 px per inch = 5.9055 px/mm)
  const pxPerMm = a4W / 210;
  const cellW = Math.max(
    110,
    Math.min(320, Math.round(mmW * pxPerMm * (state.mode === 'signature' ? 1.5 : 1.15)))
  );
  const cellH = Math.max(
    55,
    Math.round(cellW * (outHeight / Math.max(1, outWidth)))
  );

  const marginX = 76;
  const startY = 164;
  const gapX = 28;
  const gapY = 34;

  const cols = Math.max(1, Math.min(4, Math.floor((a4W - marginX * 2 + gapX) / (cellW + gapX))));
  const rows = Math.max(1, Math.min(5, Math.floor((a4H - startY - 120 + gapY) / (cellH + gapY))));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginX + c * (cellW + gapX);
      const y = startY + r * (cellH + gapY);

      // Draw photo/signature tile
      ctx.drawImage(img, x, y, cellW, cellH);

      // Draw precision trim border & corner crop marks
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      const tick = 8;
      // Top-left crop mark
      ctx.beginPath();
      ctx.moveTo(x - tick, y);
      ctx.lineTo(x - 2, y);
      ctx.moveTo(x, y - tick);
      ctx.lineTo(x, y - 2);
      // Top-right
      ctx.moveTo(x + cellW + 2, y);
      ctx.lineTo(x + cellW + tick, y);
      ctx.moveTo(x + cellW, y - tick);
      ctx.lineTo(x + cellW, y - 2);
      // Bottom-left
      ctx.moveTo(x - tick, y + cellH);
      ctx.lineTo(x - 2, y + cellH);
      ctx.moveTo(x, y + cellH + 2);
      ctx.lineTo(x, y + cellH + tick);
      // Bottom-right
      ctx.moveTo(x + cellW + 2, y + cellH);
      ctx.lineTo(x + cellW + tick, y + cellH);
      ctx.moveTo(x + cellW, y + cellH + 2);
      ctx.lineTo(x + cellW, y + cellH + tick);
      ctx.stroke();
    }
  }

  // Footer calibration bar
  ctx.fillStyle = '#475569';
  ctx.font = '13px monospace';
  ctx.fillText(
    `Generated 100% On-Device by FormPhoto Pro • ${cols * rows} calibrated copies • Print at 100% scale on A4 paper`,
    marginX,
    a4H - 48
  );

  // Encode sheet as high-quality JPEG and wrap in a standard A4 PDF 1.4 document
  const jpegDataUrl = sheetCanvas.toDataURL('image/jpeg', 0.94);
  const pdfBytes = buildSinglePageJpegA4Pdf(jpegDataUrl, a4W, a4H);
  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Wraps a base64 JPEG DataURL into a valid, standards-compliant PDF 1.4 binary
 * with exact A4 page dimensions (`595.28 × 841.89 pt`).
 */
function buildSinglePageJpegA4Pdf(
  jpegDataUrl: string,
  imgW: number,
  imgH: number
): Uint8Array {
  const base64 = jpegDataUrl.split(',')[1] || '';
  const binStr = atob(base64);
  const jpegBytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    jpegBytes[i] = binStr.charCodeAt(i);
  }

  const pageW = 595.28;
  const pageH = 841.89;
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    byteLength += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    byteLength += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = byteLength;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets[2] = byteLength;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page (A4 595.28 x 841.89 pt)
  offsets[3] = byteLength;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Object 4: Image XObject (DCTDecode JPEG)
  offsets[4] = byteLength;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // Object 5: Content Stream
  offsets[5] = byteLength;
  pushStr(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  // XRef table
  const xrefOffset = byteLength;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const pad = String(offsets[i]).padStart(10, '0');
    pushStr(`${pad} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const out = new Uint8Array(byteLength);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
