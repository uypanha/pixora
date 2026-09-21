import { DragHandle } from '../types/editor';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  angleDeg: number
): { x: number; y: number } {
  if (angleDeg === 0) return { x: px, y: py };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns axis-aligned bounding box for multiple objects
 */
export function getBoundingBox(
  objects: { x: number; y: number; width: number; height: number; rotation?: number }[]
): RectBounds | null {
  if (objects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const obj of objects) {
    const rot = obj.rotation || 0;
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;

    const corners = [
      rotatePoint(obj.x, obj.y, cx, cy, rot),
      rotatePoint(obj.x + obj.width, obj.y, cx, cy, rot),
      rotatePoint(obj.x + obj.width, obj.y + obj.height, cx, cy, rot),
      rotatePoint(obj.x, obj.y + obj.height, cx, cy, rot),
    ];

    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x > maxX) maxX = c.x;
      if (c.y > maxY) maxY = c.y;
    }
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Calculates new bounds when dragging a resize handle
 */
export function calculateResize(
  handle: DragHandle,
  initial: RectBounds,
  deltaX: number,
  deltaY: number,
  lockAspectRatio = false,
  minSize = 5
): RectBounds {
  let { x, y, width, height } = initial;
  const aspectRatio = initial.width / (initial.height || 1);

  switch (handle) {
    case 'se':
      width = Math.max(minSize, initial.width + deltaX);
      if (lockAspectRatio) {
        height = width / aspectRatio;
      } else {
        height = Math.max(minSize, initial.height + deltaY);
      }
      break;

    case 's':
      height = Math.max(minSize, initial.height + deltaY);
      if (lockAspectRatio) {
        width = height * aspectRatio;
      }
      break;

    case 'e':
      width = Math.max(minSize, initial.width + deltaX);
      if (lockAspectRatio) {
        height = width / aspectRatio;
      }
      break;

    case 'nw': {
      const rawW = initial.width - deltaX;
      const rawH = initial.height - deltaY;
      if (lockAspectRatio) {
        const factor = Math.min(rawW / initial.width, rawH / initial.height);
        width = Math.max(minSize, initial.width * factor);
        height = Math.max(minSize, initial.height * factor);
        x = initial.x + (initial.width - width);
        y = initial.y + (initial.height - height);
      } else {
        width = Math.max(minSize, rawW);
        height = Math.max(minSize, rawH);
        x = initial.x + (initial.width - width);
        y = initial.y + (initial.height - height);
      }
      break;
    }

    case 'n': {
      height = Math.max(minSize, initial.height - deltaY);
      y = initial.y + (initial.height - height);
      if (lockAspectRatio) {
        width = height * aspectRatio;
      }
      break;
    }

    case 'w': {
      width = Math.max(minSize, initial.width - deltaX);
      x = initial.x + (initial.width - width);
      if (lockAspectRatio) {
        height = width / aspectRatio;
      }
      break;
    }

    case 'ne': {
      width = Math.max(minSize, initial.width + deltaX);
      const rawH = initial.height - deltaY;
      if (lockAspectRatio) {
        height = width / aspectRatio;
        y = initial.y + (initial.height - height);
      } else {
        height = Math.max(minSize, rawH);
        y = initial.y + (initial.height - height);
      }
      break;
    }

    case 'sw': {
      width = Math.max(minSize, initial.width - deltaX);
      x = initial.x + (initial.width - width);
      if (lockAspectRatio) {
        height = width / aspectRatio;
      } else {
        height = Math.max(minSize, initial.height + deltaY);
      }
      break;
    }
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Calculates new rotation in degrees (snapped to 15-deg steps if Shift is held)
 */
export function calculateRotation(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
  snapTo15 = false
): number {
  const rad = Math.atan2(pointerY - centerY, pointerX - centerX);
  // +90 deg offset because the rotation handle sits above (top-center)
  let deg = radToDeg(rad) + 90;
  if (deg < 0) deg += 360;
  deg = deg % 360;

  if (snapTo15) {
    deg = Math.round(deg / 15) * 15;
  }
  return Math.round(deg);
}
