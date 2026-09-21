import React, { useState } from 'react';
import { X, Download, FileCode, Image as ImageIcon, Box } from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { exportToSvgString } from './svgExporter';
import { exportToPng } from './pngExporter';
import { savePixoraFile, downloadBlob } from './pixoraExporter';

export const ExportModal: React.FC = () => {
  const { document, activePage } = useDocument();
  const { selectedIds, isExportModalOpen, setIsExportModalOpen } = useEditor();

  const [format, setFormat] = useState<'png1' | 'png2' | 'svg' | 'pixora'>('png2');
  const [scope, setScope] = useState<'selection' | 'page'>(
    selectedIds.length > 0 ? 'selection' : 'page'
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isExportModalOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    const targetIds = scope === 'selection' ? selectedIds : [];
    const baseName =
      scope === 'selection' && selectedIds.length === 1
        ? document.objects[selectedIds[0]]?.name || 'export'
        : document.metadata.name || 'export';

    try {
      if (format === 'pixora') {
        savePixoraFile(document);
      } else if (format === 'svg') {
        const svgStr = exportToSvgString(document, activePage, targetIds);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, `${baseName}.svg`);
      } else if (format === 'png1') {
        await exportToPng(document, activePage, targetIds, 1, `${baseName}.png`);
      } else if (format === 'png2') {
        await exportToPng(document, activePage, targetIds, 2, `${baseName}@2x.png`);
      }
      setIsExportModalOpen(false);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-pixora-surface border border-pixora-border rounded-xl shadow-pixora-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pixora-border">
          <div className="flex items-center space-x-2">
            <Download size={18} className="text-pixora-selection" />
            <h3 className="text-sm font-semibold text-white">Export Design</h3>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="text-pixora-text-muted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Scope Selector */}
          <div>
            <label className="block text-pixora-text-muted font-medium mb-1.5 uppercase tracking-wider text-[11px]">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setScope('selection')}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  scope === 'selection'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white font-medium'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white disabled:opacity-40'
                }`}
              >
                Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('page')}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  scope === 'page'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white font-medium'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white'
                }`}
              >
                Entire Page ({activePage.name})
              </button>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-pixora-text-muted font-medium mb-1.5 uppercase tracking-wider text-[11px]">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png2')}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left transition-all ${
                  format === 'png2'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white'
                }`}
              >
                <ImageIcon size={16} className="text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">PNG @2x</div>
                  <div className="text-[10px] text-pixora-text-dim">Retina Crisp</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('png1')}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left transition-all ${
                  format === 'png1'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white'
                }`}
              >
                <ImageIcon size={16} className="text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">PNG @1x</div>
                  <div className="text-[10px] text-pixora-text-dim">Standard Web</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('svg')}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left transition-all ${
                  format === 'svg'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white'
                }`}
              >
                <FileCode size={16} className="text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">SVG</div>
                  <div className="text-[10px] text-pixora-text-dim">Vector Output</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pixora')}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left transition-all ${
                  format === 'pixora'
                    ? 'border-pixora-accent bg-pixora-accent/20 text-white'
                    : 'border-pixora-border bg-pixora-elevated text-pixora-text-muted hover:text-white'
                }`}
              >
                <Box size={16} className="text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">.pixora</div>
                  <div className="text-[10px] text-pixora-text-dim">Native Project</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 bg-pixora-elevated border-t border-pixora-border">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-3.5 py-1.5 text-xs text-pixora-text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-1.5 bg-pixora-accent hover:bg-pixora-accent-hover text-xs font-semibold text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
