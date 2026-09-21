import { PixoraAsset, ImageObject } from '../types/document';
import { generateId } from '../utils/id';

export interface ImageImportResult {
  asset: PixoraAsset;
  imageObject: ImageObject;
}

export async function importImageFile(
  file: File,
  placeX = 100,
  placeY = 100
): Promise<ImageImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        const naturalW = img.naturalWidth || 300;
        const naturalH = img.naturalHeight || 200;

        // Scale down large images to reasonable canvas dimensions (max 400px width)
        let displayW = naturalW;
        let displayH = naturalH;
        if (displayW > 400) {
          const ratio = 400 / displayW;
          displayW = 400;
          displayH = Math.round(naturalH * ratio);
        }

        const assetId = generateId('asset');
        const asset: PixoraAsset = {
          id: assetId,
          name: file.name,
          type: file.type || 'image/png',
          dataUrl,
          width: naturalW,
          height: naturalH,
        };

        const imageObject: ImageObject = {
          id: generateId('img'),
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'image',
          x: Math.round(placeX),
          y: Math.round(placeY),
          width: displayW,
          height: displayH,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
          assetId,
          fit: 'cover',
          cornerRadius: 0,
        };

        resolve({ asset, imageObject });
      };

      img.onerror = () => {
        reject(new Error('Failed to decode image data.'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file from disk.'));
    };

    reader.readAsDataURL(file);
  });
}
