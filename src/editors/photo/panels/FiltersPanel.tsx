import React from 'react';
import { PhotoFilter, PhotoFilterType } from '../../../types/document';
import { PHOTO_FILTERS } from '../rendering/photoFilters';
import { RotateCcw } from 'lucide-react';

interface FiltersPanelProps {
  filter: PhotoFilter;
  onChange: (filter: PhotoFilter) => void;
}

const FILTER_CARD_GRADIENTS: Record<PhotoFilterType, string> = {
  none: 'from-slate-600 to-slate-400',
  vivid: 'from-amber-500 via-rose-500 to-indigo-500',
  warm: 'from-amber-600 to-orange-400',
  cool: 'from-blue-600 to-cyan-300',
  vintage: 'from-yellow-800 via-amber-700 to-stone-500',
  bw: 'from-neutral-900 to-neutral-200',
  fade: 'from-stone-700 to-neutral-400',
  cinematic: 'from-cyan-700 via-teal-600 to-amber-500',
  matte: 'from-slate-800 to-zinc-500',
  soft: 'from-pink-400 via-purple-300 to-indigo-300',
};

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ filter, onChange }) => {
  const filterList = Object.values(PHOTO_FILTERS);

  const handleSelectType = (type: PhotoFilterType) => {
    onChange({
      type,
      intensity: filter.intensity ?? 100,
    });
  };

  const handleIntensityChange = (intensity: number) => {
    onChange({
      ...filter,
      intensity,
    });
  };

  return (
    <div className="p-3.5 space-y-4 select-none text-pixora-text text-xs">
      <div className="flex items-center justify-between border-b border-pixora-border pb-2.5">
        <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
          Filters
        </span>
        {filter.type !== 'none' && (
          <button
            onClick={() => onChange({ type: 'none', intensity: 100 })}
            className="flex items-center space-x-1 text-[11px] text-pixora-text-dim hover:text-white transition-colors"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Intensity Slider if a filter is active */}
      {filter.type !== 'none' && (
        <div className="bg-pixora-elevated p-2.5 rounded-lg border border-pixora-border space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-pixora-text-muted">Intensity</span>
            <span className="font-mono text-pixora-accent font-medium">
              {filter.intensity ?? 100}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filter.intensity ?? 100}
            onChange={e => handleIntensityChange(Number(e.target.value))}
            className="w-full h-1.5 bg-pixora-border rounded-lg appearance-none cursor-pointer accent-pixora-accent"
          />
        </div>
      )}

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filterList.map(preset => {
          const isSelected = filter.type === preset.id;
          const gradient = FILTER_CARD_GRADIENTS[preset.id];

          return (
            <button
              key={preset.id}
              onClick={() => handleSelectType(preset.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-all text-center group cursor-pointer ${
                isSelected
                  ? 'bg-pixora-accent/15 border-pixora-selection shadow-md ring-1 ring-pixora-selection/30'
                  : 'bg-pixora-elevated border-pixora-border hover:border-pixora-text-dim/40 hover:bg-pixora-hover'
              }`}
            >
              {/* Preview swatch with stylized gradient */}
              <div
                className={`w-full h-12 rounded-md mb-1.5 bg-gradient-to-br ${gradient} shadow-inner transition-transform group-hover:scale-[1.02]`}
              />
              <span
                className={`text-[11px] font-medium truncate w-full ${
                  isSelected ? 'text-white' : 'text-pixora-text-muted group-hover:text-white'
                }`}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
