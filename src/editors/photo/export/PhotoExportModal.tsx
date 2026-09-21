import React, { useState } from 'react';
import { X, Download, FileImage } from 'lucide-react';
import { PhotoProjectState, PixoraAsset } from '../../../types/document';
import { renderPhotoToCanvas } from '../rendering/photoRenderer';
import { loadGoogleFont } from '../../../utils/fontLoader';

interface PhotoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoProjectState;
  sourceAsset: PixoraAsset;
  projectName: string;
}

type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export const PhotoExportModal: React.FC<PhotoExportModalProps> = ({
  isOpen,
  onClose,
  photo,
  sourceAsset,
  projectName,
}) => {
  const [format, setFormat] = useState<ExportFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const originalW = sourceAsset?.width || 1200;
  const originalH = sourceAsset?.height || 800;

  // Account for rotation
  const isRotatedQuarter =
    photo.transform.rotation === 90 || photo.transform.rotation === 270;
  const baseW = isRotatedQuarter ? originalH : originalW;
  const baseH = isRotatedQuarter ? originalW : originalH;

  // Account for crop
  const cropW = photo.crop ? Math.round(photo.crop.width * baseW) : baseW;
  const cropH = photo.crop ? Math.round(photo.crop.height * baseH) : baseH;

  const targetW = Math.round(cropW * scale);
  const targetH = Math.round(cropH * scale);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = sourceAsset.dataUrl;
      });

      // Preload Google Fonts and wait for fonts to be ready
      for (const t of photo.texts) {
        if (t.fontFamily) {
          loadGoogleFont(t.fontFamily);
        }
      }
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness error
        }
      }

      const offscreen = document.createElement('canvas');
      renderPhotoToCanvas(offscreen, {
        image: img,
        adjustments: photo.adjustments,
        filter: photo.filter,
        effects: photo.effects,
        crop: photo.crop,
        transform: photo.transform,
        drawing: photo.drawing,
        texts: photo.texts,
      });

      // Scale if requested
      let finalCanvas = offscreen;
      if (scale !== 1) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = targetW;
        scaledCanvas.height = targetH;
        const ctx = scaledCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(offscreen, 0, 0, targetW, targetH);
          finalCanvas = scaledCanvas;
        }
      }

      // Format extension
      const ext =
        format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-edited.${ext}`;

      const dataUrl = finalCanvas.toDataURL(format, quality);
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Export Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm">
          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'image/jpeg', label: 'JPEG', desc: 'Photos' },
                  { id: 'image/png', label: 'PNG', desc: 'Lossless' },
                  { id: 'image/webp', label: 'WebP', desc: 'Modern' },
                ] as const
              ).map((f) => {
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-sm">{f.label}</span>
                    <span className="text-[10px] opacity-70">{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'image/png' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">
                  Quality
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.02"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Standard (60%)</span>
                <span>High (85%)</span>
                <span>Maximum (100%)</span>
              </div>
            </div>
          )}

          {/* Scale / Resolution Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resolution Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { scale: 0.5, label: '0.5x' },
                { scale: 1, label: '1x (Original)' },
                { scale: 2, label: '2x (Upscale)' },
              ].map((s) => {
                const isSelected = scale === s.scale;
                return (
                  <button
                    key={s.scale}
                    onClick={() => setScale(s.scale)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 text-center pt-1 font-mono">
              Output Dimensions: {targetW} × {targetH} px
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <span>Exporting...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
