import React, { useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  RotateCcw,
  Eye,
  Camera,
  Check,
} from 'lucide-react';

interface PhotoTopBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onExport: () => void;
  onBack: () => void;
  isComparing: boolean;
  setIsComparing: (comparing: boolean) => void;
}

export const PhotoTopBar: React.FC<PhotoTopBarProps> = ({
  title,
  onTitleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  onExport,
  onBack,
  isComparing,
  setIsComparing,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (localTitle.trim()) {
      onTitleChange(localTitle.trim());
    } else {
      setLocalTitle(title);
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between text-slate-200 select-none z-30 overflow-hidden">
      {/* Left: Back & Project Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Back to Projects"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Photo</span>
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setLocalTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="bg-slate-800 text-white text-sm font-medium px-2 py-1 rounded border border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 hover:bg-slate-800 rounded text-emerald-400"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setLocalTitle(title);
                setIsEditingTitle(true);
              }}
              className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/60 max-w-[100px] sm:max-w-[200px] truncate text-left"
              title="Click to rename"
            >
              {title}
            </button>
          )}
        </div>
      </div>

      {/* Center: Undo / Redo & Compare */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/80 p-0.5 sm:p-1 rounded-xl border border-slate-700/60 flex-shrink min-w-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Undo (Ctrl+Z / Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        <button
          onMouseDown={() => setIsComparing(true)}
          onMouseUp={() => setIsComparing(false)}
          onMouseLeave={() => setIsComparing(false)}
          onTouchStart={() => setIsComparing(true)}
          onTouchEnd={() => setIsComparing(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isComparing
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/70'
          }`}
          title="Hold to see original photo"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isComparing ? 'Showing Original' : 'Compare'}</span>
        </button>

        <button
          onClick={onResetAll}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Reset All Adjustments"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Export */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
