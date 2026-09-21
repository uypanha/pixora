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
import { PhotoTool } from './PhotoToolbar';

interface PhotoBottomBarProps {
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
  { id: 'transform', label: 'Rotate', icon: RotateCw },
  { id: 'retouch', label: 'Retouch', icon: Eye },
  { id: 'draw', label: 'Draw', icon: Paintbrush },
  { id: 'text', label: 'Text', icon: Type },
];

export const PhotoBottomBar: React.FC<PhotoBottomBarProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 flex items-center overflow-x-auto py-2 px-3 gap-2 select-none no-scrollbar">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl transition-all flex-shrink-0 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium leading-none">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
