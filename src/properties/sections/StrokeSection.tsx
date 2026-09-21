import React from 'react';
import { PixoraObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';

interface StrokeSectionProps {
  object: PixoraObject;
}

export const StrokeSection: React.FC<StrokeSectionProps> = ({ object }) => {
  const { updateObjectProperties } = useDocument();

  const hasStroke = 'stroke' in object || (object as any).type === 'line';

  if (!hasStroke) return null;

  const strokeColor = (object as any).stroke || '#2c2f38';
  const strokeWidth = (object as any).strokeWidth || 1;

  const handleColorChange = (val: string) => {
    updateObjectProperties(object.id, { stroke: val } as any, 'Change stroke color');
  };

  const handleWidthChange = (w: number) => {
    updateObjectProperties(object.id, { strokeWidth: Math.max(0, w) } as any, 'Change stroke width');
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <div className="text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        Stroke
      </div>

      {/* Stroke Color */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Color</span>
        <div className="flex items-center space-x-2 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <input
            type="color"
            value={strokeColor}
            onChange={e => handleColorChange(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={strokeColor}
            onChange={e => handleColorChange(e.target.value)}
            className="bg-transparent text-pixora-text outline-none font-mono w-20 text-right uppercase"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Width</span>
        <div className="flex items-center space-x-1 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <input
            type="number"
            min={0}
            max={50}
            value={strokeWidth}
            onChange={e => handleWidthChange(Number(e.target.value))}
            className="bg-transparent text-pixora-text outline-none font-mono w-14 text-right"
          />
          <span className="text-pixora-text-dim">px</span>
        </div>
      </div>

      {/* Line Cap for Lines */}
      {object.type === 'line' && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-pixora-text-dim">Line Cap</span>
          <select
            value={(object as any).lineCap || 'round'}
            onChange={e =>
              updateObjectProperties(
                object.id,
                { lineCap: e.target.value as any } as any,
                'Change line cap'
              )
            }
            className="bg-pixora-elevated text-pixora-text border border-pixora-border rounded px-2 py-1 outline-none text-xs"
          >
            <option value="round">Round</option>
            <option value="butt">Butt</option>
            <option value="square">Square</option>
          </select>
        </div>
      )}
    </div>
  );
};
