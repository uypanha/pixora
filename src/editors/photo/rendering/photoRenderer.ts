import {
  PhotoAdjustments,
  PhotoFilter,
  PhotoEffects,
  PhotoCrop,
  PhotoTransform,
  PhotoDrawStroke,
  PhotoTextOverlay,
} from '../../../types/document';
import { PHOTO_FILTERS } from './photoFilters';

export interface RenderPhotoOptions {
  image: HTMLImageElement | HTMLCanvasElement;
  adjustments: PhotoAdjustments;
  filter: PhotoFilter;
  effects: PhotoEffects;
  crop?: PhotoCrop | null;
  transform: PhotoTransform;
  drawing?: PhotoDrawStroke[];
  texts?: PhotoTextOverlay[];
  skipTexts?: boolean; // if true, suppresses text rendering on canvas (e.g. for interactive DOM text layer)
  isOriginal?: boolean; // if true, renders pure original image for Before/After compare
  maxDimension?: number; // for downsampled fast interactive preview
}

function clamp(val: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, val));
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  return [h, s, v];
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Render the non-destructive photo pipeline to a canvas
 */
export function renderPhotoToCanvas(
  targetCanvas: HTMLCanvasElement,
  options: RenderPhotoOptions
): void {
  const {
    image,
    adjustments,
    filter,
    effects,
    crop,
    transform,
    drawing = [],
    texts = [],
    skipTexts = false,
    isOriginal = false,
    maxDimension,
  } = options;

  const rawW = image.width || 100;
  const rawH = image.height || 100;

  // Step 1: Compute dimensions with downscale if requested for preview performance
  let scale = 1;
  if (maxDimension && Math.max(rawW, rawH) > maxDimension) {
    scale = maxDimension / Math.max(rawW, rawH);
  }

  const baseW = Math.max(1, Math.round(rawW * scale));
  const baseH = Math.max(1, Math.round(rawH * scale));

  // Determine crop box in pixels
  let cropX = 0;
  let cropY = 0;
  let cropW = baseW;
  let cropH = baseH;

  if (crop && !isOriginal) {
    cropX = Math.round(crop.x * baseW);
    cropY = Math.round(crop.y * baseH);
    cropW = Math.max(10, Math.round(crop.width * baseW));
    cropH = Math.max(10, Math.round(crop.height * baseH));
  }

  // Account for 90/270 rotation in target canvas dimensions
  const isRotatedQuarter =
    !isOriginal && (transform.rotation === 90 || transform.rotation === 270);
  const outW = isRotatedQuarter ? cropH : cropW;
  const outH = isRotatedQuarter ? cropW : cropH;

  targetCanvas.width = outW;
  targetCanvas.height = outH;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, outW, outH);

  // Step 2: Draw base transformed / cropped image onto canvas
  ctx.save();
  ctx.translate(outW / 2, outH / 2);

  if (!isOriginal) {
    if (transform.rotation) {
      ctx.rotate((transform.rotation * Math.PI) / 180);
    }
    const scaleX = transform.flipHorizontal ? -1 : 1;
    const scaleY = transform.flipVertical ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }
  }

  // Draw crop sub-rectangle centered
  const drawW = cropW;
  const drawH = cropH;
  // Source bounds on original raw image
  const srcX = (cropX / baseW) * rawW;
  const srcY = (cropY / baseH) * rawH;
  const srcW = (cropW / baseW) * rawW;
  const srcH = (cropH / baseH) * rawH;

  ctx.drawImage(
    image,
    srcX,
    srcY,
    srcW,
    srcH,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );
  ctx.restore();

  // If user requested "Before / Original" view, skip all adjustments, filters, effects, text, draw
  if (isOriginal) {
    return;
  }

  // Step 3: Pixel Adjustments & Color Processing
  // Read pixel data
  const imgData = ctx.getImageData(0, 0, outW, outH);
  const pixels = imgData.data;

  // Precompute adjustment parameters
  const exposureFactor = Math.pow(2, adjustments.exposure / 50);
  const brightnessOffset = adjustments.brightness * 1.5;
  const contrastFactor =
    adjustments.contrast === 0
      ? 1
      : Math.tan(((adjustments.contrast + 100) * Math.PI) / 400);

  const satBoost = adjustments.saturation / 100;
  const vibBoost = adjustments.vibrance / 100;
  const tempOffset = adjustments.temperature * 0.8;
  const tintOffset = adjustments.tint * 0.6;
  const hueShift = adjustments.hue;

  const hasAdjustments =
    adjustments.exposure !== 0 ||
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.whites !== 0 ||
    adjustments.blacks !== 0 ||
    adjustments.temperature !== 0 ||
    adjustments.tint !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.vibrance !== 0 ||
    adjustments.hue !== 0;

  const filterPreset = PHOTO_FILTERS[filter.type] || PHOTO_FILTERS.none;
  const filterIntensity = (filter.intensity ?? 100) / 100;
  const hasFilter = filter.type !== 'none' && filterIntensity > 0;

  if (hasAdjustments || hasFilter) {
    for (let i = 0; i < pixels.length; i += 4) {
      let r = pixels[i];
      let g = pixels[i + 1];
      let b = pixels[i + 2];

      // 1. Exposure
      if (adjustments.exposure !== 0) {
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;
      }

      // 2. Brightness & Contrast
      if (adjustments.brightness !== 0) {
        r += brightnessOffset;
        g += brightnessOffset;
        b += brightnessOffset;
      }

      if (adjustments.contrast !== 0) {
        r = (r - 128) * contrastFactor + 128;
        g = (g - 128) * contrastFactor + 128;
        b = (b - 128) * contrastFactor + 128;
      }

      // 3. Highlights & Shadows
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      if (adjustments.highlights !== 0 && luma > 128) {
        const factor = ((luma - 128) / 128) * (adjustments.highlights / 100) * 40;
        r += factor;
        g += factor;
        b += factor;
      }
      if (adjustments.shadows !== 0 && luma < 128) {
        const factor = ((128 - luma) / 128) * (adjustments.shadows / 100) * 40;
        r += factor;
        g += factor;
        b += factor;
      }

      // 4. Whites & Blacks
      if (adjustments.whites !== 0) {
        r += (adjustments.whites / 100) * 25;
        g += (adjustments.whites / 100) * 25;
        b += (adjustments.whites / 100) * 25;
      }
      if (adjustments.blacks !== 0) {
        r -= (adjustments.blacks / 100) * 25;
        g -= (adjustments.blacks / 100) * 25;
        b -= (adjustments.blacks / 100) * 25;
      }

      // 5. Temperature & Tint
      if (adjustments.temperature !== 0) {
        r += tempOffset;
        b -= tempOffset;
      }
      if (adjustments.tint !== 0) {
        g -= tintOffset;
        r += tintOffset * 0.5;
        b += tintOffset * 0.5;
      }

      // Clamp before HSL calculations
      r = clamp(r);
      g = clamp(g);
      b = clamp(b);

      // 6. Saturation, Vibrance, Hue
      if (satBoost !== 0 || vibBoost !== 0 || hueShift !== 0) {
        let [h, s, v] = rgbToHsv(r, g, b);

        if (hueShift !== 0) {
          h = (h + hueShift + 360) % 360;
        }

        if (satBoost !== 0) {
          s = Math.max(0, Math.min(1, s * (1 + satBoost)));
        }

        if (vibBoost !== 0) {
          // Vibrance increases saturation more on less-saturated pixels
          const factor = (1 - s) * vibBoost;
          s = Math.max(0, Math.min(1, s + factor));
        }

        [r, g, b] = hsvToRgb(h, s, v);
      }

      // 7. Filter preset with intensity blending
      if (hasFilter) {
        const [fr, fg, fb] = filterPreset.apply(r, g, b);
        r = r * (1 - filterIntensity) + fr * filterIntensity;
        g = g * (1 - filterIntensity) + fg * filterIntensity;
        b = b * (1 - filterIntensity) + fb * filterIntensity;
      }

      pixels[i] = clamp(r);
      pixels[i + 1] = clamp(g);
      pixels[i + 2] = clamp(b);
    }
  }

  // Put modified pixel data back
  ctx.putImageData(imgData, 0, 0);

  // Step 4: Effects (Vignette, Film Grain, Blur, Glow)
  // Vignette
  if (effects.vignette > 0) {
    const intensity = effects.vignette / 100;
    const cx = outW / 2;
    const cy = outH / 2;
    const radius = Math.max(cx, cy);
    const grad = ctx.createRadialGradient(
      cx,
      cy,
      radius * 0.45,
      cx,
      cy,
      radius * 1.05
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.85 * intensity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);
  }

  // Film Grain
  if (effects.grain > 0) {
    const grainIntensity = (effects.grain / 100) * 0.28;
    const grainCanvas = document.createElement('canvas');
    const grainW = Math.min(256, outW);
    const grainH = Math.min(256, outH);
    grainCanvas.width = grainW;
    grainCanvas.height = grainH;
    const gCtx = grainCanvas.getContext('2d');
    if (gCtx) {
      const gImgData = gCtx.createImageData(grainW, grainH);
      const gPixels = gImgData.data;
      for (let p = 0; p < gPixels.length; p += 4) {
        const noise = (Math.random() - 0.5) * 255;
        gPixels[p] = noise > 0 ? 255 : 0;
        gPixels[p + 1] = noise > 0 ? 255 : 0;
        gPixels[p + 2] = noise > 0 ? 255 : 0;
        gPixels[p + 3] = Math.abs(noise) * grainIntensity;
      }
      gCtx.putImageData(gImgData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, outW, outH);
      }
      ctx.restore();
    }
  }

  // Blur / Soft Glow
  if (effects.blur > 0) {
    // Subtle overlay blur
    ctx.save();
    ctx.filter = `blur(${Math.max(1, (effects.blur / 100) * 12)}px)`;
    ctx.globalAlpha = (effects.blur / 100) * 0.5;
    ctx.drawImage(targetCanvas, 0, 0);
    ctx.restore();
  }

  // Step 5: Render Drawing Strokes
  if (drawing.length > 0) {
    ctx.save();
    for (const stroke of drawing) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x * outW, stroke.points[0].y * outH);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * outW, stroke.points[i].y * outH);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Step 6: Render Text Overlays (e.g. for export or standalone canvas)
  if (!skipTexts && texts.length > 0) {
    ctx.save();
    for (const textItem of texts) {
      ctx.save();
      const tx = textItem.x * outW;
      const ty = textItem.y * outH;
      ctx.translate(tx, ty);
      if (textItem.rotation) {
        ctx.rotate((textItem.rotation * Math.PI) / 180);
      }
      ctx.globalAlpha = textItem.opacity ?? 1;
      ctx.fillStyle = textItem.color;

      const fontSizePx = textItem.fontSize;
      ctx.font = `${textItem.fontWeight || 600} ${fontSizePx}px "${textItem.fontFamily || 'Inter'}", sans-serif`;
      ctx.textAlign = textItem.textAlign || 'center';
      ctx.textBaseline = 'middle';

      const lines = textItem.text.split('\n');
      const lineH = fontSizePx * 1.3;
      const totalH = lines.length * lineH;
      const startY = -(totalH / 2) + lineH / 2;

      for (let idx = 0; idx < lines.length; idx++) {
        ctx.fillText(lines[idx], 0, startY + idx * lineH);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
