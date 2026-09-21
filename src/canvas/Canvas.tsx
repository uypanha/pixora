import React, { useRef, useCallback, useEffect } from 'react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { CanvasGrid } from './CanvasGrid';
import { CanvasObject } from './CanvasObject';
import { SelectionBox } from './SelectionBox';
import { SmartGuides } from './SmartGuides';
import { MarqueeOverlay } from './MarqueeOverlay';
import { TextEditorOverlay } from './TextEditorOverlay';
import { DragHandle } from '../types/editor';
import {
  getBoundingBox,
  calculateResize,
  calculateRotation,
} from '../utils/math';
import { snapToGrid, computeSmartSnapping } from '../utils/snap';
import { collectMoveIds, getSelectableTargetId } from '../utils/tree';
import {
  createFrame,
  createRectangle,
  createEllipse,
  createLine,
  createText,
} from '../document/objectFactory';
import { TextObject, PixoraObject } from '../types/document';

export const Canvas: React.FC = () => {
  const {
    document,
    activePage,
    addObject,
    transformObjects,
    updateObjectProperties,
    updateObjectsTransient,
  } = useDocument();

  const {
    activeTool,
    setActiveTool,
    selectedIds,
    setSelectedIds,
    selectObject,
    clearSelection,
    hoveredId,
    viewport,
    setViewport,
    editingTextId,
    setEditingTextId,
    dragState,
    setDragState,
    activeGuides,
    setActiveGuides,
    setContextMenu,
  } = useEditor();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSpacePressed = useRef(false);
  const touchStartDist = useRef<number | null>(null);
  const touchStartCenter = useRef<{ x: number; y: number } | null>(null);

  // Keyboard Space listener for temporary hand pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed.current && !editingTextId) {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          isSpacePressed.current = true;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingTextId]);

  // Screen to Canvas coordinate converter
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = screenX - rect.left;
      const relativeY = screenY - rect.top;
      return {
        x: (relativeX - viewport.x) / viewport.zoom,
        y: (relativeY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Wheel handling: zoom on Ctrl/Cmd + wheel or trackpad pinch; pan otherwise
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const rect = containerRef.current.getBoundingClientRect();
        const cursorScreenX = e.clientX - rect.left;
        const cursorScreenY = e.clientY - rect.top;

        const zoomFactor = Math.pow(0.992, e.deltaY);
        const newZoom = Math.min(5, Math.max(0.1, Number((viewport.zoom * zoomFactor).toFixed(3))));

        // Keep cursor position stable on zoom
        const newX = cursorScreenX - (cursorScreenX - viewport.x) * (newZoom / viewport.zoom);
        const newY = cursorScreenY - (cursorScreenY - viewport.y) * (newZoom / viewport.zoom);

        setViewport({
          x: Math.round(newX),
          y: Math.round(newY),
          zoom: newZoom,
        });
      } else {
        // Pan
        setViewport(prev => ({
          ...prev,
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    },
    [viewport, setViewport]
  );

  // Object Selection click
  const handleObjectSelect = useCallback(
    (id: string, e: React.MouseEvent | React.TouchEvent) => {
      if (activeTool === 'hand' || isSpacePressed.current) return;

      const targetId = getSelectableTargetId(id, document.objects, selectedIds, e.metaKey || e.ctrlKey);
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      selectObject(targetId, isShift);
    },
    [activeTool, selectObject, document.objects, selectedIds]
  );

  // Object direct pointer down (Select & drag initiation)
  const handleObjectPointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (activeTool === 'hand' || e.button === 1 || isSpacePressed.current) return;
      if (e.button !== 0) return;

      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);

      const targetId = getSelectableTargetId(id, document.objects, selectedIds, e.metaKey || e.ctrlKey);
      const isShift = e.shiftKey;
      let effectiveSelectedIds = selectedIds;

      if (isShift) {
        if (selectedIds.includes(targetId)) {
          effectiveSelectedIds = selectedIds.filter(item => item !== targetId);
          setSelectedIds(effectiveSelectedIds);
          return;
        } else {
          effectiveSelectedIds = [...selectedIds, targetId];
          setSelectedIds(effectiveSelectedIds);
        }
      } else {
        if (!selectedIds.includes(targetId)) {
          effectiveSelectedIds = [targetId];
          setSelectedIds([targetId]);
        }
      }

      if (editingTextId && editingTextId !== targetId) {
        setEditingTextId(null);
      }

      if (activeTool === 'select') {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const initialSnapshots: Record<string, any> = {};
        const allMoveIds = collectMoveIds(effectiveSelectedIds, document.objects);

        for (const moveId of allMoveIds) {
          const obj = document.objects[moveId];
          if (obj) {
            initialSnapshots[moveId] = {
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              rotation: obj.rotation,
            };
          }
        }

        setDragState({
          type: 'move',
          startX: canvasPos.x,
          startY: canvasPos.y,
          currentX: canvasPos.x,
          currentY: canvasPos.y,
          initialSnapshots,
        });
      }
    },
    [activeTool, selectedIds, document.objects, screenToCanvas, setSelectedIds, setDragState, editingTextId, setEditingTextId]
  );

  const handleObjectDoubleClick = useCallback(
    (id: string) => {
      setSelectedIds([id]);
      setDragState(null);
      const obj = document.objects[id];
      if (obj && obj.type === 'text') {
        setEditingTextId(id);
      }
    },
    [document.objects, setSelectedIds, setEditingTextId, setDragState]
  );

  // Object right-click context menu
  const handleObjectContextMenu = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = getSelectableTargetId(id, document.objects, selectedIds, e.metaKey || e.ctrlKey);
      if (!selectedIds.includes(targetId)) {
        setSelectedIds([targetId]);
      }
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetId,
      });
    },
    [document.objects, selectedIds, setSelectedIds, setContextMenu]
  );

  // Background right-click context menu
  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [setContextMenu]
  );

  // Background PointerDown: start panning, marquee selection, or shape drawing
  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingTextId) {
      setEditingTextId(null);
    }

    // Hand tool or middle mouse click or spacebar held
    if (activeTool === 'hand' || e.button === 1 || isSpacePressed.current) {
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
      return;
    }

    if (e.button !== 0) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    // Draw tools (frame, rectangle, ellipse, line, text)
    if (activeTool !== 'select') {
      setDragState({
        type: 'draw',
        startX: canvasPos.x,
        startY: canvasPos.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
        drawShape: activeTool,
      });
      return;
    }

    // Default select tool on empty canvas -> Marquee selection
    if (!e.shiftKey) {
      clearSelection();
    }
    setDragState({
      type: 'marquee',
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    });
  };

  // Move handle pointer down
  const handleMovePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'hand' || isSpacePressed.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const initialSnapshots: Record<string, any> = {};
    const allMoveIds = collectMoveIds(selectedIds, document.objects);

    for (const id of allMoveIds) {
      const obj = document.objects[id];
      if (obj) {
        initialSnapshots[id] = {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          rotation: obj.rotation,
        };
      }
    }

    setDragState({
      type: 'move',
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
      initialSnapshots,
    });
  };

  // Resize handle pointer down
  const handleResizePointerDown = (handle: DragHandle, e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const initialSnapshots: Record<string, any> = {};
    const allResizeIds = collectMoveIds(selectedIds, document.objects);

    for (const id of allResizeIds) {
      const obj = document.objects[id];
      if (obj) {
        initialSnapshots[id] = {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          rotation: obj.rotation,
        };
      }
    }

    setDragState({
      type: 'resize',
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
      handle,
      initialSnapshots,
    });
  };

  // Rotate handle pointer down
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const target = document.objects[selectedIds[0]];
    if (!target) return;

    const cx = target.x + target.width / 2;
    const cy = target.y + target.height / 2;

    setDragState({
      type: 'rotate',
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
      centerPoint: { x: cx, y: cy },
      initialSnapshots: {
        [target.id]: {
          x: target.x,
          y: target.y,
          width: target.width,
          height: target.height,
          rotation: target.rotation || 0,
        },
      },
    });
  };

  // Global PointerMove
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    if (dragState.type === 'pan') {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      setViewport(prev => ({
        ...prev,
        x: Math.round(prev.x + deltaX),
        y: Math.round(prev.y + deltaY),
      }));
      setDragState({
        ...dragState,
        startX: e.clientX,
        startY: e.clientY,
      });
      return;
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (dragState.type === 'marquee' || dragState.type === 'draw') {
      setDragState({
        ...dragState,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
      });
      return;
    }

    if (dragState.type === 'rotate' && dragState.centerPoint && selectedIds[0]) {
      const target = document.objects[selectedIds[0]];
      if (!target) return;

      const newRotation = calculateRotation(
        dragState.centerPoint.x,
        dragState.centerPoint.y,
        canvasPos.x,
        canvasPos.y,
        e.shiftKey
      );

      updateObjectsTransient({
        [target.id]: { rotation: newRotation },
      });
      return;
    }

    if (dragState.type === 'move' && dragState.initialSnapshots) {
      let deltaX = canvasPos.x - dragState.startX;
      let deltaY = canvasPos.y - dragState.startY;

      // Smart guides & grid snapping for single selection
      let guideLines: any[] = [];
      if (selectedIds.length === 1 && document.settings.snapToObjects) {
        const id = selectedIds[0];
        const init = dragState.initialSnapshots[id];
        if (init) {
          const rawBounds = {
            x: init.x + deltaX,
            y: init.y + deltaY,
            width: init.width,
            height: init.height,
          };

          // Collect other sibling objects
          const others = Object.values(document.objects)
            .filter(o => !dragState.initialSnapshots?.[o.id] && o.visible && o.parentId === document.objects[id]?.parentId)
            .map(o => ({ x: o.x, y: o.y, width: o.width, height: o.height }));

          const snapRes = computeSmartSnapping(rawBounds, others, 6);
          deltaX = snapRes.x - init.x;
          deltaY = snapRes.y - init.y;
          guideLines = snapRes.guides;
        }
      }

      if (document.settings.grid.snap) {
        deltaX = snapToGrid(deltaX, 0, document.settings.grid.size, true).x;
        deltaY = snapToGrid(0, deltaY, document.settings.grid.size, true).y;
      }

      setActiveGuides(guideLines);

      // Live update object positions transiently without polluting history
      const updates: Record<string, Partial<PixoraObject>> = {};
      for (const id of Object.keys(dragState.initialSnapshots)) {
        const init = dragState.initialSnapshots[id];
        if (init) {
          updates[id] = {
            x: Math.round(init.x + deltaX),
            y: Math.round(init.y + deltaY),
          };
        }
      }
      updateObjectsTransient(updates);
      return;
    }

    if (dragState.type === 'resize' && dragState.handle && dragState.initialSnapshots) {
      const deltaX = canvasPos.x - dragState.startX;
      const deltaY = canvasPos.y - dragState.startY;

      // Resize primary selected object
      const id = selectedIds[0];
      const init = dragState.initialSnapshots[id];
      if (init) {
        // Images: lock aspect ratio by default; Cmd (Mac) / Alt (Win) unlocks free scaling
        // All other objects: free by default; Shift locks aspect ratio
        const primaryObj = document.objects[id];
        const isImage = primaryObj?.type === 'image';
        const lockAspect = isImage ? !(e.metaKey || e.altKey) : e.shiftKey;

        const newBounds = calculateResize(
          dragState.handle,
          init,
          deltaX,
          deltaY,
          lockAspect
        );

        const updates: Record<string, Partial<PixoraObject>> = {
          [id]: {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.width,
            height: newBounds.height,
          },
        };

        // If the resized object has descendants in snapshots (e.g. group or frame), scale them
        const scaleX = init.width > 0 ? newBounds.width / init.width : 1;
        const scaleY = init.height > 0 ? newBounds.height / init.height : 1;

        for (const [snapId, snap] of Object.entries(dragState.initialSnapshots)) {
          if (snapId === id) continue;
          updates[snapId] = {
            x: Math.round(newBounds.x + (snap.x - init.x) * scaleX),
            y: Math.round(newBounds.y + (snap.y - init.y) * scaleY),
            width: Math.max(1, Math.round(snap.width * scaleX)),
            height: Math.max(1, Math.round(snap.height * scaleY)),
          };
        }

        updateObjectsTransient(updates);
      }
      return;
    }
  };

  // Pointer Up: Commit single history transaction, finalize drawing, or marquee select
  const handlePointerUp = () => {
    if (!dragState) return;

    setActiveGuides([]);

    if (dragState.type === 'move' || dragState.type === 'resize' || dragState.type === 'rotate') {
      if (dragState.initialSnapshots) {
        const nextSnapshots: Record<string, any> = {};
        for (const id of Object.keys(dragState.initialSnapshots)) {
          const current = document.objects[id];
          if (current) {
            nextSnapshots[id] = {
              x: current.x,
              y: current.y,
              width: current.width,
              height: current.height,
              rotation: current.rotation,
            };
          }
        }
        // Commit single atomic command to undo/redo history
        transformObjects(dragState.initialSnapshots, nextSnapshots, dragState.type);
      }
    } else if (dragState.type === 'marquee') {
      // Find all objects inside marquee box
      const minX = Math.min(dragState.startX, dragState.currentX);
      const minY = Math.min(dragState.startY, dragState.currentY);
      const maxX = Math.max(dragState.startX, dragState.currentX);
      const maxY = Math.max(dragState.startY, dragState.currentY);

      if (maxX - minX > 5 || maxY - minY > 5) {
        const enclosedIds: string[] = [];
        for (const obj of Object.values(document.objects)) {
          if (!obj.visible || obj.locked) continue;
          if (
            obj.x >= minX &&
            obj.y >= minY &&
            obj.x + obj.width <= maxX &&
            obj.y + obj.height <= maxY
          ) {
            enclosedIds.push(obj.id);
          }
        }
        setSelectedIds(enclosedIds);
      }
    } else if (dragState.type === 'draw' && dragState.drawShape) {
      const minX = Math.min(dragState.startX, dragState.currentX);
      const minY = Math.min(dragState.startY, dragState.currentY);
      const width = Math.max(20, Math.abs(dragState.currentX - dragState.startX));
      const height = Math.max(20, Math.abs(dragState.currentY - dragState.startY));

      let newObj: any = null;
      switch (dragState.drawShape) {
        case 'frame':
          newObj = createFrame(minX, minY, width, height);
          break;
        case 'rectangle':
          newObj = createRectangle(minX, minY, width, height);
          break;
        case 'ellipse':
          newObj = createEllipse(minX, minY, width, height);
          break;
        case 'line':
          newObj = createLine(minX, minY, width);
          break;
        case 'text':
          newObj = createText(minX, minY, 'New Text');
          break;
      }

      if (newObj) {
        addObject(newObj);
        setSelectedIds([newObj.id]);
        if (newObj.type === 'text') {
          setEditingTextId(newObj.id);
        }
      }
      setActiveTool('select');
    }

    setDragState(null);
  };

  // Touch gesture support: 2-finger pinch zoom and two-finger pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDist.current = dist;
      touchStartCenter.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current && touchStartCenter.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const scale = currentDist / touchStartDist.current;
      const newZoom = Math.min(5, Math.max(0.1, Number((viewport.zoom * scale).toFixed(3))));

      const deltaX = currentCenter.x - touchStartCenter.current.x;
      const deltaY = currentCenter.y - touchStartCenter.current.y;

      setViewport(prev => ({
        zoom: newZoom,
        x: Math.round(prev.x + deltaX),
        y: Math.round(prev.y + deltaY),
      }));

      touchStartDist.current = currentDist;
      touchStartCenter.current = currentCenter;
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    touchStartCenter.current = null;
  };

  // Calculate selection bounding box
  const selectedObjects = selectedIds.map(id => document.objects[id]).filter(Boolean);
  const selectionBounds = getBoundingBox(selectedObjects);
  const isSingleSelection = selectedObjects.length === 1;
  const singleRotation = isSingleSelection ? selectedObjects[0].rotation || 0 : 0;

  const cursorClass =
    activeTool === 'hand' || isSpacePressed.current
      ? dragState?.type === 'pan'
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : activeTool !== 'select'
      ? 'cursor-crosshair'
      : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${cursorClass}`}
      style={{ touchAction: 'none', backgroundColor: document.settings.canvasColor || '#121316' }}
      onWheel={handleWheel}
      onContextMenu={handleCanvasContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Infinite Dot Grid */}
      <CanvasGrid
        viewport={viewport}
        enabled={document.settings.grid.enabled}
        size={document.settings.grid.size}
      />

      {/* SVG Canvas World */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10, touchAction: 'none' }}
      >
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
          className="pointer-events-auto"
        >
          {/* Render Active Page Root Objects */}
          {activePage?.childIds.map(childId => {
            const obj = document.objects[childId];
            if (!obj) return null;
            return (
              <CanvasObject
                key={obj.id}
                object={obj}
                objects={document.objects}
                assets={document.assets}
                isSelected={selectedIds.includes(obj.id)}
                isHovered={hoveredId === obj.id}
                onSelect={handleObjectSelect}
                onObjectPointerDown={handleObjectPointerDown}
                onDoubleClick={handleObjectDoubleClick}
                onContextMenu={handleObjectContextMenu}
                zoom={viewport.zoom}
                editingTextId={editingTextId}
              />
            );
          })}

          {/* Selection Box overlay */}
          {selectionBounds && !editingTextId && (
            <SelectionBox
              bounds={selectionBounds}
              rotation={singleRotation}
              zoom={viewport.zoom}
              isSingleSelection={isSingleSelection}
              onHandlePointerDown={handleResizePointerDown}
              onRotatePointerDown={handleRotatePointerDown}
              onMovePointerDown={handleMovePointerDown}
              onContextMenu={e => {
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onDoubleClick={() => {
                if (selectedIds.length === 1 && document.objects[selectedIds[0]]?.type === 'text') {
                  setEditingTextId(selectedIds[0]);
                }
              }}
            />
          )}

          {/* Smart Alignment Guides */}
          <SmartGuides guides={activeGuides} zoom={viewport.zoom} />

          {/* Marquee Selection Drag Box */}
          <MarqueeOverlay dragState={dragState} zoom={viewport.zoom} />
        </g>
      </svg>

      {/* In-place Text Editing Overlay */}
      {editingTextId && document.objects[editingTextId]?.type === 'text' && (() => {
        const textObj = document.objects[editingTextId] as TextObject;
        return (
          <TextEditorOverlay
            key={textObj.id}
            object={textObj}
            viewport={viewport}
            onChangeLive={newText => {
              const updates: Partial<TextObject> = { text: newText };
              if (
                !textObj.name ||
                textObj.name === 'Text' ||
                textObj.name === 'New Text' ||
                textObj.name === textObj.text ||
                textObj.name === 'Double-click to edit'
              ) {
                updates.name = newText.slice(0, 50) || 'Text';
              }
              updateObjectsTransient({ [textObj.id]: updates });
            }}
            onCommit={newText => {
              const updates: Partial<TextObject> = { text: newText };
              if (
                !textObj.name ||
                textObj.name === 'Text' ||
                textObj.name === 'New Text' ||
                textObj.name === textObj.text ||
                textObj.name === 'Double-click to edit'
              ) {
                updates.name = newText.slice(0, 50) || 'Text';
              }
              updateObjectProperties(textObj.id, updates, 'Edit text');
            }}
            onClose={() => setEditingTextId(null)}
          />
        );
      })()}
    </div>
  );
};
