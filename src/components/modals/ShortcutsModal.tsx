import React from 'react';
import { X, Command } from 'lucide-react';
import { useEditor } from '../../editor/editorContext';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useEditor();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Select tool' },
    { key: 'F', desc: 'Frame tool' },
    { key: 'R', desc: 'Rectangle tool' },
    { key: 'O', desc: 'Ellipse tool' },
    { key: 'L', desc: 'Line tool' },
    { key: 'T', desc: 'Text tool' },
    { key: 'H / Space', desc: 'Hand / Pan tool' },
    { key: 'Ctrl/Cmd + Z', desc: 'Undo' },
    { key: 'Ctrl/Cmd + Shift + Z', desc: 'Redo' },
    { key: 'Ctrl/Cmd + C', desc: 'Copy selected objects' },
    { key: 'Ctrl/Cmd + V', desc: 'Paste copied objects' },
    { key: 'Ctrl/Cmd + D', desc: 'Duplicate selected objects' },
    { key: 'Ctrl/Cmd + G', desc: 'Group selected objects' },
    { key: 'Ctrl/Cmd + Shift + G', desc: 'Ungroup' },
    { key: 'Ctrl/Cmd + S', desc: 'Save .pixora project' },
    { key: 'Delete / Backspace', desc: 'Delete selection' },
    { key: 'Escape', desc: 'Deselect / Cancel' },
    { key: 'Shift + Drag', desc: 'Lock aspect ratio / 15° rotation' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-pixora-surface border border-pixora-border rounded-xl shadow-pixora-modal w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-pixora-border">
          <div className="flex items-center space-x-2">
            <Command size={18} className="text-pixora-selection" />
            <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="text-pixora-text-muted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {shortcuts.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded bg-pixora-elevated border border-pixora-border"
            >
              <span className="text-pixora-text-muted">{item.desc}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-pixora-surface border border-pixora-border text-white font-mono text-[11px] shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-pixora-elevated border-t border-pixora-border text-right">
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="px-4 py-1.5 bg-pixora-surface hover:bg-pixora-hover text-xs font-semibold text-white rounded-lg border border-pixora-border transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
