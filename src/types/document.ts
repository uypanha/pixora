export interface ShadowEffect {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface BaseObject {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  locked: boolean;
  visible: boolean;
  parentId?: string | null;
}

export interface FrameObject extends BaseObject {
  type: 'frame';
  childIds: string[];
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  clipContent?: boolean;
  shadow?: ShadowEffect;
}

export interface RectangleObject extends BaseObject {
  type: 'rectangle';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  shadow?: ShadowEffect;
}

export interface EllipseObject extends BaseObject {
  type: 'ellipse';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: ShadowEffect;
}

export interface LineObject extends BaseObject {
  type: 'line';
  stroke: string;
  strokeWidth: number;
  lineCap?: 'butt' | 'round' | 'square';
  dashArray?: string;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  shadow?: ShadowEffect;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  assetId: string;
  fit: 'cover' | 'contain' | 'fill';
  cornerRadius?: number;
  shadow?: ShadowEffect;
}

export interface GroupObject extends BaseObject {
  type: 'group';
  childIds: string[];
}

export type PixoraObject =
  | FrameObject
  | RectangleObject
  | EllipseObject
  | LineObject
  | TextObject
  | ImageObject
  | GroupObject;

export interface Page {
  id: string;
  name: string;
  childIds: string[];
  backgroundColor?: string;
}

export interface PixoraAsset {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
}

export interface DocumentSettings {
  grid: GridSettings;
  snapToObjects: boolean;
  canvasColor: string;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export type ProjectType = 'canvas' | 'photo';

export interface PhotoAdjustments {
  // Light
  exposure: number; // -100 to 100
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100

  // Color
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
  hue: number; // -180 to 180

  // Detail
  sharpness: number; // 0 to 100
  clarity: number; // -100 to 100
}

export type PhotoFilterType =
  | 'none'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'bw'
  | 'fade'
  | 'cinematic'
  | 'matte'
  | 'soft';

export interface PhotoFilter {
  type: PhotoFilterType;
  intensity: number; // 0 to 100
}

export interface PhotoEffects {
  vignette: number; // 0 to 100
  grain: number; // 0 to 100
  blur: number; // 0 to 100
  glow: number; // 0 to 100
  fade: number; // 0 to 100
}

export interface PhotoCrop {
  x: number; // 0 to 1 normalized coordinates relative to unrotated image
  y: number;
  width: number;
  height: number;
  aspectRatio?: string; // 'free' | '1:1' | '4:5' | '3:4' | '4:3' | '16:9' | '9:16'
}

export interface PhotoTransform {
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface PhotoDrawStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  isEraser?: boolean;
}

export interface PhotoTextOverlay {
  id: string;
  text: string;
  x: number; // relative pixel position on photo
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  color: string;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  lineHeight?: number;
  letterSpacing?: number;
  // Text effects
  shadow?: {
    enabled: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  stroke?: {
    enabled: boolean;
    color: string;
    width: number;
  };
}

export interface PhotoRetouchSpot {
  id: string;
  x: number;
  y: number;
  radius: number;
  mode: 'heal' | 'clone';
  sourceX?: number;
  sourceY?: number;
}

export interface PhotoProjectState {
  sourceAssetId: string;
  adjustments: PhotoAdjustments;
  filter: PhotoFilter;
  effects: PhotoEffects;
  crop?: PhotoCrop | null;
  transform: PhotoTransform;
  drawing: PhotoDrawStroke[];
  texts: PhotoTextOverlay[];
  retouch: PhotoRetouchSpot[];
}

export interface PixoraDocument {
  format: 'pixora';
  version: number;
  projectType?: ProjectType;
  metadata: DocumentMetadata;
  settings: DocumentSettings;
  pages: Page[];
  objects: Record<string, PixoraObject>;
  assets: Record<string, PixoraAsset>;
  photo?: PhotoProjectState;
}

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

export const DEFAULT_PHOTO_EFFECTS: PhotoEffects = {
  vignette: 0,
  grain: 0,
  blur: 0,
  glow: 0,
  fade: 0,
};
