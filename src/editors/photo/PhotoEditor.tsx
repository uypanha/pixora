import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../../document/documentContext';
import {
  PhotoAdjustments,
  PhotoFilter,
  PhotoEffects,
  PhotoCrop,
  PhotoTransform,
  PhotoDrawStroke,
  PhotoRetouchSpot,
  PhotoTextOverlay,
  DEFAULT_PHOTO_ADJUSTMENTS,
  DEFAULT_PHOTO_EFFECTS,
} from '../../types/document';
import { PhotoTool, PhotoToolbar } from './PhotoToolbar';
import { PhotoTopBar } from './PhotoTopBar';
import { PhotoCanvas } from './PhotoCanvas';
import { PhotoExportModal } from './export/PhotoExportModal';
import { PhotoMobileView } from './mobile/PhotoMobileView';

import { AdjustPanel } from './panels/AdjustPanel';
import { FiltersPanel } from './panels/FiltersPanel';
import { EffectsPanel } from './panels/EffectsPanel';
import { CropPanel } from './panels/CropPanel';
import { TransformPanel } from './panels/TransformPanel';
import { RetouchPanel } from './panels/RetouchPanel';
import { DrawPanel } from './panels/DrawPanel';
import { TextPanel } from './panels/TextPanel';

interface PhotoEditorProps {
  onOpenLauncher: () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ onOpenLauncher }) => {
  const {
    document: pixoraDoc,
    canUndo,
    canRedo,
    undo,
    redo,
    updatePhoto,
    updateMetadata,
  } = useDocument();

  const photo = pixoraDoc.photo;
  const sourceAsset = photo ? pixoraDoc.assets[photo.sourceAssetId] : undefined;

  // Active UI Tool
  const [activeTool, setActiveTool] = useState<PhotoTool>('adjust');

  // Comparison State
  const [isComparing, setIsComparing] = useState(false);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Selected Text Overlay
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Drawing tool options
  const [drawTool, setDrawTool] = useState<'brush' | 'eraser'>('brush');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawSize, setDrawSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1);

  // Retouch brush radius
  const [brushRadius, setBrushRadius] = useState(25);

  // Initial Crop snapshot for Cancel
  const initialCropRef = useRef<PhotoCrop | null | undefined>(photo?.crop);

  // Responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Cmd+E for export, '\' for compare)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      } else if (
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (cmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      } else if (e.key === '\\') {
        e.preventDefault();
        setIsComparing(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === '\\') {
        setIsComparing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canUndo, canRedo, undo, redo]);

  // If no photo state is found, render a placeholder
  if (!photo || !sourceAsset) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-slate-400">
        <p>No photo loaded.</p>
        <button
          onClick={onOpenLauncher}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Open Project Launcher
        </button>
      </div>
    );
  }

  // Adjustment handlers
  const handleAdjustmentsChange = (updates: Partial<PhotoAdjustments>) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        adjustments: { ...prev.adjustments, ...updates },
      }),
      true,
      'Change Adjustments'
    );
  };

  const handleResetAdjustments = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        adjustments: { ...DEFAULT_PHOTO_ADJUSTMENTS },
      }),
      true,
      'Reset Adjustments'
    );
  };

  // Filter handler
  const handleFilterChange = (filter: PhotoFilter) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        filter,
      }),
      true,
      `Apply Filter: ${filter.type}`
    );
  };

  // Effects handler
  const handleEffectsChange = (updates: Partial<PhotoEffects>) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        effects: { ...prev.effects, ...updates },
      }),
      true,
      'Change Effects'
    );
  };

  // Crop handlers
  const handleCropChange = (crop: PhotoCrop) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        crop,
      }),
      false // transient while dragging handles
    );
  };

  const handleApplyCrop = () => {
    if (photo.crop) {
      updatePhoto(
        (prev) => ({
          ...prev,
          crop: photo.crop,
        }),
        true,
        'Apply Crop'
      );
      initialCropRef.current = photo.crop;
    }
    setActiveTool('adjust');
  };

  const handleCancelCrop = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        crop: initialCropRef.current,
      }),
      false
    );
    setActiveTool('adjust');
  };

  // Transform handlers
  const handleTransformChange = (updates: Partial<PhotoTransform>) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        transform: { ...prev.transform, ...updates },
      }),
      true,
      'Change Transform'
    );
  };

  const handleRotate90 = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    const currentRot = photo.transform.rotation || 0;
    const newRot = ((currentRot + delta + 360) % 360) as 0 | 90 | 180 | 270;
    handleTransformChange({ rotation: newRot });
  };

  const handleFlip = (axis: 'h' | 'v') => {
    if (axis === 'h') {
      handleTransformChange({ flipHorizontal: !photo.transform.flipHorizontal });
    } else {
      handleTransformChange({ flipVertical: !photo.transform.flipVertical });
    }
  };

  // Drawing handlers
  const handleAddStroke = (stroke: PhotoDrawStroke) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        drawing: [...prev.drawing, stroke],
      }),
      true,
      'Draw Stroke'
    );
  };

  const handleUndoStroke = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        drawing: prev.drawing.slice(0, -1),
      }),
      true,
      'Undo Stroke'
    );
  };

  const handleClearDrawing = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        drawing: [],
      }),
      true,
      'Clear Drawing'
    );
  };

  // Retouch spots handlers
  const handleAddRetouchSpot = (spot: PhotoRetouchSpot) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        retouch: [...(prev.retouch || []), spot],
      }),
      true,
      'Heal Spot'
    );
  };

  const handleUndoSpot = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        retouch: (prev.retouch || []).slice(0, -1),
      }),
      true,
      'Undo Spot'
    );
  };

  const handleClearSpots = () => {
    updatePhoto(
      (prev) => ({
        ...prev,
        retouch: [],
      }),
      true,
      'Clear Spots'
    );
  };

  // Text overlay handlers
  const handleAddText = () => {
    const newText: PhotoTextOverlay = {
      id: 'text-' + Date.now(),
      text: 'Add Text Here',
      x: 0.5,
      y: 0.5,
      fontSize: 32,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      color: '#ffffff',
      opacity: 1,
      rotation: 0,
      textAlign: 'center',
    };
    updatePhoto(
      (prev) => ({
        ...prev,
        texts: [...prev.texts, newText],
      }),
      true,
      'Add Text Overlay'
    );
    setSelectedTextId(newText.id);
    setEditingTextId(newText.id);
  };

  const handleUpdateText = (id: string, updates: Partial<PhotoTextOverlay>) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }),
      true,
      'Update Text'
    );
  };

  const handleRemoveText = (id: string) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        texts: prev.texts.filter((t) => t.id !== id),
      }),
      true,
      'Delete Text'
    );
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const handleUpdateTextPosition = (id: string, x: number, y: number) => {
    updatePhoto(
      (prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === id ? { ...t, x, y } : t)),
      }),
      false // transient position drag
    );
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        'Reset all adjustments, filters, effects, crop, and transforms to original?'
      )
    ) {
      updatePhoto(
        (prev) => ({
          ...prev,
          adjustments: { ...DEFAULT_PHOTO_ADJUSTMENTS },
          filter: { type: 'none', intensity: 100 },
          effects: { ...DEFAULT_PHOTO_EFFECTS },
          crop: null,
          transform: { rotation: 0, flipHorizontal: false, flipVertical: false },
          drawing: [],
          texts: [],
          retouch: [],
        }),
        true,
        'Reset All Photo Edits'
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden select-none">
      {/* Top Bar */}
      <PhotoTopBar
        title={pixoraDoc.metadata.name}
        onTitleChange={(name) => updateMetadata({ name })}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onResetAll={handleResetAll}
        onExport={() => setIsExportOpen(true)}
        onBack={onOpenLauncher}
        isComparing={isComparing}
        setIsComparing={setIsComparing}
      />

      {/* Main Workspace Area */}
      {isMobile ? (
        <PhotoMobileView
          photo={photo}
          sourceAsset={sourceAsset}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          isComparing={isComparing}
          onAdjustmentsChange={handleAdjustmentsChange}
          onResetAdjustments={handleResetAdjustments}
          onFilterChange={handleFilterChange}
          onEffectsChange={handleEffectsChange}
          onCropChange={handleCropChange}
          onApplyCrop={handleApplyCrop}
          onCancelCrop={handleCancelCrop}
          onTransformChange={handleTransformChange}
          onRotate90={handleRotate90}
          onFlip={handleFlip}
          onAddStroke={handleAddStroke}
          onUndoStroke={handleUndoStroke}
          onClearDrawing={handleClearDrawing}
          onAddRetouchSpot={handleAddRetouchSpot}
          onUndoSpot={handleUndoSpot}
          onClearSpots={handleClearSpots}
          selectedTextId={selectedTextId}
          onSelectText={setSelectedTextId}
          onAddText={handleAddText}
          onUpdateText={handleUpdateText}
          onRemoveText={handleRemoveText}
          onUpdateTextPosition={handleUpdateTextPosition}
          brushRadius={brushRadius}
          setBrushRadius={setBrushRadius}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawColor={drawColor}
          setDrawColor={setDrawColor}
          drawSize={drawSize}
          setDrawSize={setDrawSize}
          drawOpacity={drawOpacity}
          setDrawOpacity={setDrawOpacity}
          editingTextId={editingTextId}
          onSetEditingTextId={setEditingTextId}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar */}
          <PhotoToolbar
            activeTool={activeTool}
            onSelectTool={(t) => {
              if (t === 'crop') {
                initialCropRef.current = photo.crop;
              }
              setActiveTool(t);
            }}
          />

          {/* Center Canvas */}
          <PhotoCanvas
            photo={photo}
            sourceAsset={sourceAsset}
            activeTool={activeTool}
            isComparing={isComparing}
            onCropChange={handleCropChange}
            onAddStroke={handleAddStroke}
            onAddRetouchSpot={handleAddRetouchSpot}
            selectedTextId={selectedTextId}
            onSelectText={setSelectedTextId}
            onUpdateTextPosition={handleUpdateTextPosition}
            onUpdateText={handleUpdateText}
            onSelectTool={setActiveTool}
            editingTextId={editingTextId}
            onSetEditingTextId={setEditingTextId}
            brushRadius={brushRadius}
            drawTool={drawTool}
            drawColor={drawColor}
            drawSize={drawSize}
            drawOpacity={drawOpacity}
          />

          {/* Right Adjustments / Tool Panel */}
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden flex-shrink-0">
            {activeTool === 'adjust' && (
              <AdjustPanel
                adjustments={photo.adjustments}
                onChange={handleAdjustmentsChange}
                onReset={handleResetAdjustments}
              />
            )}
            {activeTool === 'filters' && (
              <FiltersPanel
                filter={photo.filter}
                onChange={handleFilterChange}
              />
            )}
            {activeTool === 'effects' && (
              <EffectsPanel
                effects={photo.effects}
                onChange={handleEffectsChange}
              />
            )}
            {activeTool === 'crop' && (
              <CropPanel
                crop={photo.crop}
                onChange={handleCropChange}
                onApply={handleApplyCrop}
                onCancel={handleCancelCrop}
              />
            )}
            {activeTool === 'transform' && (
              <TransformPanel
                transform={photo.transform}
                onChange={handleTransformChange}
                onRotate90={handleRotate90}
                onFlip={handleFlip}
              />
            )}
            {activeTool === 'retouch' && (
              <RetouchPanel
                spots={photo.retouch || []}
                brushRadius={brushRadius}
                onBrushRadiusChange={setBrushRadius}
                onUndoSpot={handleUndoSpot}
                onClearSpots={handleClearSpots}
              />
            )}
            {activeTool === 'draw' && (
              <DrawPanel
                tool={drawTool}
                color={drawColor}
                size={drawSize}
                opacity={drawOpacity}
                onToolChange={setDrawTool}
                onColorChange={setDrawColor}
                onSizeChange={setDrawSize}
                onOpacityChange={setDrawOpacity}
                onUndoStroke={handleUndoStroke}
                onClearStrokes={handleClearDrawing}
                strokeCount={photo.drawing.length}
              />
            )}
            {activeTool === 'text' && (
              <TextPanel
                texts={photo.texts}
                selectedId={selectedTextId}
                onSelect={setSelectedTextId}
                onAddText={handleAddText}
                onUpdateText={handleUpdateText}
                onRemoveText={handleRemoveText}
                onStartEditText={setEditingTextId}
              />
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      <PhotoExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        photo={photo}
        sourceAsset={sourceAsset}
        projectName={pixoraDoc.metadata.name}
      />
    </div>
  );
};
