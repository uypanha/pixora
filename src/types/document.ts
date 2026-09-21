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

export interface PixoraDocument {
  format: 'pixora';
  version: number;
  metadata: DocumentMetadata;
  settings: DocumentSettings;
  pages: Page[];
  objects: Record<string, PixoraObject>;
  assets: Record<string, PixoraAsset>;
}
