import React from 'react';
import { PhotoTransform } from '../../../types/document';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
} from 'lucide-react';

interface TransformPanelProps {
  transform: PhotoTransform;
  onChange?: (transform: PhotoTransform) => void;
  onRotate90?: (direction: 'cw' | 'ccw') => void;
  onFlip?: (axis: 'h' | 'v') => void;
}

export const TransformPanel: React.FC<TransformPanelProps> = ({
  transform,
  onChange,
  onRotate90,
  onFlip,
}) => {
  const rotateLeft = () => {
    if (onRotate90) {
      onRotate90('ccw');
    } else if (onChange) {
      const next = (transform.rotation - 90 + 360) % 360;
      onChange({ ...transform, rotation: next });
    }
  };

  const rotateRight = () => {
    if (onRotate90) {
      onRotate90('cw');
    } else if (onChange) {
      const next = (transform.rotation + 90) % 360;
      onChange({ ...transform, rotation: next });
    }
  };

  const toggleFlipH = () => {
    if (onFlip) {
      onFlip('h');
    } else if (onChange) {
      onChange({ ...transform, flipHorizontal: !transform.flipHorizontal });
    }
  };

  const toggleFlipV = () => {
    if (onFlip) {
      onFlip('v');
    } else if (onChange) {
      onChange({ ...transform, flipVertical: !transform.flipVertical });
    }
  };

  const resetTransform = () => {
    onChange?.({ rotation: 0, flipHorizontal: false, flipVertical: false });
  };

  const hasTransform =
    transform.rotation !== 0 || transform.flipHorizontal || transform.flipVertical;

  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Rotate & Flip
        </span>
        {hasTransform && (
          <button
            onClick={resetTransform}
            className="flex items-center space-x-1 text-[11px] text-pixora-text-dim hover:text-white transition-colors"
          >
            <RefreshCw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Rotation Actions */}
      <div className="space-y-2">
        <span className="text-[11px] text-pixora-text-muted font-medium">Rotation</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={rotateLeft}
            className="flex items-center justify-center space-x-2 py-2 rounded-lg border border-pixora-border bg-pixora-elevated hover:bg-pixora-hover text-pixora-text hover:text-white transition-colors"
          >
            <RotateCcw size={14} />
            <span>90° Left</span>
          </button>
          <button
            onClick={rotateRight}
            className="flex items-center justify-center space-x-2 py-2 rounded-lg border border-pixora-border bg-pixora-elevated hover:bg-pixora-hover text-pixora-text hover:text-white transition-colors"
          >
            <RotateCw size={14} />
            <span>90° Right</span>
          </button>
        </div>
        <div className="text-[11px] text-pixora-text-dim flex justify-between px-1">
          <span>Current angle:</span>
          <span className="font-mono text-white font-medium">{transform.rotation}°</span>
        </div>
      </div>

      {/* Flip Actions */}
      <div className="space-y-2 pt-2 border-t border-pixora-border/60">
        <span className="text-[11px] text-pixora-text-muted font-medium">Flip Orientation</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleFlipH}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg border transition-colors ${
              transform.flipHorizontal
                ? 'bg-pixora-accent/20 border-pixora-selection text-white'
                : 'bg-pixora-elevated border-pixora-border hover:bg-pixora-hover text-pixora-text'
            }`}
          >
            <FlipHorizontal size={14} />
            <span>Horizontal</span>
          </button>
          <button
            onClick={toggleFlipV}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg border transition-colors ${
              transform.flipVertical
                ? 'bg-pixora-accent/20 border-pixora-selection text-white'
                : 'bg-pixora-elevated border-pixora-border hover:bg-pixora-hover text-pixora-text'
            }`}
          >
            <FlipVertical size={14} />
            <span>Vertical</span>
          </button>
        </div>
      </div>
    </div>
  );
};
