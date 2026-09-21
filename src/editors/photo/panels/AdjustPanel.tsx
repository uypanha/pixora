import React from 'react';
import { RotateCcw, Sun, Sliders, Sparkles } from 'lucide-react';
import { PhotoAdjustments } from '../../../types/document';
import { DEFAULT_PHOTO_ADJUSTMENTS } from '../../../document/defaultPhotoProject';

interface AdjustPanelProps {
  adjustments: PhotoAdjustments;
  onChange: (adjustments: PhotoAdjustments) => void;
  onReset?: () => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (val: number) => void;
  onReset: () => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  defaultValue = 0,
  onChange,
  onReset,
}) => {
  const isChanged = value !== defaultValue;

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-pixora-text-muted">{label}</span>
        <div className="flex items-center space-x-1.5 font-mono">
          <span className={isChanged ? 'text-pixora-accent font-medium' : 'text-pixora-text-dim'}>
            {value > 0 ? `+${value}` : value}
          </span>
          {isChanged && (
            <button
              onClick={onReset}
              title="Reset slider"
              className="text-pixora-text-dim hover:text-white p-0.5 rounded transition-colors"
            >
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent focus:outline-none"
      />
    </div>
  );
};

export const AdjustPanel: React.FC<AdjustPanelProps> = ({ adjustments, onChange }) => {
  const updateField = (field: keyof PhotoAdjustments, val: number) => {
    onChange({
      ...adjustments,
      [field]: val,
    });
  };

  const resetAllAdjustments = () => {
    onChange({ ...DEFAULT_PHOTO_ADJUSTMENTS });
  };

  return (
    <div className="p-3.5 space-y-5 select-none text-pixora-text text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Adjustments
        </span>
        <button
          onClick={resetAllAdjustments}
          className="flex items-center space-x-1 text-[11px] text-pixora-text-dim hover:text-white transition-colors"
          title="Reset all adjustments"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* Light Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1.5 text-pixora-accent font-semibold text-[11px] uppercase tracking-wider">
          <Sun size={13} />
          <span>Light</span>
        </div>
        <div className="space-y-2.5 pl-1">
          <SliderRow
            label="Exposure"
            value={adjustments.exposure}
            onChange={v => updateField('exposure', v)}
            onReset={() => updateField('exposure', 0)}
          />
          <SliderRow
            label="Brightness"
            value={adjustments.brightness}
            onChange={v => updateField('brightness', v)}
            onReset={() => updateField('brightness', 0)}
          />
          <SliderRow
            label="Contrast"
            value={adjustments.contrast}
            onChange={v => updateField('contrast', v)}
            onReset={() => updateField('contrast', 0)}
          />
          <SliderRow
            label="Highlights"
            value={adjustments.highlights}
            onChange={v => updateField('highlights', v)}
            onReset={() => updateField('highlights', 0)}
          />
          <SliderRow
            label="Shadows"
            value={adjustments.shadows}
            onChange={v => updateField('shadows', v)}
            onReset={() => updateField('shadows', 0)}
          />
          <SliderRow
            label="Whites"
            value={adjustments.whites}
            onChange={v => updateField('whites', v)}
            onReset={() => updateField('whites', 0)}
          />
          <SliderRow
            label="Blacks"
            value={adjustments.blacks}
            onChange={v => updateField('blacks', v)}
            onReset={() => updateField('blacks', 0)}
          />
        </div>
      </div>

      {/* Color Section */}
      <div className="space-y-3 pt-2 border-t border-pixora-border/60">
        <div className="flex items-center space-x-1.5 text-pixora-accent font-semibold text-[11px] uppercase tracking-wider">
          <Sliders size={13} />
          <span>Color</span>
        </div>
        <div className="space-y-2.5 pl-1">
          <SliderRow
            label="Temperature"
            value={adjustments.temperature}
            onChange={v => updateField('temperature', v)}
            onReset={() => updateField('temperature', 0)}
          />
          <SliderRow
            label="Tint"
            value={adjustments.tint}
            onChange={v => updateField('tint', v)}
            onReset={() => updateField('tint', 0)}
          />
          <SliderRow
            label="Saturation"
            value={adjustments.saturation}
            onChange={v => updateField('saturation', v)}
            onReset={() => updateField('saturation', 0)}
          />
          <SliderRow
            label="Vibrance"
            value={adjustments.vibrance}
            onChange={v => updateField('vibrance', v)}
            onReset={() => updateField('vibrance', 0)}
          />
          <SliderRow
            label="Hue"
            min={-180}
            max={180}
            value={adjustments.hue}
            onChange={v => updateField('hue', v)}
            onReset={() => updateField('hue', 0)}
          />
        </div>
      </div>

      {/* Detail Section */}
      <div className="space-y-3 pt-2 border-t border-pixora-border/60">
        <div className="flex items-center space-x-1.5 text-pixora-accent font-semibold text-[11px] uppercase tracking-wider">
          <Sparkles size={13} />
          <span>Detail</span>
        </div>
        <div className="space-y-2.5 pl-1">
          <SliderRow
            label="Sharpness"
            min={0}
            max={100}
            value={adjustments.sharpness}
            onChange={v => updateField('sharpness', v)}
            onReset={() => updateField('sharpness', 0)}
          />
          <SliderRow
            label="Clarity"
            value={adjustments.clarity}
            onChange={v => updateField('clarity', v)}
            onReset={() => updateField('clarity', 0)}
          />
        </div>
      </div>
    </div>
  );
};
