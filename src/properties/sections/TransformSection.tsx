import React from 'react';
import { PixoraObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';

interface TransformSectionProps {
  object: PixoraObject;
}

export const TransformSection: React.FC<TransformSectionProps> = ({ object }) => {
  const { updateObjectProperties } = useDocument();

  const handleChange = (field: keyof PixoraObject, val: number) => {
    updateObjectProperties(object.id, { [field]: val }, `Change ${String(field)}`);
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-2">
      <div className="text-xs font-semibold text-pixora-text-muted uppercase tracking-wider mb-1">
        Transform
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* X */}
        <div className="flex items-center bg-pixora-elevated rounded px-2 py-1 border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim w-4 font-mono">X</span>
          <input
            type="number"
            value={Math.round(object.x)}
            onChange={e => handleChange('x', Number(e.target.value))}
            className="bg-transparent text-pixora-text outline-none w-full text-right font-mono"
          />
        </div>

        {/* Y */}
        <div className="flex items-center bg-pixora-elevated rounded px-2 py-1 border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim w-4 font-mono">Y</span>
          <input
            type="number"
            value={Math.round(object.y)}
            onChange={e => handleChange('y', Number(e.target.value))}
            className="bg-transparent text-pixora-text outline-none w-full text-right font-mono"
          />
        </div>

        {/* W */}
        <div className="flex items-center bg-pixora-elevated rounded px-2 py-1 border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim w-4 font-mono">W</span>
          <input
            type="number"
            min={1}
            value={Math.round(object.width)}
            onChange={e => handleChange('width', Math.max(1, Number(e.target.value)))}
            className="bg-transparent text-pixora-text outline-none w-full text-right font-mono"
          />
        </div>

        {/* H */}
        <div className="flex items-center bg-pixora-elevated rounded px-2 py-1 border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim w-4 font-mono">H</span>
          <input
            type="number"
            min={1}
            value={Math.round(object.height)}
            onChange={e => handleChange('height', Math.max(1, Number(e.target.value)))}
            className="bg-transparent text-pixora-text outline-none w-full text-right font-mono"
          />
        </div>

        {/* Rotation */}
        <div className="flex items-center bg-pixora-elevated rounded px-2 py-1 border border-pixora-border focus-within:border-pixora-selection col-span-2">
          <span className="text-pixora-text-dim w-4 font-mono">°</span>
          <input
            type="number"
            min={0}
            max={360}
            value={Math.round(object.rotation || 0)}
            onChange={e => handleChange('rotation', (Number(e.target.value) % 360 + 360) % 360)}
            className="bg-transparent text-pixora-text outline-none w-full text-right font-mono"
          />
          <span className="text-pixora-text-dim ml-1">deg</span>
        </div>
      </div>
    </div>
  );
};
