import React, { useState, useRef, useEffect } from 'react';
import { Square, Circle, Minus, Type, Layout, Shapes } from 'lucide-react';
import { useEditor } from '../../editor/editorContext';
import { Tool } from '../../types/editor';

const SHAPE_TOOLS: { id: Tool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: <Square size={16} />, shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: <Circle size={16} />, shortcut: 'O' },
  { id: 'line', label: 'Line', icon: <Minus size={16} />, shortcut: 'L' },
  { id: 'text', label: 'Text', icon: <Type size={16} />, shortcut: 'T' },
];

const FRAME_TOOL = {
  id: 'frame' as Tool,
  label: 'Frame',
  icon: <Layout size={16} />,
  shortcut: 'F',
};

const SHAPE_TOOL_IDS: Tool[] = ['rectangle', 'ellipse', 'line', 'text', 'frame'];

export const ShapesDropdown: React.FC = () => {
  const { activeTool, setActiveTool } = useEditor();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isShapeActive = SHAPE_TOOL_IDS.includes(activeTool);
  const activeShapeTool = [...SHAPE_TOOLS, FRAME_TOOL].find(t => t.id === activeTool);
  const buttonIcon = isShapeActive && activeShapeTool ? activeShapeTool.icon : <Shapes size={16} />;
  const buttonLabel = isShapeActive && activeShapeTool ? activeShapeTool.label : 'Shapes';

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleSelectTool = (tool: Tool) => {
    setActiveTool(tool);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        title={`${buttonLabel} — click to expand`}
        className={`flex items-center space-x-1 px-1.5 py-1.5 rounded transition-all ${
          isShapeActive
            ? 'bg-pixora-accent text-white shadow-sm'
            : 'text-pixora-text-muted hover:text-white hover:bg-pixora-hover'
        }`}
      >
        {buttonIcon}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className="opacity-60"
        >
          <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-pixora-surface border border-pixora-border rounded-xl shadow-pixora-modal z-50 overflow-hidden">
          <div className="p-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-pixora-text-dim px-1 pb-1.5">
              Shapes
            </span>
            <div className="grid grid-cols-2 gap-1">
              {SHAPE_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    activeTool === tool.id
                      ? 'bg-pixora-accent text-white'
                      : 'text-pixora-text hover:bg-pixora-hover hover:text-white'
                  }`}
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                  <span className="ml-auto text-[10px] font-mono opacity-50">{tool.shortcut}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-pixora-border mx-2" />

          <div className="p-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-pixora-text-dim px-1 pb-1.5">
              Frame / Artboard
            </span>
            <button
              onClick={() => handleSelectTool('frame')}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                activeTool === 'frame'
                  ? 'bg-pixora-accent text-white'
                  : 'text-pixora-text hover:bg-pixora-hover hover:text-white'
              }`}
            >
              <Layout size={16} />
              <span>Frame</span>
              <span className="ml-auto text-[10px] font-mono opacity-50">F</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
