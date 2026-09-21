import React from 'react';
import {
  SlidersHorizontal,
  Wand2,
  Sparkles,
  Crop,
  RotateCw,
  Paintbrush,
  Type,
  Eye,
} from 'lucide-react';

export type PhotoTool =
  | 'adjust'
  | 'filters'
  | 'effects'
  | 'crop'
  | 'transform'
  | 'retouch'
  | 'draw'
  | 'text';

interface PhotoToolbarProps {
  activeTool: PhotoTool;
  onSelectTool: (tool: PhotoTool) => void;
}

const TOOLS: Array<{
  id: PhotoTool;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
  { id: 'filters', label: 'Filters', icon: Wand2 },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'transform', label: 'Transform', icon: RotateCw },
  { id: 'retouch', label: 'Retouch', icon: Eye },
  { id: 'draw', label: 'Draw', icon: Paintbrush },
  { id: 'text', label: 'Text', icon: Type },
];

export const PhotoToolbar: React.FC<PhotoToolbarProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <div className="flex flex-col items-center py-3 px-2 bg-slate-900 border-r border-slate-800 space-y-2 select-none w-16 flex-shrink-0">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
