export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSV {
  h: number; // 0..360
  s: number; // 0..100
  v: number; // 0..100
  a: number; // 0..1
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Converts a hex string (#rgb, #rgba, #rrggbb, #rrggbbaa) to RGBA object
 */
export function hexToRgba(hex: string): RGBA {
  let clean = hex.replace('#', '').trim();
  if (!clean) return { r: 0, g: 0, b: 0, a: 1 };

  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('') + 'ff';
  } else if (clean.length === 4) {
    clean = clean.split('').map(c => c + c).join('');
  } else if (clean.length === 6) {
    clean += 'ff';
  }

  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0, a: 1 };

  const r = (num >> 24) & 255;
  const g = (num >> 16) & 255;
  const b = (num >> 8) & 255;
  const a = Number(((num & 255) / 255).toFixed(2));

  return { r, g, b, a };
}

/**
 * Converts RGBA to hex string (#RRGGBB or #RRGGBBAA if alpha < 1)
 */
export function rgbaToHex(r: number, g: number, b: number, a = 1): string {
  const clampR = Math.round(clamp(r, 0, 255));
  const clampG = Math.round(clamp(g, 0, 255));
  const clampB = Math.round(clamp(b, 0, 255));
  const hexR = clampR.toString(16).padStart(2, '0');
  const hexG = clampG.toString(16).padStart(2, '0');
  const hexB = clampB.toString(16).padStart(2, '0');

  if (a < 1) {
    const clampA = Math.round(clamp(a, 0, 1) * 255);
    const hexA = clampA.toString(16).padStart(2, '0');
    return `#${hexR}${hexG}${hexB}${hexA}`;
  }
  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Converts RGBA (0..255, 0..1) to HSV (0..360, 0..100, 0..100, 0..1)
 */
export function rgbaToHsv(r: number, g: number, b: number, a = 1): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;

  let h = 0;
  if (diff === 0) {
    h = 0;
  } else if (max === rn) {
    h = ((gn - bn) / diff) % 6;
  } else if (max === gn) {
    h = (bn - rn) / diff + 2;
  } else {
    h = (rn - gn) / diff + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((diff / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v, a };
}

/**
 * Converts HSV (0..360, 0..100, 0..100, 0..1) to RGBA (0..255, 0..1)
 */
export function hsvToRgba(h: number, s: number, v: number, a = 1): RGBA {
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;

  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: Number(clamp(a, 0, 1).toFixed(2)),
  };
}

/**
 * Parses any color string (hex, rgb, rgba, color name) to RGBA
 */
export function parseColor(colorStr: string): RGBA {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  const str = colorStr.trim();

  // Hex color
  if (str.startsWith('#')) {
    return hexToRgba(str);
  }

  // rgb(...) or rgba(...)
  const rgbaMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    };
  }

  // Fallback / named color handling
  if (str === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (str === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (str === 'black') return { r: 0, g: 0, b: 0, a: 1 };

  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Formats RGBA to CSS string: hex if a===1, or rgba(...) if transparent
 */
export function formatColor(rgba: RGBA): string {
  if (rgba.a < 1) {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }
  return rgbaToHex(rgba.r, rgba.g, rgba.b);
}
