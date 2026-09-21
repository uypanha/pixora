import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PixoraObject, ShadowEffect } from '../../types/document';
import { useDocument } from '../../document/documentContext';
import { ColorPicker } from '../../components/color/ColorPicker';

interface EffectsSectionProps {
  object: PixoraObject;
}

export const EffectsSection: React.FC<EffectsSectionProps> = ({ object }) => {
  const { updateObjectProperties } = useDocument();

  const shadow = (object as any).shadow as ShadowEffect | undefined;

  const handleAddShadow = () => {
    const defaultShadow: ShadowEffect = {
      x: 0,
      y: 8,
      blur: 16,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.3)',
    };
    updateObjectProperties(object.id, { shadow: defaultShadow } as any, 'Add drop shadow');
  };

  const handleRemoveShadow = () => {
    updateObjectProperties(object.id, { shadow: undefined } as any, 'Remove drop shadow');
  };

  const handleUpdateShadow = (field: keyof ShadowEffect, val: any) => {
    if (!shadow) return;
    updateObjectProperties(
      object.id,
      { shadow: { ...shadow, [field]: val } } as any,
      `Change shadow ${field}`
    );
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        <span>Effects</span>
        {!shadow && (
          <button
            onClick={handleAddShadow}
            title="Add Drop Shadow"
            className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {shadow && (
        <div className="space-y-2 bg-pixora-elevated p-2.5 rounded-lg border border-pixora-border text-xs">
          <div className="flex items-center justify-between font-medium text-white">
            <span>Drop Shadow</span>
            <button
              onClick={handleRemoveShadow}
              title="Remove Shadow"
              className="text-pixora-text-dim hover:text-pixora-danger transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="flex items-center bg-pixora-surface px-1.5 py-1 rounded border border-pixora-border">
              <span className="text-pixora-text-dim text-[11px] mr-1">X</span>
              <input
                type="number"
                value={shadow.x}
                onChange={e => handleUpdateShadow('x', Number(e.target.value))}
                className="bg-transparent text-pixora-text outline-none font-mono w-full text-right"
              />
            </div>
            <div className="flex items-center bg-pixora-surface px-1.5 py-1 rounded border border-pixora-border">
              <span className="text-pixora-text-dim text-[11px] mr-1">Y</span>
              <input
                type="number"
                value={shadow.y}
                onChange={e => handleUpdateShadow('y', Number(e.target.value))}
                className="bg-transparent text-pixora-text outline-none font-mono w-full text-right"
              />
            </div>
            <div className="flex items-center bg-pixora-surface px-1.5 py-1 rounded border border-pixora-border">
              <span className="text-pixora-text-dim text-[11px] mr-1">B</span>
              <input
                type="number"
                min={0}
                value={shadow.blur}
                onChange={e => handleUpdateShadow('blur', Math.max(0, Number(e.target.value)))}
                className="bg-transparent text-pixora-text outline-none font-mono w-full text-right"
              />
            </div>
          </div>

          {/* Shadow Color */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-pixora-border/50">
            <span className="text-pixora-text-dim">Color</span>
            <ColorPicker
              label="Shadow Color"
              value={shadow.color || 'rgba(0, 0, 0, 0.3)'}
              onChange={val => handleUpdateShadow('color', val)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
