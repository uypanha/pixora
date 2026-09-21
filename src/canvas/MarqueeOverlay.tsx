import React from 'react';
import { DragState } from '../types/editor';

interface MarqueeOverlayProps {
  dragState: DragState | null;
  zoom: number;
}

export const MarqueeOverlay: React.FC<MarqueeOverlayProps> = ({ dragState, zoom }) => {
  if (!dragState || dragState.type !== 'marquee') return null;

  const minX = Math.min(dragState.startX, dragState.currentX);
  const minY = Math.min(dragState.startY, dragState.currentY);
  const width = Math.abs(dragState.currentX - dragState.startX);
  const height = Math.abs(dragState.currentY - dragState.startY);

  return (
    <rect
      x={minX}
      y={minY}
      width={width}
      height={height}
      fill="rgba(56, 189, 248, 0.12)"
      stroke="#38bdf8"
      strokeWidth={Math.max(1, 1 / zoom)}
      strokeDasharray="3 3"
      className="pointer-events-none"
    />
  );
};
