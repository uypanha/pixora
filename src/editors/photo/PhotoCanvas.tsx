import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  PhotoProjectState,
  PhotoCrop,
  PhotoDrawStroke,
  PhotoRetouchSpot,
  PhotoTextOverlay,
  PixoraAsset,
} from '../../types/document';
import { renderPhotoToCanvas } from './rendering/photoRenderer';
import { PhotoTool } from './PhotoToolbar';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { loadGoogleFont, registerFontAsset } from '../../utils/fontLoader';
import { useDocument } from '../../document/documentContext';

interface PhotoCanvasProps {
  photo: PhotoProjectState;
  sourceAsset: PixoraAsset;
  activeTool: PhotoTool;
  isComparing: boolean;
  onCropChange: (crop: PhotoCrop) => void;
  onAddStroke: (stroke: PhotoDrawStroke) => void;
  onAddRetouchSpot: (spot: PhotoRetouchSpot) => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateTextPosition: (id: string, x: number, y: number) => void;
  onUpdateText?: (id: string, updates: Partial<PhotoTextOverlay>) => void;
  onSelectTool?: (tool: PhotoTool) => void;
  editingTextId?: string | null;
  onSetEditingTextId?: (id: string | null) => void;
  brushRadius?: number;
  drawTool?: 'brush' | 'eraser';
  drawColor?: string;
  drawSize?: number;
  drawOpacity?: number;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
  photo,
  sourceAsset,
  activeTool,
  isComparing,
  onCropChange,
  onAddStroke,
  onAddRetouchSpot,
  selectedTextId,
  onSelectText,
  onUpdateTextPosition,
  onUpdateText,
  onSelectTool,
  editingTextId: controlledEditingId,
  onSetEditingTextId,
  brushRadius = 25,
  drawTool = 'brush',
  drawColor = '#ef4444',
  drawSize = 8,
  drawOpacity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Multi-touch pinch-to-zoom & two-finger pan
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ distance: number; zoom: number; panX: number; panY: number; midX: number; midY: number } | null>(null);

  // Space key hold for pan
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Active stroke drawing state
  const [currentStroke, setCurrentStroke] = useState<PhotoDrawStroke | null>(null);

  // Dragging text overlay state (tracks delta from initial touch for butter-smooth movement)
  const [textDragState, setTextDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Inline text editing state
  const [internalEditingId, setInternalEditingId] = useState<string | null>(null);
  const editingTextId = controlledEditingId !== undefined ? controlledEditingId : internalEditingId;
  const setEditingTextId = (id: string | null) => {
    setInternalEditingId(id);
    onSetEditingTextId?.(id);
  };

  // Register custom font assets from document
  const { document: pixoraDoc } = useDocument();
  useEffect(() => {
    if (!pixoraDoc?.assets) return;
    for (const asset of Object.values(pixoraDoc.assets)) {
      if (asset.type === 'font') {
        registerFontAsset(asset);
      }
    }
  }, [pixoraDoc?.assets]);

  // Pre-load Google Fonts for all photo texts
  useEffect(() => {
    for (const t of photo.texts) {
      if (t.fontFamily) {
        loadGoogleFont(t.fontFamily);
      }
    }
  }, [photo.texts]);

  // Interactive Crop Dragging State
  // handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null
  const [cropDragHandle, setCropDragHandle] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{
    startX: number;
    startY: number;
    initialCrop: PhotoCrop;
  } | null>(null);

  // Load source image
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!sourceAsset?.dataUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Auto fit on initial image load
      setTimeout(() => fitToScreen(img), 50);
    };
    img.src = sourceAsset.dataUrl;
  }, [sourceAsset?.dataUrl]);

  // Fit photo to viewport
  const fitToScreen = useCallback((img?: HTMLImageElement | null) => {
    const targetImg = img || imageRef.current;
    if (!targetImg || !containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 48;
    const containerH = containerRef.current.clientHeight - 48;
    if (containerW <= 0 || containerH <= 0) return;

    const imgW = targetImg.width || 800;
    const imgH = targetImg.height || 600;

    const isQuarterRotated =
      photo.transform.rotation === 90 || photo.transform.rotation === 270;
    const effectiveW = isQuarterRotated ? imgH : imgW;
    const effectiveH = isQuarterRotated ? imgW : imgH;

    const scaleX = containerW / effectiveW;
    const scaleY = containerH / effectiveH;
    const fitScale = Math.min(scaleX, scaleY, 1);

    setZoom(Math.max(0.1, Number(fitScale.toFixed(2))));
    setPan({ x: 0, y: 0 });
  }, [photo.transform.rotation]);

  // Keyboard space listener for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Render to canvas
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current) return;

    // When cropping, we render the uncropped base photo to allow positioning the crop box
    const renderCrop = activeTool === 'crop' ? null : photo.crop;

    renderPhotoToCanvas(canvasRef.current, {
      image: imageRef.current,
      adjustments: photo.adjustments,
      filter: photo.filter,
      effects: photo.effects,
      crop: renderCrop,
      transform: photo.transform,
      drawing: currentStroke ? [...photo.drawing, currentStroke] : photo.drawing,
      texts: photo.texts,
      skipTexts: true,
      isOriginal: isComparing,
    });
  }, [
    imageLoaded,
    photo.adjustments,
    photo.filter,
    photo.effects,
    photo.crop,
    photo.transform,
    photo.drawing,
    photo.retouch,
    activeTool,
    isComparing,
    currentStroke,
  ]);

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(4, Math.max(0.1, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Canvas Mouse Coordinates helper
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, normX: 0, normY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y, normX, normY };
  };

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Capture pointer for reliable move/up tracking on touch
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    // Track active pointers for pinch-to-zoom
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two-finger pinch/pan mode
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      pinchStartRef.current = { distance, zoom, panX: pan.x, panY: pan.y, midX, midY };
      // Cancel any in-progress single-finger action
      setCurrentStroke(null);
      setTextDragState(null);
      return;
    }

    if (isSpacePressed || e.button === 1) {
      // Pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (activeTool === 'draw') {
      const coords = getCanvasCoordinates(e);
      const newStroke: PhotoDrawStroke = {
        id: 'stroke-' + Date.now(),
        isEraser: drawTool === 'eraser',
        color: drawColor,
        size: drawSize,
        opacity: drawOpacity,
        points: [{ x: coords.normX, y: coords.normY }],
      };
      setCurrentStroke(newStroke);
      return;
    }

    if (activeTool === 'retouch') {
      const coords = getCanvasCoordinates(e);
      onAddRetouchSpot({
        id: 'spot-' + Date.now(),
        x: coords.x,
        y: coords.y,
        radius: brushRadius,
        mode: 'heal',
      });
      return;
    }
  };

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Update tracked pointer position
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch-to-zoom & pan
    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      const scale = distance / pinchStartRef.current.distance;
      const newZoom = Math.min(4, Math.max(0.1, Number((pinchStartRef.current.zoom * scale).toFixed(2))));
      setZoom(newZoom);

      const panDeltaX = midX - pinchStartRef.current.midX;
      const panDeltaY = midY - pinchStartRef.current.midY;
      setPan({
        x: pinchStartRef.current.panX + panDeltaX,
        y: pinchStartRef.current.panY + panDeltaY,
      });
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (activeTool === 'draw' && currentStroke) {
      const coords = getCanvasCoordinates(e);
      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, { x: coords.normX, y: coords.normY }],
        };
      });
      return;
    }

    // Crop dragging
    if (activeTool === 'crop' && cropDragHandle && cropDragStart && canvasRef.current) {
      const canvas = canvasRef.current;
      const deltaX = (e.clientX - cropDragStart.startX) / (canvas.clientWidth);
      const deltaY = (e.clientY - cropDragStart.startY) / (canvas.clientHeight);
      const initial = cropDragStart.initialCrop;

      let newX = initial.x;
      let newY = initial.y;
      let newW = initial.width;
      let newH = initial.height;

      if (cropDragHandle === 'move') {
        newX = Math.max(0, Math.min(1 - newW, initial.x + deltaX));
        newY = Math.max(0, Math.min(1 - newH, initial.y + deltaY));
      } else {
        if (cropDragHandle.includes('w')) {
          const maxLeft = initial.x + initial.width - 0.05;
          newX = Math.max(0, Math.min(maxLeft, initial.x + deltaX));
          newW = initial.width - (newX - initial.x);
        }
        if (cropDragHandle.includes('e')) {
          newW = Math.max(0.05, Math.min(1 - initial.x, initial.width + deltaX));
        }
        if (cropDragHandle.includes('n')) {
          const maxTop = initial.y + initial.height - 0.05;
          newY = Math.max(0, Math.min(maxTop, initial.y + deltaY));
          newH = initial.height - (newY - initial.y);
        }
        if (cropDragHandle.includes('s')) {
          newH = Math.max(0.05, Math.min(1 - initial.y, initial.height + deltaY));
        }

        // Apply aspect ratio constraint if defined
        if (initial.aspectRatio && initial.aspectRatio !== 'free') {
          const parts = initial.aspectRatio.split(':').map(Number);
          const targetRatio =
            parts.length === 2 && parts[1] > 0 ? parts[0] / parts[1] : 1;
          const imageAspect =
            (imageRef.current?.width || 1) / (imageRef.current?.height || 1);
          newH = newW / (targetRatio / imageAspect);
          if (newY + newH > 1) {
            newH = 1 - newY;
            newW = newH * (targetRatio / imageAspect);
          }
        }
      }

      onCropChange({
        ...initial,
        x: Number(newX.toFixed(4)),
        y: Number(newY.toFixed(4)),
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4)),
      });
      return;
    }

    // Text dragging
    if (textDragState && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const deltaNormX = (e.clientX - textDragState.startX) / rect.width;
        const deltaNormY = (e.clientY - textDragState.startY) / rect.height;
        const newX = Math.max(0, Math.min(1, Number((textDragState.initialX + deltaNormX).toFixed(4))));
        const newY = Math.max(0, Math.min(1, Number((textDragState.initialY + deltaNormY).toFixed(4))));
        setTextDragState((prev) => (prev ? { ...prev, currentX: newX, currentY: newY } : null));
        onUpdateTextPosition(textDragState.id, newX, newY);
      }
      return;
    }
  };

  // Pointer Up handler
  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    // Clean up pointer tracking
    if (e) {
      pointersRef.current.delete(e.pointerId);
    }
    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
    }
    if (currentStroke) {
      onAddStroke(currentStroke);
      setCurrentStroke(null);
    }
    if (cropDragHandle) {
      setCropDragHandle(null);
      setCropDragStart(null);
    }
    if (textDragState) {
      onUpdateTextPosition(textDragState.id, textDragState.currentX, textDragState.currentY);
      setTextDragState(null);
    }
  };

  const currentCrop = photo.crop || { x: 0, y: 0, width: 1, height: 1 };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative flex-1 h-full w-full overflow-hidden bg-slate-950 select-none flex items-center justify-center ${
        isSpacePressed || isPanning
          ? 'cursor-grab active:cursor-grabbing'
          : activeTool === 'draw'
          ? 'cursor-crosshair'
          : activeTool === 'retouch'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* Canvas Viewport Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative shadow-2xl rounded-sm max-w-none max-h-none"
      >
        <canvas
          ref={canvasRef}
          className="block rounded-sm pointer-events-none"
          style={{ imageRendering: 'auto' }}
        />

        {/* Retouch Hover Cursor Indicator */}
        {activeTool === 'retouch' && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-emerald-400/80 bg-emerald-400/20 -translate-x-1/2 -translate-y-1/2 hidden"
            style={{ width: brushRadius * 2, height: brushRadius * 2 }}
          />
        )}

        {/* Text Overlays Interactive Layer */}
        {!isComparing && photo.texts && photo.texts.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {photo.texts.map((t) => {
              const isSelected = selectedTextId === t.id;
              const isEditing = editingTextId === t.id;

              if (isEditing) {
                return (
                  <textarea
                    key={t.id}
                    defaultValue={t.text}
                    autoFocus
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      onUpdateText?.(t.id, { text: e.target.value });
                    }}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingTextId(null);
                      } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        setEditingTextId(null);
                      }
                    }}
                    style={{
                      left: `${t.x * 100}%`,
                      top: `${t.y * 100}%`,
                      transform: `translate(-50%, -50%) ${t.rotation ? `rotate(${t.rotation}deg)` : ''}`,
                      fontFamily: t.fontFamily || 'Inter',
                      fontSize: `${t.fontSize}px`,
                      fontWeight: t.fontWeight || 600,
                      color: t.color,
                      textAlign: t.textAlign,
                      opacity: t.opacity ?? 1,
                      lineHeight: t.lineHeight || 1.3,
                      letterSpacing: t.letterSpacing ? `${t.letterSpacing}px` : undefined,
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      minWidth: '140px',
                      maxWidth: '90%',
                    }}
                    className="absolute pointer-events-auto z-30 p-2 rounded border-2 border-blue-500 shadow-2xl outline-none resize-none overflow-hidden"
                    rows={Math.max(1, t.text.split('\n').length)}
                  />
                );
              }

              const isDraggingThis = textDragState?.id === t.id;
              const posX = isDraggingThis ? textDragState.currentX : t.x;
              const posY = isDraggingThis ? textDragState.currentY : t.y;

              return (
                <div
                  key={t.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                    onSelectText(t.id);
                    if (activeTool !== 'text') {
                      onSelectTool?.('text');
                    }
                    setTextDragState({
                      id: t.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      initialX: t.x,
                      initialY: t.y,
                      currentX: t.x,
                      currentY: t.y,
                    });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onSelectText(t.id);
                    if (activeTool !== 'text') {
                      onSelectTool?.('text');
                    }
                    setEditingTextId(t.id);
                  }}
                  style={{
                    left: `${posX * 100}%`,
                    top: `${posY * 100}%`,
                    touchAction: 'none',
                    willChange: isDraggingThis ? 'left, top' : 'auto',
                    transform: `translate(-50%, -50%) ${t.rotation ? `rotate(${t.rotation}deg)` : ''}`,
                    fontFamily: t.fontFamily || 'Inter',
                    fontSize: `${t.fontSize}px`,
                    fontWeight: t.fontWeight || 600,
                    color: t.color,
                    textAlign: t.textAlign,
                    opacity: t.opacity ?? 1,
                    lineHeight: t.lineHeight || 1.3,
                    letterSpacing: t.letterSpacing ? `${t.letterSpacing}px` : undefined,
                    whiteSpace: 'pre-wrap',
                    ...(t.shadow?.enabled ? {
                      textShadow: `${t.shadow.offsetX}px ${t.shadow.offsetY}px ${t.shadow.blur}px ${t.shadow.color}`,
                    } : {}),
                    ...(t.stroke?.enabled && t.stroke.width > 0 ? {
                      WebkitTextStroke: `${t.stroke.width}px ${t.stroke.color}`,
                      paintOrder: 'stroke fill' as any,
                    } : {}),
                  }}
                  className={`absolute pointer-events-auto cursor-move select-none px-2.5 py-1.5 rounded transition-colors ${
                    isSelected
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-slate-900/40 shadow-lg'
                      : 'hover:ring-1 hover:ring-blue-400/60'
                  }`}
                  title="Click to select, double-click to edit text"
                >
                  {t.text}
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Crop Box Overlay */}
        {activeTool === 'crop' && (
          <div className="absolute inset-0 pointer-events-auto">
            {/* Darkened outer areas */}
            <div
              className="absolute bg-slate-950/70"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${currentCrop.y * 100}%`,
              }}
            />
            <div
              className="absolute bg-slate-950/70"
              style={{
                top: `${(currentCrop.y + currentCrop.height) * 100}%`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <div
              className="absolute bg-slate-950/70"
              style={{
                top: `${currentCrop.y * 100}%`,
                left: 0,
                width: `${currentCrop.x * 100}%`,
                height: `${currentCrop.height * 100}%`,
              }}
            />
            <div
              className="absolute bg-slate-950/70"
              style={{
                top: `${currentCrop.y * 100}%`,
                left: `${(currentCrop.x + currentCrop.width) * 100}%`,
                right: 0,
                height: `${currentCrop.height * 100}%`,
              }}
            />

            {/* The Crop Rectangle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setCropDragHandle('move');
                setCropDragStart({
                  startX: e.clientX,
                  startY: e.clientY,
                  initialCrop: { ...currentCrop },
                });
              }}
              style={{
                left: `${currentCrop.x * 100}%`,
                top: `${currentCrop.y * 100}%`,
                width: `${currentCrop.width * 100}%`,
                height: `${currentCrop.height * 100}%`,
              }}
              className="absolute border-2 border-white cursor-move shadow-sm"
            >
              {/* 3x3 Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>

              {/* Handles */}
              {(['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'] as const).map(
                (pos) => {
                  const getPosStyle = () => {
                    switch (pos) {
                      case 'nw':
                        return 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize';
                      case 'ne':
                        return 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize';
                      case 'sw':
                        return 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize';
                      case 'se':
                        return 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize';
                      case 'n':
                        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize';
                      case 's':
                        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize';
                      case 'w':
                        return 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize';
                      case 'e':
                        return 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize';
                    }
                  };
                  return (
                    <div
                      key={pos}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setCropDragHandle(pos);
                        setCropDragStart({
                          startX: e.clientX,
                          startY: e.clientY,
                          initialCrop: { ...currentCrop },
                        });
                      }}
                      className={`absolute w-3.5 h-3.5 bg-white border-2 border-slate-900 rounded-sm ${getPosStyle()}`}
                    />
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Viewport Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-xl text-slate-300 text-xs select-none z-20">
        <button
          onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] min-w-[40px] text-center font-medium">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(4, Number((z + 0.1).toFixed(2))))}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
        <button
          onClick={() => fitToScreen()}
          className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
          title="Fit to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Fit</span>
        </button>
      </div>
    </div>
  );
};
