import { SmartGuideLine } from '../types/editor';
import { RectBounds } from './math';

export interface SnapResult {
  x: number;
  y: number;
  guides: SmartGuideLine[];
}

export function snapToGrid(
  x: number,
  y: number,
  gridSize: number,
  enabled: boolean
): { x: number; y: number } {
  if (!enabled || gridSize <= 0) return { x, y };
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

export function computeSmartSnapping(
  draggingBounds: RectBounds,
  otherObjects: RectBounds[],
  threshold = 6
): SnapResult {
  let snappedX = draggingBounds.x;
  let snappedY = draggingBounds.y;
  const guides: SmartGuideLine[] = [];

  const dragLeft = draggingBounds.x;
  const dragCenter = draggingBounds.x + draggingBounds.width / 2;
  const dragRight = draggingBounds.x + draggingBounds.width;

  const dragTop = draggingBounds.y;
  const dragMiddle = draggingBounds.y + draggingBounds.height / 2;
  const dragBottom = draggingBounds.y + draggingBounds.height;

  let minDiffX = threshold + 1;
  let minDiffY = threshold + 1;

  for (const target of otherObjects) {
    const targetLeft = target.x;
    const targetCenter = target.x + target.width / 2;
    const targetRight = target.x + target.width;

    const targetTop = target.y;
    const targetMiddle = target.y + target.height / 2;
    const targetBottom = target.y + target.height;

    // Horizontal snapping (Aligning X coordinates)
    const xAlignments = [
      { dVal: dragLeft, tVal: targetLeft, offset: 0 },
      { dVal: dragLeft, tVal: targetCenter, offset: 0 },
      { dVal: dragLeft, tVal: targetRight, offset: 0 },
      { dVal: dragCenter, tVal: targetCenter, offset: -draggingBounds.width / 2 },
      { dVal: dragRight, tVal: targetRight, offset: -draggingBounds.width },
      { dVal: dragRight, tVal: targetLeft, offset: -draggingBounds.width },
    ];

    for (const align of xAlignments) {
      const diff = Math.abs(align.dVal - align.tVal);
      if (diff < minDiffX) {
        minDiffX = diff;
        snappedX = align.tVal + align.offset;
        guides.push({
          type: 'vertical',
          position: align.tVal,
          start: Math.min(dragTop, targetTop) - 20,
          end: Math.max(dragBottom, targetBottom) + 20,
        });
      }
    }

    // Vertical snapping (Aligning Y coordinates)
    const yAlignments = [
      { dVal: dragTop, tVal: targetTop, offset: 0 },
      { dVal: dragTop, tVal: targetMiddle, offset: 0 },
      { dVal: dragTop, tVal: targetBottom, offset: 0 },
      { dVal: dragMiddle, tVal: targetMiddle, offset: -draggingBounds.height / 2 },
      { dVal: dragBottom, tVal: targetBottom, offset: -draggingBounds.height },
      { dVal: dragBottom, tVal: targetTop, offset: -draggingBounds.height },
    ];

    for (const align of yAlignments) {
      const diff = Math.abs(align.dVal - align.tVal);
      if (diff < minDiffY) {
        minDiffY = diff;
        snappedY = align.tVal + align.offset;
        guides.push({
          type: 'horizontal',
          position: align.tVal,
          start: Math.min(dragLeft, targetLeft) - 20,
          end: Math.max(dragRight, targetRight) + 20,
        });
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
  };
}
