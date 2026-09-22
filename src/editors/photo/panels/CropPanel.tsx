import React from 'react';
import { PhotoCrop } from '../../../types/document';
import { Check, X, RotateCcw, Crop as CropIcon } from 'lucide-react';

interface CropPanelProps {
  crop: PhotoCrop | null | undefined;
  activePreset?: string;
  imageWidth?: number;
  imageHeight?: number;
  onSelectPreset?: (preset: string) => void;
  onChange?: (crop: PhotoCrop) => void;
  onApply?: () => void;
  onApplyCrop?: () => void;
  onCancel?: () => void;
  onCancelCrop?: () => void;
  onResetCrop?: () => void;
}

const CROP_PRESETS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1 : 1', ratio: 1 },
  { id: '4:5', label: '4 : 5', ratio: 4 / 5 },
  { id: '3:4', label: '3 : 4', ratio: 3 / 4 },
  { id: '4:3', label: '4 : 3', ratio: 4 / 3 },
  { id: '16:9', label: '16 : 9', ratio: 16 / 9 },
  { id: '9:16', label: '9 : 16', ratio: 9 / 16 },
];

export const CropPanel: React.FC<CropPanelProps> = ({
  crop,
  activePreset,
  imageWidth = 1,
  imageHeight = 1,
  onSelectPreset,
  onChange,
  onApply,
  onApplyCrop,
  onCancel,
  onCancelCrop,
  onResetCrop,
}) => {
  const currentPreset = activePreset || crop?.aspectRatio || 'free';
  const handleApply = onApply || onApplyCrop || (() => {});
  const handleCancel = onCancel || onCancelCrop || (() => {});
  const handleReset =
    onResetCrop ||
    (() => {
      if (onChange) {
        onChange({
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          aspectRatio: undefined,
        });
      }
    });
  const handleSelectPreset =
    onSelectPreset ||
    ((presetId: string) => {
      if (!onChange) return;
      if (presetId === 'free') {
        onChange({
          x: crop?.x ?? 0,
          y: crop?.y ?? 0,
          width: crop?.width ?? 1,
          height: crop?.height ?? 1,
          aspectRatio: undefined,
        });
        return;
      }

      const preset = CROP_PRESETS.find((p) => p.id === presetId);
      if (!preset || !preset.ratio) return;

      const targetRatio = preset.ratio;
      const imgAspect = Math.max(0.001, (imageWidth || 1) / (imageHeight || 1));

      // Calculate new normalized crop width & height centered on the image
      let newW = 1;
      let newH = 1;

      if (targetRatio >= imgAspect) {
        newW = 1;
        newH = Math.min(1, Math.max(0.05, (1 / targetRatio) * imgAspect));
      } else {
        newH = 1;
        newW = Math.min(1, Math.max(0.05, targetRatio / imgAspect));
      }

      const newX = Math.max(0, (1 - newW) / 2);
      const newY = Math.max(0, (1 - newH) / 2);

      onChange({
        x: Number(newX.toFixed(4)),
        y: Number(newY.toFixed(4)),
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4)),
        aspectRatio: presetId,
      });
    });
  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <div className="flex items-center space-x-1.5 font-semibold text-white tracking-wide uppercase text-[11px]">
          <CropIcon size={13} className="text-pixora-accent" />
          <span>Crop Tool</span>
        </div>
        {crop && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-[11px] text-pixora-text-dim hover:text-white transition-colors"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-[11px] text-pixora-text-muted font-medium">
          Aspect Ratio Presets
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {CROP_PRESETS.map(preset => {
            const isSelected = currentPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors text-center ${
                  isSelected
                    ? 'bg-pixora-selection text-white border-pixora-selection shadow-sm'
                    : 'bg-pixora-elevated border-pixora-border hover:bg-pixora-hover text-pixora-text-muted hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-pixora-text-dim leading-relaxed bg-pixora-elevated p-2.5 rounded-lg border border-pixora-border">
        Drag the handles on the photo canvas to adjust the crop region. Click Apply when done.
      </p>

      {/* Action Buttons: Apply & Cancel */}
      <div className="flex items-center space-x-2 pt-2 border-t border-pixora-border/60">
        <button
          onClick={handleCancel}
          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md border border-pixora-border bg-pixora-elevated hover:bg-pixora-hover text-pixora-text transition-colors"
        >
          <X size={13} />
          <span>Cancel</span>
        </button>
        <button
          onClick={handleApply}
          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md bg-pixora-accent hover:bg-indigo-600 text-white font-medium shadow-sm transition-colors"
        >
          <Check size={13} />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );
};
