import React from 'react';
import { Viewport } from '../types/editor';

interface CanvasGridProps {
  viewport: Viewport;
  enabled: boolean;
  size?: number;
  isLightBg?: boolean;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  viewport,
  enabled,
  size = 10,
  isLightBg = false,
}) => {
  if (!enabled) return null;

  const scaledSize = size * viewport.zoom;
  // If grid is too dense when zoomed out, show multiple of size
  let effectiveSize = scaledSize;
  while (effectiveSize < 12) {
    effectiveSize *= 2;
  }

  const offsetX = (viewport.x % effectiveSize + effectiveSize) % effectiveSize;
  const offsetY = (viewport.y % effectiveSize + effectiveSize) % effectiveSize;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        <pattern
          id="pixora-grid-dots"
          width={effectiveSize}
          height={effectiveSize}
          x={offsetX}
          y={offsetY}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={effectiveSize / 2}
            cy={effectiveSize / 2}
            r={1 * Math.min(1.5, Math.max(0.7, viewport.zoom))}
            fill={isLightBg ? '#64748B' : '#333742'}
            opacity={isLightBg ? 0.35 : 0.7}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pixora-grid-dots)" />
    </svg>
  );
};
