import React, { useRef, useState, useEffect } from 'react';
import { PhotoTextOverlay } from '../../../types/document';
import {
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Edit3,
  Check,
  Type as TypeIcon,
} from 'lucide-react';
import {
  POPULAR_FONTS,
  loadGoogleFont,
  loadCustomFontFile,
  registerFontAsset,
} from '../../../utils/fontLoader';
import { useDocument } from '../../../document/documentContext';
import { ColorPicker } from '../../../components/color/ColorPicker';

interface TextPanelProps {
  texts: PhotoTextOverlay[];
  selectedTextId?: string | null;
  selectedId?: string | null;
  onSelectText?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  onAddText: () => void;
  onUpdateText: (id: string, updates: Partial<PhotoTextOverlay>) => void;
  onDeleteText?: (id: string) => void;
  onRemoveText?: (id: string) => void;
  onStartEditText?: (id: string) => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  texts,
  selectedTextId,
  selectedId,
  onSelectText,
  onSelect,
  onAddText,
  onUpdateText,
  onDeleteText,
  onRemoveText,
  onStartEditText,
}) => {
  const { document: pixoraDoc, addAsset } = useDocument();
  const activeSelectedId = selectedTextId ?? selectedId ?? null;
  const handleSelect = onSelectText ?? onSelect ?? (() => {});
  const handleDelete = onDeleteText ?? onRemoveText ?? (() => {});
  const selectedText = texts.find(t => t.id === activeSelectedId);

  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customFontName, setCustomFontName] = useState(selectedText?.fontFamily || '');
  const [textVal, setTextVal] = useState(selectedText?.text || '');

  useEffect(() => {
    setTextVal(selectedText?.text || '');
  }, [selectedText?.text]);

  // Register uploaded project fonts
  useEffect(() => {
    if (!pixoraDoc?.assets) return;
    for (const asset of Object.values(pixoraDoc.assets)) {
      if (asset.type === 'font') {
        registerFontAsset(asset);
      }
    }
  }, [pixoraDoc?.assets]);

  // Pre-load font of selected text
  useEffect(() => {
    if (selectedText?.fontFamily) {
      loadGoogleFont(selectedText.fontFamily);
      setCustomFontName(selectedText.fontFamily);
    }
  }, [selectedText?.fontFamily]);

  const handleFontSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomInput(true);
      return;
    }
    setIsCustomInput(false);
    loadGoogleFont(val);
    if (selectedText) {
      onUpdateText(selectedText.id, { fontFamily: val });
    }
  };

  const handleCustomFontSubmit = () => {
    const trimmed = customFontName.trim();
    if (trimmed && selectedText) {
      loadGoogleFont(trimmed);
      onUpdateText(selectedText.id, { fontFamily: trimmed });
    }
  };

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { fontName, asset } = await loadCustomFontFile(file);
      addAsset(asset);
      if (selectedText) {
        onUpdateText(selectedText.id, { fontFamily: fontName });
      }
      setIsCustomInput(false);
    } catch (err: any) {
      alert(err.message || 'Failed to load font file.');
    }
    e.target.value = '';
  };

  // Extract uploaded custom font names from document.assets
  const customProjectFonts = Object.values(pixoraDoc?.assets || {})
    .filter(a => a.type === 'font')
    .map(a => a.name);

  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <input
        type="file"
        ref={fontFileInputRef}
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFontFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Text on Photo
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fontFileInputRef.current?.click()}
            title="Upload font file (.ttf, .otf, .woff, .woff2)"
            className="flex items-center space-x-1 text-[11px] text-pixora-accent hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <Upload size={12} />
            <span>Upload Font</span>
          </button>
          <button
            onClick={onAddText}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-pixora-accent hover:bg-indigo-600 text-white text-[11px] font-medium transition-colors"
          >
            <Plus size={12} />
            <span>Add Text</span>
          </button>
        </div>
      </div>

      {/* Selected text properties */}
      {selectedText ? (
        <div className="space-y-3.5 bg-pixora-elevated p-3 rounded-lg border border-pixora-border">
          {/* Header with inline edit & delete */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-pixora-accent uppercase tracking-wider">
              Text Properties
            </span>
            <div className="flex items-center space-x-1">
              {onStartEditText && (
                <button
                  onClick={() => onStartEditText(selectedText.id)}
                  className="flex items-center space-x-1 text-[11px] text-pixora-text-muted hover:text-white px-1.5 py-0.5 rounded hover:bg-pixora-hover transition-colors"
                  title="Edit text inline on photo canvas"
                >
                  <Edit3 size={11} />
                  <span>Inline Edit</span>
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedText.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-1"
                title="Delete text layer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* 1. Content Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-pixora-text-dim">
              <span>Content</span>
              {onStartEditText && (
                <button
                  onClick={() => onStartEditText(selectedText.id)}
                  className="text-pixora-accent hover:text-indigo-300 transition-colors"
                >
                  Edit on canvas
                </button>
              )}
            </div>
            <textarea
              value={textVal}
              onChange={e => {
                setTextVal(e.target.value);
                onUpdateText(selectedText.id, { text: e.target.value });
              }}
              rows={Math.min(5, Math.max(2, textVal.split('\n').length))}
              className="w-full bg-pixora-surface border border-pixora-border rounded p-1.5 text-white text-xs outline-none focus:border-pixora-selection resize-y font-sans leading-relaxed"
              placeholder="Type text..."
            />
          </div>

          {/* 2. Typography Section */}
          <div className="space-y-2 pt-2 border-t border-pixora-border/60">
            <div className="text-[10px] font-semibold text-pixora-text-muted uppercase tracking-wider">
              Typography
            </div>

            {/* Font Family */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-pixora-text-dim">
                <span>Font Family</span>
                <button
                  onClick={() => setIsCustomInput(!isCustomInput)}
                  className="text-pixora-accent hover:text-indigo-300"
                >
                  {isCustomInput ? 'Presets' : 'Type name...'}
                </button>
              </div>

              {isCustomInput ? (
                <div className="flex items-center space-x-1.5 bg-pixora-surface rounded border border-pixora-border px-2 py-1 focus-within:border-pixora-selection">
                  <TypeIcon size={13} className="text-pixora-text-dim shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Poppins, Kantumruy Pro"
                    value={customFontName}
                    onChange={e => setCustomFontName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomFontSubmit()}
                    className="bg-transparent text-white text-xs outline-none w-full"
                  />
                  <button
                    onClick={handleCustomFontSubmit}
                    className="text-[10px] font-medium bg-pixora-accent hover:bg-indigo-600 text-white px-2 py-0.5 rounded transition-colors shrink-0"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <select
                  value={selectedText.fontFamily || 'Inter'}
                  onChange={handleFontSelectChange}
                  className="w-full bg-pixora-surface border border-pixora-border rounded px-2 py-1.5 text-white text-xs outline-none focus:border-pixora-selection"
                >
                  {customProjectFonts.length > 0 && (
                    <optgroup label="Uploaded Project Fonts">
                      {customProjectFonts.map(name => (
                        <option key={name} value={name}>
                          {name} (Uploaded)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {(['Khmer', 'Sans-Serif', 'Serif', 'Monospace', 'Display', 'System'] as const).map(cat => {
                    const fonts = POPULAR_FONTS.filter(f => f.category === cat);
                    if (fonts.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat}>
                        {fonts.map(f => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}

                  <option value="__custom__">+ Custom / Google Font...</option>
                </select>
              )}
            </div>

            {/* Size & Weight */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-pixora-text-dim">Size (px)</span>
                <div className="flex items-center space-x-1.5 bg-pixora-surface px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
                  <input
                    type="number"
                    min={8}
                    max={500}
                    value={selectedText.fontSize || 32}
                    onChange={e => onUpdateText(selectedText.id, { fontSize: Math.max(1, Number(e.target.value)) })}
                    className="bg-transparent text-white outline-none font-mono w-full text-right text-xs"
                  />
                  <span className="text-pixora-text-dim text-[10px]">px</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-pixora-text-dim">Weight</span>
                <select
                  value={String(selectedText.fontWeight || 600)}
                  onChange={e => onUpdateText(selectedText.id, { fontWeight: Number(e.target.value) })}
                  className="w-full bg-pixora-surface border border-pixora-border rounded px-2 py-1 outline-none text-white text-xs h-[31px]"
                >
                  <option value="300">Light 300</option>
                  <option value="400">Regular 400</option>
                  <option value="500">Medium 500</option>
                  <option value="600">SemiBold 600</option>
                  <option value="700">Bold 700</option>
                  <option value="800">ExtraBold 800</option>
                </select>
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-pixora-text-dim">Line Height</span>
                <div className="flex items-center justify-between bg-pixora-surface px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
                  <span className="text-pixora-text-dim text-[10px]">LH</span>
                  <input
                    type="number"
                    step="0.1"
                    min={0.5}
                    max={3}
                    value={selectedText.lineHeight ?? 1.3}
                    onChange={e => onUpdateText(selectedText.id, { lineHeight: Number(e.target.value) })}
                    className="bg-transparent text-white outline-none font-mono w-12 text-right text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-pixora-text-dim">Letter Spacing</span>
                <div className="flex items-center justify-between bg-pixora-surface px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
                  <span className="text-pixora-text-dim text-[10px]">Spacing</span>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedText.letterSpacing ?? 0}
                    onChange={e => onUpdateText(selectedText.id, { letterSpacing: Number(e.target.value) })}
                    className="bg-transparent text-white outline-none font-mono w-12 text-right text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="space-y-1">
              <span className="text-[10px] text-pixora-text-dim">Alignment</span>
              <div className="grid grid-cols-3 gap-1 bg-pixora-surface p-0.5 rounded border border-pixora-border">
                {(['left', 'center', 'right'] as const).map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdateText(selectedText.id, { textAlign: align })}
                    className={`flex items-center justify-center py-1 rounded transition-colors ${
                      selectedText.textAlign === align
                        ? 'bg-pixora-selection text-white shadow-sm'
                        : 'text-pixora-text-dim hover:text-white'
                    }`}
                  >
                    {align === 'left' && <AlignLeft size={13} />}
                    {align === 'center' && <AlignCenter size={13} />}
                    {align === 'right' && <AlignRight size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color with ColorPicker */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-pixora-text-dim">Text Color</span>
              <ColorPicker
                label="Text Color"
                value={selectedText.color || '#ffffff'}
                onChange={val => onUpdateText(selectedText.id, { color: val })}
              />
            </div>
          </div>

          {/* 3. Appearance Section (Opacity) */}
          <div className="space-y-2 pt-2 border-t border-pixora-border/60">
            <div className="text-[10px] font-semibold text-pixora-text-muted uppercase tracking-wider">
              Appearance
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-pixora-text-dim">Opacity</span>
              <div className="flex items-center space-x-2 bg-pixora-surface px-2 py-1 rounded border border-pixora-border focus-within:border-pixora-selection">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((selectedText.opacity ?? 1) * 100)}
                  onChange={e => onUpdateText(selectedText.id, { opacity: Number(e.target.value) / 100 })}
                  className="w-16 accent-pixora-accent cursor-pointer h-1.5"
                />
                <span className="font-mono text-white text-[10px] w-8 text-right">
                  {Math.round((selectedText.opacity ?? 1) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 4. Stroke (Outline) Section with ColorPicker */}
          <div className="space-y-2 pt-2 border-t border-pixora-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-pixora-text-muted uppercase tracking-wider">
                Stroke
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedText.stroke?.enabled ?? false}
                  onChange={e =>
                    onUpdateText(selectedText.id, {
                      stroke: {
                        enabled: e.target.checked,
                        color: selectedText.stroke?.color ?? '#000000',
                        width: selectedText.stroke?.width ?? 2,
                      },
                    })
                  }
                  className="w-3 h-3 rounded accent-pixora-accent cursor-pointer"
                />
                <span className="text-[10px] text-pixora-text-dim">
                  {selectedText.stroke?.enabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>

            {selectedText.stroke?.enabled && (
              <div className="space-y-2 bg-pixora-surface p-2.5 rounded-lg border border-pixora-border">
                {/* Stroke Color */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pixora-text-dim">Color</span>
                  <ColorPicker
                    label="Stroke Color"
                    value={selectedText.stroke.color || '#000000'}
                    onChange={val =>
                      onUpdateText(selectedText.id, {
                        stroke: { ...selectedText.stroke!, color: val },
                      })
                    }
                  />
                </div>

                {/* Stroke Width */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pixora-text-dim">Width</span>
                  <div className="flex items-center space-x-1 bg-pixora-elevated px-2 py-0.5 rounded border border-pixora-border focus-within:border-pixora-selection">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={selectedText.stroke.width || 2}
                      onChange={e =>
                        onUpdateText(selectedText.id, {
                          stroke: { ...selectedText.stroke!, width: Math.max(1, Number(e.target.value)) },
                        })
                      }
                      className="bg-transparent text-white outline-none font-mono w-12 text-right text-xs"
                    />
                    <span className="text-pixora-text-dim text-[10px]">px</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Drop Shadow Section with ColorPicker */}
          <div className="space-y-2 pt-2 border-t border-pixora-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-pixora-text-muted uppercase tracking-wider">
                Drop Shadow
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedText.shadow?.enabled ?? false}
                  onChange={e =>
                    onUpdateText(selectedText.id, {
                      shadow: {
                        enabled: e.target.checked,
                        color: selectedText.shadow?.color ?? 'rgba(0, 0, 0, 0.5)',
                        offsetX: selectedText.shadow?.offsetX ?? 2,
                        offsetY: selectedText.shadow?.offsetY ?? 2,
                        blur: selectedText.shadow?.blur ?? 4,
                      },
                    })
                  }
                  className="w-3 h-3 rounded accent-pixora-accent cursor-pointer"
                />
                <span className="text-[10px] text-pixora-text-dim">
                  {selectedText.shadow?.enabled ? 'On' : 'Off'}
                </span>
              </label>
            </div>

            {selectedText.shadow?.enabled && (
              <div className="space-y-2 bg-pixora-surface p-2.5 rounded-lg border border-pixora-border">
                {/* Shadow Offset X, Y, Blur */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="flex items-center bg-pixora-elevated px-1.5 py-1 rounded border border-pixora-border">
                    <span className="text-pixora-text-dim text-[10px] mr-1">X</span>
                    <input
                      type="number"
                      value={selectedText.shadow.offsetX}
                      onChange={e =>
                        onUpdateText(selectedText.id, {
                          shadow: { ...selectedText.shadow!, offsetX: Number(e.target.value) },
                        })
                      }
                      className="bg-transparent text-white outline-none font-mono w-full text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center bg-pixora-elevated px-1.5 py-1 rounded border border-pixora-border">
                    <span className="text-pixora-text-dim text-[10px] mr-1">Y</span>
                    <input
                      type="number"
                      value={selectedText.shadow.offsetY}
                      onChange={e =>
                        onUpdateText(selectedText.id, {
                          shadow: { ...selectedText.shadow!, offsetY: Number(e.target.value) },
                        })
                      }
                      className="bg-transparent text-white outline-none font-mono w-full text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center bg-pixora-elevated px-1.5 py-1 rounded border border-pixora-border">
                    <span className="text-pixora-text-dim text-[10px] mr-1">B</span>
                    <input
                      type="number"
                      min={0}
                      value={selectedText.shadow.blur}
                      onChange={e =>
                        onUpdateText(selectedText.id, {
                          shadow: { ...selectedText.shadow!, blur: Math.max(0, Number(e.target.value)) },
                        })
                      }
                      className="bg-transparent text-white outline-none font-mono w-full text-right text-xs"
                    />
                  </div>
                </div>

                {/* Shadow Color */}
                <div className="flex items-center justify-between pt-1 border-t border-pixora-border/50">
                  <span className="text-[10px] text-pixora-text-dim">Color</span>
                  <ColorPicker
                    label="Shadow Color"
                    value={selectedText.shadow.color || 'rgba(0, 0, 0, 0.5)'}
                    onChange={val =>
                      onUpdateText(selectedText.id, {
                        shadow: { ...selectedText.shadow!, color: val },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-pixora-border rounded-lg text-pixora-text-dim space-y-1">
          <p className="text-xs">No text layer selected</p>
          <p className="text-[10px]">Click "Add Text" or click a text on the photo to edit</p>
        </div>
      )}

      {/* List of text layers */}
      {texts.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-pixora-border/60">
          <span className="text-[10px] text-pixora-text-dim uppercase tracking-wider font-semibold">
            Text Layers ({texts.length})
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {texts.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer text-xs border transition-colors ${
                  activeSelectedId === t.id
                    ? 'bg-pixora-accent/20 border-pixora-selection text-white'
                    : 'bg-pixora-elevated border-pixora-border hover:bg-pixora-hover text-pixora-text-muted'
                }`}
              >
                <span className="truncate flex-1 mr-2">{t.text || `Text #${idx + 1}`}</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(t.id);
                  }}
                  className="text-pixora-text-dim hover:text-red-400 p-0.5"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
