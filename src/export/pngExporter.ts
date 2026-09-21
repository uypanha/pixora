import { PixoraDocument, Page } from '../types/document';
import { exportToSvgString } from './svgExporter';
import { downloadBlob } from './pixoraExporter';

export async function exportToPng(
  doc: PixoraDocument,
  page: Page,
  selectedIds: string[] = [],
  scale = 2,
  filename = 'export.png'
): Promise<void> {
  const svgString = exportToSvgString(doc, page, selectedIds);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = window.document.createElement('canvas');
        canvas.width = (img.naturalWidth || 800) * scale;
        canvas.height = (img.naturalHeight || 600) * scale;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('Canvas 2D context not supported'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(pngBlob => {
          URL.revokeObjectURL(url);
          if (pngBlob) {
            downloadBlob(pngBlob, filename);
            resolve();
          } else {
            reject(new Error('Failed to generate PNG blob'));
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image for rendering'));
    };

    img.src = url;
  });
}
