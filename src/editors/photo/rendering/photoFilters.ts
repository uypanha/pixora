import { PhotoFilterType } from '../../../types/document';

export interface FilterPreset {
  id: PhotoFilterType;
  name: string;
  description: string;
  apply: (r: number, g: number, b: number) => [number, number, number];
}

function clamp(val: number): number {
  return Math.max(0, Math.min(255, val));
}

export const PHOTO_FILTERS: Record<PhotoFilterType, FilterPreset> = {
  none: {
    id: 'none',
    name: 'Original',
    description: 'No filter applied',
    apply: (r, g, b) => [r, g, b],
  },
  vivid: {
    id: 'vivid',
    name: 'Vivid',
    description: 'High saturation and bold contrast',
    apply: (r, g, b) => {
      const avg = (r + g + b) / 3;
      const boost = 1.35;
      const nr = clamp(avg + (r - avg) * boost);
      const ng = clamp(avg + (g - avg) * boost);
      const nb = clamp(avg + (b - avg) * boost);
      // Slight contrast boost
      const cr = clamp((nr - 128) * 1.15 + 128);
      const cg = clamp((ng - 128) * 1.15 + 128);
      const cb = clamp((nb - 128) * 1.15 + 128);
      return [cr, cg, cb];
    },
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Golden hour amber warmth',
    apply: (r, g, b) => {
      const nr = clamp(r * 1.12 + 12);
      const ng = clamp(g * 1.04 + 4);
      const nb = clamp(b * 0.88 - 8);
      return [nr, ng, nb];
    },
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    description: 'Crisp Nordic blue hues',
    apply: (r, g, b) => {
      const nr = clamp(r * 0.9 - 5);
      const ng = clamp(g * 1.02 + 2);
      const nb = clamp(b * 1.15 + 15);
      return [nr, ng, nb];
    },
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro film aesthetic with lifted blacks',
    apply: (r, g, b) => {
      const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
      const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
      const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;
      const mix = 0.5;
      const nr = clamp(r * (1 - mix) + sepiaR * mix + 15);
      const ng = clamp(g * (1 - mix) + sepiaG * mix + 10);
      const nb = clamp(b * (1 - mix) + sepiaB * mix + 20);
      return [nr, ng, nb];
    },
  },
  bw: {
    id: 'bw',
    name: 'B & W',
    description: 'Timeless high-contrast black and white',
    apply: (r, g, b) => {
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      // High contrast S-curve
      const val = clamp((luma - 128) * 1.25 + 128);
      return [val, val, val];
    },
  },
  fade: {
    id: 'fade',
    name: 'Fade',
    description: 'Faded film tones with soft shadows',
    apply: (r, g, b) => {
      const nr = clamp(r * 0.85 + 35);
      const ng = clamp(g * 0.85 + 32);
      const nb = clamp(b * 0.85 + 38);
      return [nr, ng, nb];
    },
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Hollywood teal & orange color grading',
    apply: (r, g, b) => {
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      if (luma > 128) {
        // Highlights: push warm orange
        const t = (luma - 128) / 128;
        return [clamp(r + 30 * t), clamp(g + 12 * t), clamp(b - 20 * t)];
      } else {
        // Shadows: push cool teal
        const t = (128 - luma) / 128;
        return [clamp(r - 20 * t), clamp(g + 10 * t), clamp(b + 35 * t)];
      }
    },
  },
  matte: {
    id: 'matte',
    name: 'Matte',
    description: 'Low contrast with clean matte blacks',
    apply: (r, g, b) => {
      const nr = clamp((r - 128) * 0.8 + 128 + 22);
      const ng = clamp((g - 128) * 0.8 + 128 + 20);
      const nb = clamp((b - 128) * 0.8 + 128 + 24);
      return [nr, ng, nb];
    },
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    description: 'Gentle dreamy glow and lowered contrast',
    apply: (r, g, b) => {
      const nr = clamp(r * 0.95 + 20);
      const ng = clamp(g * 0.95 + 18);
      const nb = clamp(b * 0.98 + 15);
      return [nr, ng, nb];
    },
  },
};
