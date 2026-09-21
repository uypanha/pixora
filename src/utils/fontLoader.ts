import { PixoraAsset } from '../types/document';
import { generateId } from './id';

export interface FontOption {
  name: string;
  category: 'Sans-Serif' | 'Serif' | 'Monospace' | 'Display' | 'Khmer' | 'System' | 'Custom';
  isGoogleFont?: boolean;
}

export const POPULAR_FONTS: FontOption[] = [
  // Khmer Fonts
  { name: 'Kantumruy Pro', category: 'Khmer', isGoogleFont: true },
  { name: 'Battambang', category: 'Khmer', isGoogleFont: true },
  { name: 'Siemreap', category: 'Khmer', isGoogleFont: true },
  { name: 'Moul', category: 'Khmer', isGoogleFont: true },
  { name: 'Bayon', category: 'Khmer', isGoogleFont: true },
  { name: 'Preahvihear', category: 'Khmer', isGoogleFont: true },
  { name: 'Koulen', category: 'Khmer', isGoogleFont: true },
  { name: 'Hanuman', category: 'Khmer', isGoogleFont: true },

  // System / Standard
  { name: 'Inter', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Roboto', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Poppins', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Montserrat', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Open Sans', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Lato', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'Outfit', category: 'Sans-Serif', isGoogleFont: true },
  { name: 'DM Sans', category: 'Sans-Serif', isGoogleFont: true },

  // Serif
  { name: 'Playfair Display', category: 'Serif', isGoogleFont: true },
  { name: 'Merriweather', category: 'Serif', isGoogleFont: true },
  { name: 'Lora', category: 'Serif', isGoogleFont: true },
  { name: 'Cinzel', category: 'Serif', isGoogleFont: true },
  { name: 'Georgia', category: 'Serif', isGoogleFont: false },

  // Monospace
  { name: 'JetBrains Mono', category: 'Monospace', isGoogleFont: true },
  { name: 'Fira Code', category: 'Monospace', isGoogleFont: true },
  { name: 'Space Mono', category: 'Monospace', isGoogleFont: true },
  { name: 'Courier New', category: 'Monospace', isGoogleFont: false },

  // Display
  { name: 'Bebas Neue', category: 'Display', isGoogleFont: true },
  { name: 'Oswald', category: 'Display', isGoogleFont: true },
  { name: 'Pacifico', category: 'Display', isGoogleFont: true },
  { name: 'Dancing Script', category: 'Display', isGoogleFont: true },

  // System UI
  { name: 'system-ui', category: 'System', isGoogleFont: false },
  { name: 'Arial', category: 'System', isGoogleFont: false },
];

const loadedFonts = new Set<string>(['Inter', 'system-ui', 'Arial', 'Georgia', 'Courier New']);

/**
 * Dynamically loads a Google font stylesheet on demand
 */
export function loadGoogleFont(fontFamily: string): void {
  const cleanName = fontFamily.replace(/['"]/g, '').trim();
  if (!cleanName || loadedFonts.has(cleanName)) return;
  if (typeof document === 'undefined') return;

  try {
    const formattedName = cleanName.replace(/\s+/g, '+');
    const linkId = `google-font-${formattedName.toLowerCase()}`;

    if (document.getElementById(linkId)) {
      loadedFonts.add(cleanName);
      return;
    }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    // Universal URL that works for ALL fonts (including single-weight display fonts like Pacifico, Bebas Neue)
    link.href = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;

    document.head.appendChild(link);
    loadedFonts.add(cleanName);
  } catch {
    // Non-critical if offline or network unavailable
  }
}

/**
 * Registers an uploaded font asset (dataUrl) via CSS @font-face rule and browser FontFace API
 */
export function registerFontAsset(asset: PixoraAsset): void {
  if (typeof document === 'undefined' || !asset.dataUrl) return;

  const fontStyleId = `custom-font-${asset.id}`;
  if (!document.getElementById(fontStyleId)) {
    const style = document.createElement('style');
    style.id = fontStyleId;
    style.textContent = `
      @font-face {
        font-family: "${asset.name}";
        src: url("${asset.dataUrl}");
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  // Also register with modern FontFace API if supported for instant canvas re-render
  if (typeof FontFace !== 'undefined') {
    try {
      const font = new FontFace(asset.name, `url("${asset.dataUrl}")`);
      font.load().then(loadedFace => {
        document.fonts.add(loadedFace);
      }).catch(() => {
        // Fallback to style tag already appended
      });
    } catch {
      // Fallback to style tag already appended
    }
  }

  loadedFonts.add(asset.name);
}

/**
 * Reads a local font file (.ttf, .otf, .woff, .woff2) and returns an asset and clean font name
 */
export async function loadCustomFontFile(file: File): Promise<{ fontName: string; asset: PixoraAsset }> {
  const fontName = file.name.replace(/\.[^/.]+$/, '').trim();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const asset: PixoraAsset = {
        id: generateId('font'),
        name: fontName,
        type: 'font',
        dataUrl,
        width: 0,
        height: 0,
      };

      registerFontAsset(asset);
      resolve({ fontName, asset });
    };
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.readAsDataURL(file);
  });
}
