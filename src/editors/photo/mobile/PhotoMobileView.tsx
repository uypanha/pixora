import React, { useState } from 'react';
import {
  PhotoProjectState,
  PhotoAdjustments,
  PhotoFilter,
  PhotoEffects,
  PhotoCrop,
  PhotoTransform,
  PhotoDrawStroke,
  PhotoRetouchSpot,
  PixoraAsset,
} from '../../../types/document';
import { PhotoTool } from '../PhotoToolbar';
import { PhotoCanvas } from '../PhotoCanvas';
import { PhotoBottomBar } from '../PhotoBottomBar';
import { AdjustPanel } from '../panels/AdjustPanel';
import { FiltersPanel } from '../panels/FiltersPanel';
import { EffectsPanel } from '../panels/EffectsPanel';
import { CropPanel } from '../panels/CropPanel';
import { TransformPanel } from '../panels/TransformPanel';
import { RetouchPanel } from '../panels/RetouchPanel';
import { DrawPanel } from '../panels/DrawPanel';
import { TextPanel } from '../panels/TextPanel';
import { ChevronDown } from 'lucide-react';

interface PhotoMobileViewProps {
  photo: PhotoProjectState;
  sourceAsset: PixoraAsset;
  activeTool: PhotoTool;
  onSelectTool: (tool: PhotoTool) => void;
  isComparing: boolean;
  onAdjustmentsChange: (adj: Partial<PhotoAdjustments>) => void;
  onResetAdjustments: () => void;
  onFilterChange: (filter: PhotoFilter) => void;
  onEffectsChange: (fx: Partial<PhotoEffects>) => void;
  onCropChange: (crop: PhotoCrop) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onTransformChange: (transform: Partial<PhotoTransform>) => void;
  onRotate90: (direction: 'cw' | 'ccw') => void;
  onFlip: (axis: 'h' | 'v') => void;
  onAddStroke: (stroke: PhotoDrawStroke) => void;
  onUndoStroke: () => void;
  onClearDrawing: () => void;
  onAddRetouchSpot: (spot: PhotoRetouchSpot) => void;
  onUndoSpot: () => void;
  onClearSpots: () => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onAddText: () => void;
  onUpdateText: (id: string, updates: any) => void;
  onRemoveText: (id: string) => void;
  onUpdateTextPosition: (id: string, x: number, y: number) => void;
  brushRadius: number;
  setBrushRadius: (r: number) => void;
  drawTool: 'brush' | 'eraser';
  setDrawTool: (t: 'brush' | 'eraser') => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  drawSize: number;
  setDrawSize: (s: number) => void;
  drawOpacity: number;
  setDrawOpacity: (o: number) => void;
  editingTextId?: string | null;
  onSetEditingTextId?: (id: string | null) => void;
}

export const PhotoMobileView: React.FC<PhotoMobileViewProps> = (props) => {
  const [isSheetOpen, setIsSheetOpen] = useState(true);

  const handleToolSelect = (tool: PhotoTool) => {
    if (props.activeTool === tool) {
      setIsSheetOpen((prev) => !prev);
    } else {
      props.onSelectTool(tool);
      setIsSheetOpen(true);
    }
  };

  const renderPanel = () => {
    switch (props.activeTool) {
      case 'adjust':
        return (
          <AdjustPanel
            adjustments={props.photo.adjustments}
            onChange={props.onAdjustmentsChange}
            onReset={props.onResetAdjustments}
          />
        );
      case 'filters':
        return (
          <FiltersPanel
            filter={props.photo.filter}
            onChange={props.onFilterChange}
          />
        );
      case 'effects':
        return (
          <EffectsPanel
            effects={props.photo.effects}
            onChange={props.onEffectsChange}
          />
        );
      case 'crop':
        return (
          <CropPanel
            crop={props.photo.crop}
            imageWidth={props.sourceAsset.width}
            imageHeight={props.sourceAsset.height}
            onChange={props.onCropChange}
            onApply={props.onApplyCrop}
            onCancel={props.onCancelCrop}
          />
        );
      case 'transform':
        return (
          <TransformPanel
            transform={props.photo.transform}
            onChange={props.onTransformChange}
            onRotate90={props.onRotate90}
            onFlip={props.onFlip}
          />
        );
      case 'retouch':
        return (
          <RetouchPanel
            spots={props.photo.retouch || []}
            brushRadius={props.brushRadius}
            onBrushRadiusChange={props.setBrushRadius}
            onUndoSpot={props.onUndoSpot}
            onClearSpots={props.onClearSpots}
          />
        );
      case 'draw':
        return (
          <DrawPanel
            tool={props.drawTool}
            color={props.drawColor}
            size={props.drawSize}
            opacity={props.drawOpacity}
            onToolChange={props.setDrawTool}
            onColorChange={props.setDrawColor}
            onSizeChange={props.setDrawSize}
            onOpacityChange={props.setDrawOpacity}
            onUndoStroke={props.onUndoStroke}
            onClearStrokes={props.onClearDrawing}
            strokeCount={props.photo.drawing.length}
          />
        );
      case 'text':
        return (
          <TextPanel
            texts={props.photo.texts}
            selectedId={props.selectedTextId}
            onSelect={props.onSelectText}
            onAddText={props.onAddText}
            onUpdateText={props.onUpdateText}
            onRemoveText={props.onRemoveText}
            onStartEditText={props.onSetEditingTextId}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-slate-950">
      {/* Photo Viewport */}
      <div className="flex-1 relative overflow-hidden">
        <PhotoCanvas
          photo={props.photo}
          sourceAsset={props.sourceAsset}
          activeTool={props.activeTool}
          isComparing={props.isComparing}
          onCropChange={props.onCropChange}
          onAddStroke={props.onAddStroke}
          onAddRetouchSpot={props.onAddRetouchSpot}
          selectedTextId={props.selectedTextId}
          onSelectText={props.onSelectText}
          onUpdateTextPosition={props.onUpdateTextPosition}
          onUpdateText={props.onUpdateText}
          onSelectTool={props.onSelectTool}
          editingTextId={props.editingTextId}
          onSetEditingTextId={props.onSetEditingTextId}
          brushRadius={props.brushRadius}
          drawTool={props.drawTool}
          drawColor={props.drawColor}
          drawSize={props.drawSize}
          drawOpacity={props.drawOpacity}
        />
      </div>

      {/* Expandable Bottom Sheet */}
      {isSheetOpen && (
        <div className="w-full max-h-[42vh] bg-slate-900 border-t border-slate-800 shadow-2xl flex flex-col z-30 transition-transform duration-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/90 select-none">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {props.activeTool}
            </span>
            <button
              onClick={() => setIsSheetOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPanel()}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <PhotoBottomBar
        activeTool={props.activeTool}
        onSelectTool={handleToolSelect}
      />
    </div>
  );
};
