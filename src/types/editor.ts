import { PixoraObject } from './document';

export type Tool =
  | 'select'
  | 'hand'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'image';

export interface Viewport {
  x: number;
  y: number;
  zoom: number; // 1.0 = 100%
}

export type DragHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rot';

export interface ObjectTransformSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'pan' | 'marquee' | 'draw';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  handle?: DragHandle;
  initialSnapshots?: Record<string, ObjectTransformSnapshot>;
  centerPoint?: { x: number; y: number };
  startAngle?: number;
  drawShape?: Tool;
}

export interface SmartGuideLine {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export interface EditorState {
  activePageId: string;
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: Tool;
  viewport: Viewport;
  editingTextId: string | null;
  dragState: DragState | null;
  activeGuides: SmartGuideLine[];
  clipboard: PixoraObject[] | null;
  mobileActiveTab: 'layers' | 'add' | 'properties' | null;
  isMobileMenuOpen: boolean;
  autosaveStatus: 'saved' | 'saving' | 'unsaved';
}
