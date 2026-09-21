import React from 'react';
import { PhotoTextOverlay } from '../../../types/document';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { POPULAR_FONTS } from '../../../utils/fontLoader';

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
}) => {
  const activeSelectedId = selectedTextId ?? selectedId ?? null;
  const handleSelect = onSelectText ?? onSelect ?? (() => {});
  const handleDelete = onDeleteText ?? onRemoveText ?? (() => {});
  const selectedText = texts.find(t => t.id === activeSelectedId);

  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Text on Photo
        </span>
        <button
          onClick={onAddText}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-pixora-accent hover:bg-indigo-600 text-white text-[11px] font-medium transition-colors"
        >
          <Plus size={12} />
          <span>Add Text</span>
        </button>
      </div>

      {/* Selected text properties */}
      {selectedText ? (
        <div className="space-y-3 bg-pixora-elevated p-3 rounded-lg border border-pixora-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-pixora-accent uppercase tracking-wider">
              Edit Text
            </span>
            <button
              onClick={() => handleDelete(selectedText.id)}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Delete text layer"
            >
              <Trash2 size={13} />
            </button>
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
          <div className="space-y-1">
            <span className="text-[10px] text-pixora-text-dim">Font Family</span>
            <select
              value={selectedText.fontFamily}
              onChange={e => onUpdateText(selectedText.id, { fontFamily: e.target.value })}
              className="w-full bg-pixora-surface border border-pixora-border rounded px-2 py-1 text-white text-xs outline-none focus:border-pixora-selection"
            >
              {POPULAR_FONTS.map(f => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
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
