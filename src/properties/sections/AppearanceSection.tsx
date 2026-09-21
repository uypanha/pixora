import React from 'react';
import { PixoraObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';
import { ColorPicker } from '../../components/color/ColorPicker';

interface AppearanceSectionProps {
  object: PixoraObject;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ object }) => {
  const { updateObjectProperties } = useDocument();

  const hasFill = 'fill' in object;
  const hasRadius = 'cornerRadius' in object;

  const handleFillChange = (val: string) => {
    updateObjectProperties(object.id, { fill: val } as any, 'Change fill');
  };

  const handleOpacityChange = (percent: number) => {
    updateObjectProperties(
      object.id,
      { opacity: Math.max(0, Math.min(1, percent / 100)) },
      'Change opacity'
    );
  };

  const handleRadiusChange = (radius: number) => {
    updateObjectProperties(
      object.id,
      { cornerRadius: Math.max(0, radius) } as any,
      'Change corner radius'
    );
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <div className="text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        Appearance
      </div>

      {/* Fill Color */}
      {hasFill && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-pixora-text-dim">Fill</span>
          <ColorPicker
            label="Fill Color"
            value={(object as any).fill || '#ffffff'}
            onChange={handleFillChange}
          />
        </div>
      )}

      {/* Opacity */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Opacity</span>
        <div className="flex items-center space-x-2 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((object.opacity ?? 1) * 100)}
            onChange={e => handleOpacityChange(Number(e.target.value))}
            className="w-16 accent-pixora-accent cursor-pointer"
          />
          <span className="font-mono text-pixora-text w-8 text-right">
            {Math.round((object.opacity ?? 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Corner Radius */}
      {hasRadius && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-pixora-text-dim">Corner Radius</span>
          <div className="flex items-center space-x-1 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
            <input
              type="number"
              min={0}
              value={(object as any).cornerRadius || 0}
              onChange={e => handleRadiusChange(Number(e.target.value))}
              className="bg-transparent text-pixora-text outline-none font-mono w-14 text-right"
            />
            <span className="text-pixora-text-dim">px</span>
          </div>
        </div>
      )}
    </div>
  );
};
