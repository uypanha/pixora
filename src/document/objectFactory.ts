import {
  FrameObject,
  RectangleObject,
  EllipseObject,
  LineObject,
  TextObject,
  ImageObject,
  GroupObject,
} from '../types/document';
import { generateId } from '../utils/id';

export function createFrame(
  x: number,
  y: number,
  width = 390,
  height = 844,
  name = 'Frame'
): FrameObject {
  return {
    id: generateId('frame'),
    name,
    type: 'frame',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    childIds: [],
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 1,
    cornerRadius: 24,
    clipContent: true,
    shadow: {
      x: 0,
      y: 10,
      blur: 25,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.15)',
    },
  };
}

export function createRectangle(
  x: number,
  y: number,
  width = 120,
  height = 120,
  name = 'Rectangle'
): RectangleObject {
  return {
    id: generateId('rect'),
    name,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#6366f1',
    cornerRadius: 12,
  };
}

export function createEllipse(
  x: number,
  y: number,
  width = 100,
  height = 100,
  name = 'Ellipse'
): EllipseObject {
  return {
    id: generateId('ellipse'),
    name,
    type: 'ellipse',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#38bdf8',
  };
}

export function createLine(
  x: number,
  y: number,
  width = 150,
  name = 'Line'
): LineObject {
  return {
    id: generateId('line'),
    name,
    type: 'line',
    x,
    y,
    width,
    height: 2,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    stroke: '#f3f4f6',
    strokeWidth: 2,
    lineCap: 'round',
  };
}

export function createText(
  x: number,
  y: number,
  text = 'Double-click to edit',
  name = 'Text'
): TextObject {
  return {
    id: generateId('text'),
    name,
    type: 'text',
    x,
    y,
    width: 220,
    height: 36,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#ffffff',
  };
}

export function createImage(
  x: number,
  y: number,
  assetId: string,
  width = 240,
  height = 160,
  name = 'Image'
): ImageObject {
  return {
    id: generateId('img'),
    name,
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    assetId,
    fit: 'cover',
    cornerRadius: 8,
  };
}

export function createGroup(
  childIds: string[],
  bounds: { x: number; y: number; width: number; height: number },
  name = 'Group'
): GroupObject {
  return {
    id: generateId('group'),
    name,
    type: 'group',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    childIds,
  };
}
