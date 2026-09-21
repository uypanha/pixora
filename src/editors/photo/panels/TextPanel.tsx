import React, { useRef, useState, useEffect } from 'react';
import { PhotoTextOverlay } from '../../../types/document';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Upload, Edit3, Check } from 'lucide-react';
import {
  POPULAR_FONTS,
  loadGoogleFont,
  loadCustomFontFile,
  registerFontAsset,
} from '../../../utils/fontLoader';
import { useDocument } from '../../../document/documentContext';

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
        <div className="space-y-3 bg-pixora-elevated p-3 rounded-lg border border-pixora-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-pixora-accent uppercase tracking-wider">
              Edit Text
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

          {/* Content text */}
          <div className="space-y-1">
            <span className="text-[10px] text-pixora-text-dim">Content</span>
            <textarea
              value={selectedText.text}
              onChange={e => onUpdateText(selectedText.id, { text: e.target.value })}
              rows={2}
              className="w-full bg-pixora-surface border border-pixora-border rounded p-1.5 text-white text-xs outline-none focus:border-pixora-selection resize-none"
              placeholder="Type text..."
            />
          </div>

          {/* Font family */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-pixora-text-dim">
              <span>Font Family</span>
              <button
                onClick={() => fontFileInputRef.current?.click()}
                className="text-pixora-accent hover:text-indigo-300"
              >
                + Upload font
              </button>
            </div>

            <select
              value={isCustomInput ? '__custom__' : selectedText.fontFamily}
              onChange={handleFontSelectChange}
              className="w-full bg-pixora-surface border border-pixora-border rounded px-2 py-1 text-white text-xs outline-none focus:border-pixora-selection"
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

            {isCustomInput && (
              <div className="flex items-center space-x-1.5 pt-1">
                <input
                  type="text"
                  value={customFontName}
                  onChange={e => setCustomFontName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomFontSubmit()}
                  placeholder="e.g. Kantumruy Pro, Oswald"
                  className="flex-1 bg-pixora-surface border border-pixora-border rounded px-2 py-1 text-white text-xs outline-none focus:border-pixora-selection"
                />
                <button
                  onClick={handleCustomFontSubmit}
                  className="px-2 py-1 bg-pixora-accent hover:bg-indigo-600 text-white rounded text-xs font-medium transition-colors"
                >
                  <Check size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Size & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-pixora-text-dim">Size ({selectedText.fontSize}px)</span>
              <input
                type="range"
                min={12}
                max={120}
                value={selectedText.fontSize}
                onChange={e => onUpdateText(selectedText.id, { fontSize: Number(e.target.value) })}
                className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-pixora-text-dim">Color</span>
              <div className="flex items-center space-x-1.5 bg-pixora-surface border border-pixora-border rounded px-2 py-0.5">
                <input
                  type="color"
                  value={selectedText.color}
                  onChange={e => onUpdateText(selectedText.id, { color: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="font-mono text-[10px] text-white uppercase truncate">
                  {selectedText.color}
                </span>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1">
            <span className="text-[10px] text-pixora-text-dim">Alignment</span>
            <div className="grid grid-cols-3 gap-1 bg-pixora-surface p-0.5 rounded border border-pixora-border">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onUpdateText(selectedText.id, { textAlign: align })}
                  className={`flex items-center justify-center py-1 rounded transition-colors ${
                    selectedText.textAlign === align
                      ? 'bg-pixora-selection text-white'
                      : 'text-pixora-text-dim hover:text-white'
                  }`}
                >
                  {align === 'left' && <AlignLeft size={12} />}
                  {align === 'center' && <AlignCenter size={12} />}
                  {align === 'right' && <AlignRight size={12} />}
                </button>
              ))}
            </div>
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
