import React from 'react';
import { Sparkles, Trash2, Undo2 } from 'lucide-react';
import { PhotoRetouchSpot } from '../../../types/document';

interface RetouchPanelProps {
  spots: PhotoRetouchSpot[];
  brushRadius: number;
  onBrushRadiusChange: (radius: number) => void;
  onUndoSpot: () => void;
  onClearSpots: () => void;
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  spots,
  brushRadius,
  onBrushRadiusChange,
  onUndoSpot,
  onClearSpots,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 text-sm text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white">Spot Healing</h3>
        </div>
        <span className="text-xs text-slate-400">
          {spots.length} {spots.length === 1 ? 'spot' : 'spots'}
        </span>
      </div>

      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40 text-xs text-slate-300 leading-relaxed">
        Click or tap directly on blemishes, dust, or unwanted spots on the photo to heal and blend them smoothly.
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-300 font-medium">Spot Size</label>
          <span className="font-mono text-slate-400">{brushRadius}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="80"
          value={brushRadius}
          onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
          className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Small (5px)</span>
          <span>Medium (40px)</span>
          <span>Large (80px)</span>
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={onUndoSpot}
          disabled={spots.length === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg border border-slate-700 transition-colors text-xs font-medium"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo Last Spot
        </button>
        <button
          onClick={onClearSpots}
          disabled={spots.length === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-red-400 rounded-lg border border-red-500/20 transition-colors text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Spots
        </button>
      </div>
    </div>
  );
};
