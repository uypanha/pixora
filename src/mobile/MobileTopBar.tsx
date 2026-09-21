import React, { useRef } from 'react';
import { Menu, Download, FolderOpen, Plus, Maximize2, Undo2, Redo2 } from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { savePixoraFile } from '../export/pixoraExporter';
import { importPixoraFile } from '../import/pixoraImporter';

interface MobileTopBarProps {
  onOpenLauncher: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenLauncher }) => {
  const { document, updateMetadata, canUndo, canRedo, undo, redo, setDocument } = useDocument();
  const { setIsExportModalOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useEditor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importPixoraFile(file);
      setDocument(doc, true);
    } catch (err: any) {
      alert(err.message || 'Failed to open project.');
    }
    e.target.value = '';
  };

  return (
    <header className="h-12 bg-pixora-surface border-b border-pixora-border px-3 flex items-center justify-between select-none z-30 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Brand & Project name */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenLauncher}
          className="flex items-center space-x-1.5 focus:outline-none"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">P</span>
          </div>
          <span className="font-bold text-sm text-white">Pixora</span>
        </button>

        <span className="text-pixora-border">/</span>

        <input
          type="text"
          value={document.metadata.name}
          onChange={e => updateMetadata({ name: e.target.value })}
          className="bg-transparent text-xs font-medium text-pixora-text outline-none max-w-[110px] truncate"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-1">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-pixora-text-muted hover:text-white disabled:opacity-30 transition-colors"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-pixora-text-muted hover:text-white disabled:opacity-30 transition-colors"
        >
          <Redo2 size={16} />
        </button>

        {/* Quick Save */}
        <button
          onClick={() => savePixoraFile(document)}
          title="Save .pixora"
          className="p-2 text-pixora-selection hover:text-white transition-colors"
        >
          <Download size={17} />
        </button>

        {/* Menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-pixora-text-muted hover:text-white transition-colors"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="absolute top-12 right-2 w-52 bg-pixora-surface border border-pixora-border rounded-xl shadow-pixora-modal py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenLauncher();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover text-left"
          >
            <Plus size={14} className="text-emerald-400" />
            <span>New / Recent Projects</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover text-left"
          >
            <FolderOpen size={14} className="text-sky-400" />
            <span>Open .pixora File</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              savePixoraFile(document);
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover text-left"
          >
            <Download size={14} className="text-indigo-400" />
            <span>Save .pixora</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsExportModalOpen(true);
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover text-left"
          >
            <Maximize2 size={14} className="text-purple-400" />
            <span>Export PNG / SVG</span>
          </button>
        </div>
      )}
    </header>
  );
};
