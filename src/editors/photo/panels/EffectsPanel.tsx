import React from 'react';
import { PhotoEffects } from '../../../types/document';
import { RotateCcw } from 'lucide-react';

interface EffectsPanelProps {
  effects: PhotoEffects;
  onChange: (effects: PhotoEffects) => void;
}

interface SliderItemProps {
  label: string;
  description: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  onReset: () => void;
}

const EffectSliderItem: React.FC<SliderItemProps> = ({
  label,
  description,
  value,
  min = 0,
  max = 100,
  onChange,
  onReset,
}) => {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <div>
          <span className="text-pixora-text-muted font-medium">{label}</span>
          <p className="text-[10px] text-pixora-text-dim">{description}</p>
        </div>
        <div className="flex items-center space-x-1 font-mono">
          <span className={value > 0 ? 'text-pixora-accent font-medium' : 'text-pixora-text-dim'}>
            {value}%
          </span>
          {value > 0 && (
            <button
              onClick={onReset}
              className="text-pixora-text-dim hover:text-white p-0.5"
              title="Reset effect"
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
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent"
      />
    </div>
  );
};

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ effects, onChange }) => {
  const updateField = (field: keyof PhotoEffects, val: number) => {
    onChange({
      ...effects,
      [field]: val,
    });
  };

  const hasAnyEffects =
    effects.vignette > 0 ||
    effects.grain > 0 ||
    effects.blur > 0 ||
    effects.glow > 0 ||
    effects.fade > 0;

  const resetAll = () => {
    onChange({ vignette: 0, grain: 0, blur: 0, glow: 0, fade: 0 });
  };

  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Effects
        </span>
        {hasAnyEffects && (
          <button
            onClick={resetAll}
            className="flex items-center space-x-1 text-[11px] text-pixora-text-dim hover:text-white transition-colors"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <EffectSliderItem
          label="Vignette"
          description="Darken edges to draw focus to center"
          value={effects.vignette}
          onChange={v => updateField('vignette', v)}
          onReset={() => updateField('vignette', 0)}
        />
        <EffectSliderItem
          label="Film Grain"
          description="Organic analog texture"
          value={effects.grain}
          onChange={v => updateField('grain', v)}
          onReset={() => updateField('grain', 0)}
        />
        <EffectSliderItem
          label="Blur"
          description="Soft cinematic lens blur"
          value={effects.blur}
          onChange={v => updateField('blur', v)}
          onReset={() => updateField('blur', 0)}
        />
        <EffectSliderItem
          label="Fade"
          description="Lift blacks for a nostalgic washed look"
          value={effects.fade}
          onChange={v => updateField('fade', v)}
          onReset={() => updateField('fade', 0)}
        />
      </div>
    </div>
  );
};
