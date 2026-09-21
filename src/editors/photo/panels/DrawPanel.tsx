import React from 'react';
import { Paintbrush, Eraser, Trash2, Undo2 } from 'lucide-react';
import { PhotoDrawStroke } from '../../../types/document';

export interface DrawPanelProps {
  tool?: 'brush' | 'eraser';
  color?: string;
  size?: number;
  opacity?: number;
  strokeCount?: number;
  onToolChange?: (tool: 'brush' | 'eraser') => void;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: number) => void;
  onOpacityChange?: (opacity: number) => void;
  onUndoStroke?: () => void;
  onClearStrokes?: () => void;

  strokes?: PhotoDrawStroke[];
  brushSize?: number;
  brushOpacity?: number;
  brushColor?: string;
  isEraser?: boolean;
  onBrushSizeChange?: (size: number) => void;
  onBrushOpacityChange?: (opacity: number) => void;
  onBrushColorChange?: (color: string) => void;
  onIsEraserChange?: (isEraser: boolean) => void;
}

const COLOR_PALETTE = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
];

export const DrawPanel: React.FC<DrawPanelProps> = ({
  tool = 'brush',
  color = '#ffffff',
  size = 5,
  opacity = 1,
  strokeCount,
  onToolChange,
  onColorChange,
  onSizeChange,
  onOpacityChange,
  onUndoStroke,
  onClearStrokes,
  strokes,
  brushSize,
  brushOpacity,
  brushColor,
  isEraser: isEraserProp,
  onBrushSizeChange,
  onBrushOpacityChange,
  onBrushColorChange,
  onIsEraserChange,
}) => {
  const currentIsEraser = isEraserProp ?? (tool === 'eraser');
  const currentSize = brushSize ?? size;
  const currentOpacity = brushOpacity ?? opacity;
  const currentColor = brushColor ?? color;
  const count = strokeCount ?? (strokes ? strokes.length : 0);

  const handleToolToggle = (eraser: boolean) => {
    onIsEraserChange?.(eraser);
    onToolChange?.(eraser ? 'eraser' : 'brush');
  };

  const handleColorChange = (newColor: string) => {
    onBrushColorChange?.(newColor);
    onColorChange?.(newColor);
  };

  const handleSizeChange = (newSize: number) => {
    onBrushSizeChange?.(newSize);
    onSizeChange?.(newSize);
  };

  const handleOpacityChange = (newOpacity: number) => {
    onBrushOpacityChange?.(newOpacity);
    onOpacityChange?.(newOpacity);
  };
  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Freehand Drawing
        </span>
        <div className="flex items-center space-x-2">
          {count > 0 && onUndoStroke && (
            <button
              onClick={onUndoStroke}
              className="flex items-center space-x-1 text-[11px] text-pixora-text-muted hover:text-white transition-colors"
              title="Undo last stroke"
            >
              <Undo2 size={11} />
              <span>Undo</span>
            </button>
          )}
          {count > 0 && onClearStrokes && (
            <button
              onClick={onClearStrokes}
              className="flex items-center space-x-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
              title="Clear all drawing strokes"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode toggle: Brush vs Eraser */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-pixora-elevated rounded-lg border border-pixora-border">
        <button
          onClick={() => handleToolToggle(false)}
          className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !currentIsEraser
              ? 'bg-pixora-selection text-white shadow-sm'
              : 'text-pixora-text-muted hover:text-white'
          }`}
        >
          <Paintbrush size={13} />
          <span>Brush</span>
        </button>
        <button
          onClick={() => handleToolToggle(true)}
          className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            currentIsEraser
              ? 'bg-pixora-selection text-white shadow-sm'
              : 'text-pixora-text-muted hover:text-white'
          }`}
        >
          <Eraser size={13} />
          <span>Eraser</span>
        </button>
      </div>

      {/* Brush Size */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-pixora-text-muted">Brush Size</span>
          <span className="font-mono text-pixora-accent font-medium">{currentSize}px</span>
        </div>
        <input
          type="range"
          min={2}
          max={80}
          value={currentSize}
          onChange={e => handleSizeChange(Number(e.target.value))}
          className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent"
        />
      </div>

      {/* Brush Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-pixora-text-muted">Opacity</span>
          <span className="font-mono text-pixora-accent font-medium">
            {Math.round(currentOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={currentOpacity}
          onChange={e => handleOpacityChange(Number(e.target.value))}
          className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent"
        />
      </div>

      {/* Color Palette (only visible in brush mode) */}
      {!currentIsEraser && (
        <div className="space-y-2 pt-2 border-t border-pixora-border/60">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-pixora-text-muted">Color</span>
            <div className="flex items-center space-x-1.5">
              <input
                type="color"
                value={currentColor}
                onChange={e => handleColorChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="font-mono text-[10px] text-pixora-text-dim uppercase">
                {currentColor}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                style={{ backgroundColor: color }}
                className={`w-full h-6 rounded border transition-transform hover:scale-105 ${
                  currentColor === color
                    ? 'ring-2 ring-pixora-selection border-white'
                    : 'border-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-pixora-text-dim leading-relaxed bg-pixora-elevated p-2 rounded border border-pixora-border">
        Draw directly on the photo canvas with mouse or touch. Strokes remain editable and non-destructive.
      </p>
    </div>
  );
};
