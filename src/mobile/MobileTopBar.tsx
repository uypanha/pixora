import React, { useRef } from 'react';
import { Download, FolderOpen, Plus, Maximize2, Undo2, ArrowLeft, ChevronDown, Share2, MoreVertical } from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { savePixoraFile } from '../export/pixoraExporter';
import { importPixoraFile } from '../import/pixoraImporter';
import { PixoraLogo } from '../components/common/PixoraLogo';

interface MobileTopBarProps {
  onOpenLauncher: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ onOpenLauncher }) => {
  const { document, updateMetadata, canUndo, undo, setDocument } = useDocument();
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
    <header className="h-14 bg-[#0B0F19] border-b border-[#1F2937] px-3 flex items-center justify-between select-none z-30 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Back button + Brand logo + Project Name with dropdown chevron */}
      <div className="flex items-center space-x-2 min-w-0">
        <button
          onClick={onOpenLauncher}
          title="Back to Projects"
          aria-label="Back to Projects"
          className="p-1 -ml-1 text-slate-300 hover:text-white rounded-lg active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>

        <PixoraLogo size={28} className="w-7 h-7 rounded-lg shadow-sm shrink-0" />

        <div className="flex items-center gap-1 min-w-0">
          <input
            type="text"
            value={document.metadata.name}
            onChange={e => updateMetadata({ name: e.target.value })}
            className="bg-transparent text-sm font-semibold text-white outline-none max-w-[120px] sm:max-w-[180px] truncate"
          />
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Right: Quick Actions (Undo, Share/Export, More Options) */}
      <div className="flex items-center space-x-1 shrink-0">
        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
          className="p-2 text-slate-300 hover:text-white disabled:opacity-30 transition-colors active:scale-95"
        >
          <Undo2 size={18} />
        </button>

        {/* Share / Export */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          title="Export / Share"
          className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <Share2 size={18} />
        </button>

        {/* More Options */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="More options"
          className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <MoreVertical size={18} />
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
