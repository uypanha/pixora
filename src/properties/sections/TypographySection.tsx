import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TextObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';

interface TypographySectionProps {
  object: TextObject;
}

export const TypographySection: React.FC<TypographySectionProps> = ({ object }) => {
  const { updateObjectProperties } = useDocument();

  const handleUpdate = (props: Partial<TextObject>, desc: string) => {
    updateObjectProperties(object.id, props, desc);
  };

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <div className="text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        Typography
      </div>

      {/* Font Family */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Font</span>
        <select
          value={object.fontFamily || 'Inter'}
          onChange={e => handleUpdate({ fontFamily: e.target.value }, 'Change font family')}
          className="bg-pixora-elevated text-pixora-text border border-pixora-border rounded px-2 py-1 outline-none text-xs w-36"
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="system-ui">System UI</option>
          <option value="Georgia">Georgia</option>
          <option value="JetBrains Mono">JetBrains Mono</option>
          <option value="Courier New">Courier</option>
        </select>
      </div>

      {/* Weight & Size */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim">Size</span>
          <input
            type="number"
            min={8}
            max={200}
            value={object.fontSize || 16}
            onChange={e => handleUpdate({ fontSize: Number(e.target.value) }, 'Change font size')}
            className="bg-transparent text-pixora-text outline-none font-mono w-12 text-right"
          />
        </div>

        <select
          value={String(object.fontWeight || 400)}
          onChange={e => handleUpdate({ fontWeight: Number(e.target.value) }, 'Change font weight')}
          className="bg-pixora-elevated text-pixora-text border border-pixora-border rounded px-2 py-1 outline-none text-xs"
        >
          <option value="300">Light 300</option>
          <option value="400">Regular 400</option>
          <option value="500">Medium 500</option>
          <option value="600">SemiBold 600</option>
          <option value="700">Bold 700</option>
          <option value="800">ExtraBold 800</option>
        </select>
      </div>

      {/* Line Height & Letter Spacing */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim">Line H</span>
          <input
            type="number"
            step="0.1"
            min={0.5}
            max={3}
            value={object.lineHeight || 1.4}
            onChange={e => handleUpdate({ lineHeight: Number(e.target.value) }, 'Change line height')}
            className="bg-transparent text-pixora-text outline-none font-mono w-12 text-right"
          />
        </div>

        <div className="flex items-center justify-between bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <span className="text-pixora-text-dim">Spacing</span>
          <input
            type="number"
            step="0.5"
            value={object.letterSpacing || 0}
            onChange={e => handleUpdate({ letterSpacing: Number(e.target.value) }, 'Change letter spacing')}
            className="bg-transparent text-pixora-text outline-none font-mono w-12 text-right"
          />
        </div>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Align</span>
        <div className="flex items-center bg-pixora-elevated rounded border border-pixora-border p-0.5">
          <button
            onClick={() => handleUpdate({ textAlign: 'left' }, 'Align text left')}
            className={`p-1 rounded ${
              object.textAlign === 'left' ? 'bg-pixora-accent text-white' : 'text-pixora-text-muted hover:text-white'
            }`}
          >
            <AlignLeft size={13} />
          </button>
          <button
            onClick={() => handleUpdate({ textAlign: 'center' }, 'Align text center')}
            className={`p-1 rounded ${
              object.textAlign === 'center' ? 'bg-pixora-accent text-white' : 'text-pixora-text-muted hover:text-white'
            }`}
          >
            <AlignCenter size={13} />
          </button>
          <button
            onClick={() => handleUpdate({ textAlign: 'right' }, 'Align text right')}
            className={`p-1 rounded ${
              object.textAlign === 'right' ? 'bg-pixora-accent text-white' : 'text-pixora-text-muted hover:text-white'
            }`}
          >
            <AlignRight size={13} />
          </button>
        </div>
      </div>

      {/* Text Color */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-pixora-text-dim">Color</span>
        <div className="flex items-center space-x-2 bg-pixora-elevated px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
          <input
            type="color"
            value={object.color || '#ffffff'}
            onChange={e => handleUpdate({ color: e.target.value }, 'Change text color')}
            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={object.color || '#ffffff'}
            onChange={e => handleUpdate({ color: e.target.value }, 'Change text color')}
            className="bg-transparent text-pixora-text outline-none font-mono w-20 text-right uppercase"
          />
        </div>
      </div>
    </div>
  );
};
