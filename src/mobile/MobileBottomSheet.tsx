import React from 'react';
import { X, Layout, Square, Circle, Minus, Type } from 'lucide-react';
import { useEditor } from '../editor/editorContext';
import { useDocument } from '../document/documentContext';
import { LayerTree } from '../layers/LayerTree';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import {
  createFrame,
  createRectangle,
  createEllipse,
  createLine,
  createText,
} from '../document/objectFactory';
import { PROJECT_PRESETS } from '../types/preset';

export const MobileBottomSheet: React.FC = () => {
  const { mobileActiveTab, setMobileActiveTab, setActiveTool, setSelectedIds, setEditingTextId } = useEditor();
  const { addObject } = useDocument();

  if (!mobileActiveTab) return null;

  const handleClose = () => {
    setMobileActiveTab(null);
  };

  const handleAddObject = (type: 'frame' | 'rectangle' | 'ellipse' | 'line' | 'text', preset?: any) => {
    let newObj: any = null;
    const x = 50;
    const y = 50;

    if (preset) {
      newObj = createFrame(x, y, preset.width, preset.height, preset.name);
    } else {
      switch (type) {
        case 'frame':
          newObj = createFrame(x, y);
          break;
        case 'rectangle':
          newObj = createRectangle(x, y);
          break;
        case 'ellipse':
          newObj = createEllipse(x, y);
          break;
        case 'line':
          newObj = createLine(x, y);
          break;
        case 'text':
          newObj = createText(x, y, 'Double tap to edit');
          break;
      }
    }

    if (newObj) {
      addObject(newObj);
      setSelectedIds([newObj.id]);
      if (type === 'text') {
        setEditingTextId(newObj.id);
      }
    }

    setActiveTool('select');
    setMobileActiveTab('properties'); // Immediately switch to properties for easy editing
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50 backdrop-blur-xs select-none">
      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={handleClose} />

      {/* Sheet Modal */}
      <div className="bg-pixora-surface border-t border-pixora-border rounded-t-2xl max-h-[70vh] h-auto flex flex-col shadow-pixora-modal overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-pixora-border" />
        </div>

        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-pixora-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            {mobileActiveTab === 'layers' && 'Pages & Layers'}
            {mobileActiveTab === 'add' && 'Add Elements'}
            {mobileActiveTab === 'properties' && 'Design Properties'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-pixora-text-muted hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet Content */}
        <div className="flex-1 overflow-y-auto">
          {mobileActiveTab === 'layers' && (
            <div className="h-full">
              <LayerTree />
            </div>
          )}

          {mobileActiveTab === 'properties' && (
            <div className="h-full">
              <PropertiesPanel />
            </div>
          )}

          {mobileActiveTab === 'add' && (
            <div className="p-4 space-y-4 text-xs">
              <div>
                <span className="text-pixora-text-dim text-[11px] font-semibold uppercase tracking-wider block mb-2">
                  Basic Shapes
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleAddObject('rectangle')}
                    className="flex flex-col items-center justify-center p-3 bg-pixora-elevated rounded-xl border border-pixora-border hover:bg-pixora-hover"
                  >
                    <Square size={20} className="text-indigo-400 mb-1" />
                    <span>Rect</span>
                  </button>
                  <button
                    onClick={() => handleAddObject('ellipse')}
                    className="flex flex-col items-center justify-center p-3 bg-pixora-elevated rounded-xl border border-pixora-border hover:bg-pixora-hover"
                  >
                    <Circle size={20} className="text-sky-400 mb-1" />
                    <span>Circle</span>
                  </button>
                  <button
                    onClick={() => handleAddObject('line')}
                    className="flex flex-col items-center justify-center p-3 bg-pixora-elevated rounded-xl border border-pixora-border hover:bg-pixora-hover"
                  >
                    <Minus size={20} className="text-amber-400 mb-1" />
                    <span>Line</span>
                  </button>
                  <button
                    onClick={() => handleAddObject('text')}
                    className="flex flex-col items-center justify-center p-3 bg-pixora-elevated rounded-xl border border-pixora-border hover:bg-pixora-hover"
                  >
                    <Type size={20} className="text-emerald-400 mb-1" />
                    <span>Text</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-pixora-text-dim text-[11px] font-semibold uppercase tracking-wider block mb-2">
                  Frames & Artboards
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_PRESETS.slice(0, 4).map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddObject('frame', preset)}
                      className="p-3 bg-pixora-elevated rounded-xl border border-pixora-border hover:bg-pixora-hover text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <Layout size={16} className="text-purple-400" />
                        <span className="font-semibold text-white">{preset.name}</span>
                      </div>
                      <div className="text-[10px] text-pixora-text-dim mt-1 font-mono">
                        {preset.width} × {preset.height}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
