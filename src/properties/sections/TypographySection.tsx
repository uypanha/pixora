import React, { useRef, useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Upload, Type as TypeIcon } from 'lucide-react';
import { TextObject } from '../../types/document';
import { useDocument } from '../../document/documentContext';
import { useEditor } from '../../editor/editorContext';
import { ColorPicker } from '../../components/color/ColorPicker';
import {
  POPULAR_FONTS,
  loadGoogleFont,
  loadCustomFontFile,
  registerFontAsset,
} from '../../utils/fontLoader';

interface TypographySectionProps {
  object: TextObject;
}

export const TypographySection: React.FC<TypographySectionProps> = ({ object }) => {
  const { document, updateObjectProperties, addAsset } = useDocument();
  const { setEditingTextId } = useEditor();
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customFontName, setCustomFontName] = useState(object.fontFamily || '');

  // Register any project fonts in document.assets
  useEffect(() => {
    for (const asset of Object.values(document.assets)) {
      if (asset.type === 'font') {
        registerFontAsset(asset);
      }
    }
  }, [document.assets]);

  useEffect(() => {
    if (object.fontFamily) {
      loadGoogleFont(object.fontFamily);
    }
  }, [object.fontFamily]);

  const handleUpdate = (props: Partial<TextObject>, desc: string) => {
    updateObjectProperties(object.id, props, desc);
  };

  const handleFontSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomInput(true);
      return;
    }
    setIsCustomInput(false);
    loadGoogleFont(val);
    handleUpdate({ fontFamily: val }, 'Change font family');
  };

  const handleCustomFontSubmit = () => {
    const trimmed = customFontName.trim();
    if (trimmed) {
      loadGoogleFont(trimmed);
      handleUpdate({ fontFamily: trimmed }, 'Change custom font family');
    }
  };

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fontName, asset } = await loadCustomFontFile(file);
      addAsset(asset);
      handleUpdate({ fontFamily: fontName }, 'Set uploaded font');
      setIsCustomInput(false);
    } catch (err: any) {
      alert(err.message || 'Failed to load font file.');
    }
    e.target.value = '';
  };

  // Extract any uploaded custom font names from document.assets
  const customProjectFonts = Object.values(document.assets)
    .filter(a => a.type === 'font')
    .map(a => a.name);

  return (
    <div className="border-b border-pixora-border p-3 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        <span>Typography</span>
        <button
          onClick={() => fontFileInputRef.current?.click()}
          title="Upload local font file (.ttf, .otf, .woff, .woff2)"
          className="flex items-center space-x-1 text-[11px] normal-case text-pixora-accent hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Upload size={12} />
          <span>Upload font</span>
        </button>
      </div>

      <input
        ref={fontFileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleFontFileUpload}
      />

      {/* Text Content */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-pixora-text-dim">Content</span>
          <button
            onClick={() => setEditingTextId(object.id)}
            className="text-[10px] text-pixora-accent hover:text-indigo-300 transition-colors"
            title="Double-click canvas to edit inline"
          >
            Edit on canvas
          </button>
        </div>
        <textarea
          value={object.text || ''}
          onChange={e => handleUpdate({ text: e.target.value }, 'Change text content')}
          rows={Math.min(6, Math.max(2, (object.text || '').split('\n').length))}
          placeholder="Type text..."
          className="w-full bg-pixora-elevated text-pixora-text border border-pixora-border rounded p-2 outline-none text-xs focus:border-pixora-selection resize-y font-sans leading-relaxed"
        />
      </div>

      {/* Font Family Selector / Custom Input */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-pixora-text-dim">Font Family</span>
          <button
            onClick={() => setIsCustomInput(!isCustomInput)}
            className="text-[10px] text-pixora-text-dim hover:text-white transition-colors"
          >
            {isCustomInput ? 'Presets' : 'Type name...'}
          </button>
        </div>

        {isCustomInput ? (
          <div className="flex items-center space-x-1.5 bg-pixora-elevated rounded border border-pixora-border px-2 py-1 focus-within:border-pixora-selection">
            <TypeIcon size={13} className="text-pixora-text-dim shrink-0" />
            <input
              type="text"
              placeholder="e.g. Poppins, Lobster, Pacifico"
              value={customFontName}
              onChange={e => setCustomFontName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCustomFontSubmit();
              }}
              className="bg-transparent text-pixora-text text-xs outline-none w-full"
            />
            <button
              onClick={handleCustomFontSubmit}
              className="text-[10px] font-medium bg-pixora-accent hover:bg-indigo-600 text-white px-2 py-0.5 rounded transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
        ) : (
          <select
            value={object.fontFamily || 'Inter'}
            onChange={handleFontSelectChange}
            className="bg-pixora-elevated text-pixora-text border border-pixora-border rounded px-2 py-1.5 outline-none text-xs w-full"
          >
            {customProjectFonts.length > 0 && (
              <optgroup label="Uploaded Fonts">
                {customProjectFonts.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Sans-Serif">
              {POPULAR_FONTS.filter(f => f.category === 'Sans-Serif').map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Serif">
              {POPULAR_FONTS.filter(f => f.category === 'Serif').map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Monospace">
              {POPULAR_FONTS.filter(f => f.category === 'Monospace').map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Display">
              {POPULAR_FONTS.filter(f => f.category === 'Display').map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="System">
              {POPULAR_FONTS.filter(f => f.category === 'System').map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>

            <option value="__custom__">+ Custom Font Name...</option>
          </select>
        )}
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
        <ColorPicker
          label="Text Color"
          value={object.color || '#ffffff'}
          onChange={val => handleUpdate({ color: val }, 'Change text color')}
        />
      </div>
    </div>
  );
};
