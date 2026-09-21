import {
  PixoraDocument,
  PixoraAsset,
  PhotoAdjustments,
  PhotoProjectState,
} from '../types/document';
import { generateId } from '../utils/id';

export const DEFAULT_PHOTO_ADJUSTMENTS: PhotoAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  sharpness: 0,
  clarity: 0,
};

/**
 * Generate a scenic sample landscape image as Data URL for default photo projects
 */
export function generateSamplePhotoDataUrl(width = 1600, height = 1060): string {
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfQHz4B2VlAAAAABJRU5ErkJggg==';
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  skyGradient.addColorStop(0, '#0f172a');
  skyGradient.addColorStop(0.35, '#1e293b');
  skyGradient.addColorStop(0.65, '#3b82f6');
  skyGradient.addColorStop(0.85, '#f97316');
  skyGradient.addColorStop(1, '#fef08a');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Glowing Sun
  const sunX = width * 0.65;
  const sunY = height * 0.55;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
  sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  sunGlow.addColorStop(0.2, 'rgba(254, 240, 138, 0.8)');
  sunGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)');
  sunGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
  ctx.fill();

  // Distant Mountains
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.7);
  ctx.lineTo(width * 0.2, height * 0.48);
  ctx.lineTo(width * 0.45, height * 0.62);
  ctx.lineTo(width * 0.7, height * 0.42);
  ctx.lineTo(width * 0.88, height * 0.58);
  ctx.lineTo(width, height * 0.5);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Near Mountains
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width * 0.32, height * 0.55);
  ctx.lineTo(width * 0.6, height * 0.75);
  ctx.lineTo(width * 0.82, height * 0.52);
  ctx.lineTo(width, height * 0.68);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Lake Water
  const waterGradient = ctx.createLinearGradient(0, height * 0.72, 0, height);
  waterGradient.addColorStop(0, '#0284c7');
  waterGradient.addColorStop(0.3, '#0369a1');
  waterGradient.addColorStop(1, '#082f49');
  ctx.fillStyle = waterGradient;
  ctx.fillRect(0, height * 0.72, width, height * 0.28);

  // Water reflections
  ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
  try {
    const result = canvas.toDataURL('image/jpeg', 0.92);
    return (
      result ||
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfQHz4B2VlAAAAABJRU5ErkJggg=='
    );
  } catch {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfQHz4B2VlAAAAABJRU5ErkJggg==';
  }
}

export interface CreatePhotoProjectOptions {
  name?: string;
  projectName?: string;
  assetDataUrl?: string;
  assetName?: string;
  width?: number;
  height?: number;
}

export function createDefaultPhotoProject(
  dataUrlOrOptions?: string | CreatePhotoProjectOptions,
  extraOptions?: CreatePhotoProjectOptions
): PixoraDocument {
  let options: CreatePhotoProjectOptions;
  if (typeof dataUrlOrOptions === 'string') {
    options = { ...extraOptions, assetDataUrl: dataUrlOrOptions };
  } else if (dataUrlOrOptions && typeof dataUrlOrOptions === 'object') {
    options = { ...dataUrlOrOptions, ...extraOptions };
  } else {
    options = { ...extraOptions };
  }

  const assetId = generateId('asset-photo');
  const now = new Date().toISOString();
  const projectName =
    options.name ||
    options.projectName ||
    options.assetName?.replace(/\.[^/.]+$/, '') ||
    'Untitled Photo';

  const dataUrl = options.assetDataUrl || generateSamplePhotoDataUrl();
  const photoWidth = options.width || 1600;
  const photoHeight = options.height || 1060;

  const photoAsset: PixoraAsset = {
    id: assetId,
    name: options?.assetName || 'photo.jpg',
    type: 'image/jpeg',
    dataUrl,
    width: photoWidth,
    height: photoHeight,
  };

  const photoState: PhotoProjectState = {
    sourceAssetId: assetId,
    adjustments: { ...DEFAULT_PHOTO_ADJUSTMENTS },
    filter: { type: 'none', intensity: 100 },
    effects: { vignette: 0, grain: 0, blur: 0, glow: 0, fade: 0 },
    crop: null,
    transform: { rotation: 0, flipHorizontal: false, flipVertical: false },
    drawing: [],
    texts: [],
    retouch: [],
  };

  return {
    format: 'pixora',
    version: 2,
    projectType: 'photo',
    metadata: {
      id: generateId('doc-photo'),
      name: projectName,
      createdAt: now,
      updatedAt: now,
      thumbnail: dataUrl,
    },
    settings: {
      grid: { enabled: false, size: 10, snap: false },
      snapToObjects: false,
      canvasColor: '#121316',
    },
    pages: [],
    objects: {},
    assets: {
      [assetId]: photoAsset,
    },
    photo: photoState,
  };
}
