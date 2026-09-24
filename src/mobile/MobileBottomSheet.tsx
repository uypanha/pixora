import React, { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Square,
  Circle,
  Minus,
  Type,
  Layout,
  Image as ImageIcon,
} from 'lucide-react';
import { useEditor } from '../editor/editorContext';
import { useDocument } from '../document/documentContext';
import { LayerTree } from '../layers/LayerTree';
import {
  createFrame,
  createRectangle,
  createEllipse,
  createLine,
  createText,
} from '../document/objectFactory';
import { PROJECT_PRESETS } from '../types/preset';
import { importImageFile } from '../import/imageImporter';
import { AlignSection } from '../properties/sections/AlignSection';
import { TransformSection } from '../properties/sections/TransformSection';
import { AppearanceSection } from '../properties/sections/AppearanceSection';
import { StrokeSection } from '../properties/sections/StrokeSection';
import { TypographySection } from '../properties/sections/TypographySection';
import { EffectsSection } from '../properties/sections/EffectsSection';
import { ImageSection } from '../properties/sections/ImageSection';
import { TextObject, ImageObject } from '../types/document';

export const MobileBottomSheet: React.FC = () => {
  const {
    mobileActiveTab,
    setMobileActiveTab,
    selectedIds,
    setSelectedIds,
    setActiveTool,
    setEditingTextId,
  } = useEditor();

  const {
    document,
    addObject,
    updateObjectProperties,
    updateSettings,
    activePage,
  } = useDocument();

  const [activeSubTab, setActiveSubTab] = useState<'position' | 'size'>('size');
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!mobileActiveTab) return null;

  const handleClose = () => {
    setMobileActiveTab(null);
  };

  const selectedObjects = selectedIds.map(id => document.objects[id]).filter(Boolean);
  const primaryObject = selectedObjects[0];
  const rootObj = activePage?.childIds[0] ? document.objects[activePage.childIds[0]] : null;
  const targetObj = primaryObject || rootObj;

  const width = targetObj ? Math.round(targetObj.width) : 390;
  const height = targetObj ? Math.round(targetObj.height) : 844;
  const x = targetObj ? Math.round(targetObj.x) : 0;
  const y = targetObj ? Math.round(targetObj.y) : 0;
  const fill = targetObj && 'fill' in targetObj && typeof (targetObj as any).fill === 'string'
    ? (targetObj as any).fill
    : '#FFFFFF';

  const handleWidthChange = (val: number) => {
    if (targetObj) {
      updateObjectProperties(targetObj.id, { width: Math.max(1, val) }, 'Resize Width');
    }
  };

  const handleHeightChange = (val: number) => {
    if (targetObj) {
      updateObjectProperties(targetObj.id, { height: Math.max(1, val) }, 'Resize Height');
    }
  };

  const handleXChange = (val: number) => {
    if (targetObj) {
      updateObjectProperties(targetObj.id, { x: val }, 'Move X');
    }
  };

  const handleYChange = (val: number) => {
    if (targetObj) {
      updateObjectProperties(targetObj.id, { y: val }, 'Move Y');
    }
  };

  const handleFillChange = (color: string) => {
    if (targetObj && 'fill' in targetObj) {
      updateObjectProperties(targetObj.id, { fill: color }, 'Change Fill');
    } else {
      updateSettings({ canvasColor: color });
    }
  };

  const handleAddObject = (type: 'frame' | 'rectangle' | 'ellipse' | 'line' | 'text', preset?: any) => {
    let newObj: any = null;
    const posX = targetObj ? targetObj.x + 40 : 50;
    const posY = targetObj ? targetObj.y + 40 : 50;

    if (preset) {
      newObj = createFrame(posX, posY, preset.width, preset.height, preset.name);
    } else {
      switch (type) {
        case 'frame':
          newObj = createFrame(posX, posY);
          break;
        case 'rectangle':
          newObj = createRectangle(posX, posY);
          break;
        case 'ellipse':
          newObj = createEllipse(posX, posY);
          break;
        case 'line':
          newObj = createLine(posX, posY);
          break;
        case 'text':
          newObj = createText(posX, posY, 'Double tap to edit');
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
    setMobileActiveTab('properties');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const posX = targetObj ? targetObj.x + 30 : 50;
      const posY = targetObj ? targetObj.y + 30 : 50;
      const { asset, imageObject } = await importImageFile(file, posX, posY);
      addObject(imageObject, null, asset);
      setSelectedIds([imageObject.id]);
      setActiveTool('select');
      setMobileActiveTab('properties');
    } catch (err: any) {
      alert(err.message || 'Failed to import image.');
    }
    e.target.value = '';
  };

  return (
    <div className="w-full bg-[#182234] text-slate-100 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.45)] border-t border-[#273647] z-20 shrink-0 select-none max-h-[55vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Grab Handle */}
      <div
        className="w-full flex items-center justify-center pt-2.5 pb-1 cursor-pointer shrink-0"
        onClick={handleClose}
      >
        <div className="w-10 h-1 rounded-full bg-slate-600/70" />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#273647] shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide">
            {mobileActiveTab === 'properties' && (
              <>
                <span>Design</span>
                <span className="hidden">Design Properties</span>
              </>
            )}
            {mobileActiveTab === 'layers' && 'Pages & Layers'}
            {mobileActiveTab === 'add' && 'Add Elements'}
          </h3>
          {mobileActiveTab === 'properties' && targetObj && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#111827] text-indigo-400 border border-[#273647]">
              {targetObj.type}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
          title="Collapse"
          aria-label="Collapse"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Design Tab Content */}
        {mobileActiveTab === 'properties' && (
          <div className="pb-4">
            {/* Sub-Tabs: Position | Size */}
            <div className="flex items-center border-b border-[#273647] px-4 gap-6">
              <button
                onClick={() => setActiveSubTab('position')}
                className={`pb-2 pt-1 text-xs font-semibold transition-all relative ${
                  activeSubTab === 'position'
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Position
                {activeSubTab === 'position' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveSubTab('size')}
                className={`pb-2 pt-1 text-xs font-semibold transition-all relative ${
                  activeSubTab === 'size'
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Size
                {activeSubTab === 'size' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Quick Size Section */}
            <div className="px-4 pt-3">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Size</h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Width */}
                <div className="bg-[#111827] border border-[#273647] rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-indigo-500">
                  <span className="text-[10px] font-medium text-slate-400">Width</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={width}
                      onChange={e => handleWidthChange(Number(e.target.value))}
                      className="w-full bg-transparent font-semibold text-white text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium ml-1">px</span>
                  </div>
                </div>

                {/* Height */}
                <div className="bg-[#111827] border border-[#273647] rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-indigo-500">
                  <span className="text-[10px] font-medium text-slate-400">Height</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={height}
                      onChange={e => handleHeightChange(Number(e.target.value))}
                      className="w-full bg-transparent font-semibold text-white text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium ml-1">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Position Section */}
            {activeSubTab === 'position' && (
              <div className="px-4 pt-3">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Position</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* X */}
                  <div className="bg-[#111827] border border-[#273647] rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-indigo-500">
                    <span className="text-[10px] font-medium text-slate-400">X</span>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={x}
                        onChange={e => handleXChange(Number(e.target.value))}
                        className="w-full bg-transparent font-semibold text-white text-sm outline-none"
                      />
                      <span className="text-xs text-slate-400 font-medium ml-1">px</span>
                    </div>
                  </div>

                  {/* Y */}
                  <div className="bg-[#111827] border border-[#273647] rounded-xl px-3 py-1.5 flex flex-col justify-center focus-within:border-indigo-500">
                    <span className="text-[10px] font-medium text-slate-400">Y</span>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={y}
                        onChange={e => handleYChange(Number(e.target.value))}
                        className="w-full bg-transparent font-semibold text-white text-sm outline-none"
                      />
                      <span className="text-xs text-slate-400 font-medium ml-1">px</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Fill Section */}
            <div className="px-4 pt-3.5">
              <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">Fill</h4>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {[
                  { name: 'white', hex: '#FFFFFF' },
                  { name: 'lightGray', hex: '#E5E7EB' },
                  { name: 'peach', hex: '#FFC7B2' },
                  { name: 'lavender', hex: '#A5B4FC' },
                  { name: 'blue', hex: '#BAE6FD' },
                  { name: 'dark', hex: '#1E293B' },
                ].map(({ name, hex }) => {
                  const isSelected = fill.toUpperCase() === hex.toUpperCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleFillChange(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-9 h-9 rounded-xl border border-[#273647] shrink-0 transition-transform active:scale-95 ${
                        isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#182234] scale-105' : 'hover:scale-105'
                      }`}
                      title={hex}
                    />
                  );
                })}
                <label className="w-9 h-9 rounded-xl border border-[#273647] bg-[#111827] flex items-center justify-center cursor-pointer text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors shrink-0">
                  <Plus size={18} />
                  <input
                    type="color"
                    value={fill.startsWith('#') && fill.length === 7 ? fill : '#FFFFFF'}
                    onChange={e => handleFillChange(e.target.value)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Full Editing Tools as before */}
            {primaryObject && (
              <div className="mt-3 border-t border-[#273647] pt-2">
                <AlignSection />
                <TransformSection object={primaryObject} />
                {primaryObject.type === 'text' && (
                  <TypographySection object={primaryObject as TextObject} />
                )}
                <AppearanceSection object={primaryObject} />
                <StrokeSection object={primaryObject} />
                <EffectsSection object={primaryObject} />
                {primaryObject.type === 'image' && (
                  <ImageSection object={primaryObject as ImageObject} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Layers Tab Content */}
        {mobileActiveTab === 'layers' && (
          <div className="h-full">
            <LayerTree />
          </div>
        )}

        {/* Add Tab Content */}
        {mobileActiveTab === 'add' && (
          <div className="p-4 space-y-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block mb-2">
                Basic Shapes
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleAddObject('rectangle')}
                  className="flex flex-col items-center justify-center p-3 bg-[#111827] rounded-xl border border-[#273647] hover:bg-[#1E293B] transition-colors"
                >
                  <Square size={20} className="text-indigo-400 mb-1" />
                  <span className="text-slate-200">Rect</span>
                </button>
                <button
                  onClick={() => handleAddObject('ellipse')}
                  className="flex flex-col items-center justify-center p-3 bg-[#111827] rounded-xl border border-[#273647] hover:bg-[#1E293B] transition-colors"
                >
                  <Circle size={20} className="text-sky-400 mb-1" />
                  <span className="text-slate-200">Circle</span>
                </button>
                <button
                  onClick={() => handleAddObject('line')}
                  className="flex flex-col items-center justify-center p-3 bg-[#111827] rounded-xl border border-[#273647] hover:bg-[#1E293B] transition-colors"
                >
                  <Minus size={20} className="text-amber-400 mb-1" />
                  <span className="text-slate-200">Line</span>
                </button>
                <button
                  onClick={() => handleAddObject('text')}
                  className="flex flex-col items-center justify-center p-3 bg-[#111827] rounded-xl border border-[#273647] hover:bg-[#1E293B] transition-colors"
                >
                  <Type size={20} className="text-emerald-400 mb-1" />
                  <span className="text-slate-200">Text</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block mb-2">
                Frames & Artboards
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddObject('frame', preset)}
                    className="p-3 bg-[#111827] rounded-xl border border-[#273647] hover:bg-[#1E293B] text-left transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Layout size={16} className="text-purple-400" />
                      <span className="font-semibold text-slate-200">{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {preset.width} × {preset.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 font-semibold text-xs hover:bg-indigo-500/20 transition-colors"
              >
                <ImageIcon size={16} />
                <span>Import Image File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
