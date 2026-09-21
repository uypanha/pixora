import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Clipboard,
  Trash2,
  Group,
  Ungroup,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckSquare,
  Type,
} from 'lucide-react';
import { useDocument } from '../../document/documentContext';
import { useEditor } from '../../editor/editorContext';
import { generateId } from '../../utils/id';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl+';

export const ContextMenu: React.FC = () => {
  const {
    document,
    activePage,
    deleteObjects,
    addObject,
    updateObjectProperties,
    groupObjects,
    ungroupObject,
    reorderLayers,
  } = useDocument();

  const {
    contextMenu,
    setContextMenu,
    selectedIds,
    setSelectedIds,
    clearSelection,
    selectAll,
    clipboard,
    setClipboard,
    setEditingTextId,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useEditor();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!contextMenu) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      setContextMenu(null);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const targetId = contextMenu.targetId || (selectedIds.length > 0 ? selectedIds[0] : null);
  const targetObj = targetId ? document.objects[targetId] : null;
  const isSelectionActive = selectedIds.length > 0;
  const isGroup = targetObj?.type === 'group';
  const isLocked = targetObj?.locked ?? false;
  const isVisible = targetObj?.visible ?? true;

  // Duplicate
  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const newIds: string[] = [];
    for (const id of selectedIds) {
      const orig = document.objects[id];
      if (orig) {
        const newObj = {
          ...orig,
          id: generateId(orig.type),
          name: `${orig.name} (Copy)`,
          x: orig.x + 20,
          y: orig.y + 20,
        };
        addObject(newObj, orig.parentId);
        newIds.push(newObj.id);
      }
    }
    setSelectedIds(newIds);
    setContextMenu(null);
  };

  // Copy
  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    const toCopy = selectedIds.map(id => document.objects[id]).filter(Boolean);
    setClipboard(toCopy);
    setContextMenu(null);
  };

  // Paste
  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;
    const newIds: string[] = [];
    for (const item of clipboard) {
      const newObj = {
        ...item,
        id: generateId(item.type),
        name: `${item.name} (Copy)`,
        x: item.x + 20,
        y: item.y + 20,
      };
      addObject(newObj, item.parentId);
      newIds.push(newObj.id);
    }
    setSelectedIds(newIds);
    setContextMenu(null);
  };

  // Delete
  const handleDelete = () => {
    if (selectedIds.length > 0) {
      deleteObjects(selectedIds);
      clearSelection();
    }
    setContextMenu(null);
  };

  // Layer Ordering
  const handleBringForward = () => {
    if (!targetId || !activePage) return;
    const parentId = targetObj?.parentId || null;
    const childList: string[] = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const idx = childList.indexOf(targetId);
    if (idx < childList.length - 1) {
      const updated = [...childList];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      reorderLayers(activePage.id, parentId, childList, updated);
    }
    setContextMenu(null);
  };

  const handleBringToFront = () => {
    if (!targetId || !activePage) return;
    const parentId = targetObj?.parentId || null;
    const childList: string[] = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const idx = childList.indexOf(targetId);
    if (idx < childList.length - 1) {
      const filtered = childList.filter(id => id !== targetId);
      filtered.push(targetId);
      reorderLayers(activePage.id, parentId, childList, filtered);
    }
    setContextMenu(null);
  };

  const handleSendBackward = () => {
    if (!targetId || !activePage) return;
    const parentId = targetObj?.parentId || null;
    const childList: string[] = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const idx = childList.indexOf(targetId);
    if (idx > 0) {
      const updated = [...childList];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      reorderLayers(activePage.id, parentId, childList, updated);
    }
    setContextMenu(null);
  };

  const handleSendToBack = () => {
    if (!targetId || !activePage) return;
    const parentId = targetObj?.parentId || null;
    const childList: string[] = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const idx = childList.indexOf(targetId);
    if (idx > 0) {
      const filtered = childList.filter(id => id !== targetId);
      filtered.unshift(targetId);
      reorderLayers(activePage.id, parentId, childList, filtered);
    }
    setContextMenu(null);
  };

  // Group / Ungroup
  const handleGroup = () => {
    if (selectedIds.length > 1) {
      const gid = groupObjects(selectedIds);
      if (gid) setSelectedIds([gid]);
    }
    setContextMenu(null);
  };

  const handleUngroup = () => {
    if (targetId && isGroup) {
      ungroupObject(targetId);
      clearSelection();
    }
    setContextMenu(null);
  };

  // Lock / Unlock
  const handleToggleLock = () => {
    if (selectedIds.length > 0) {
      const newLocked = !isLocked;
      for (const id of selectedIds) {
        updateObjectProperties(id, { locked: newLocked }, newLocked ? 'Lock layer' : 'Unlock layer');
      }
    }
    setContextMenu(null);
  };

  // Hide / Show
  const handleToggleVisibility = () => {
    if (selectedIds.length > 0) {
      const newVisible = !isVisible;
      for (const id of selectedIds) {
        updateObjectProperties(id, { visible: newVisible }, newVisible ? 'Show layer' : 'Hide layer');
      }
    }
    setContextMenu(null);
  };

  // Select all canvas objects
  const handleSelectAll = () => {
    if (activePage) {
      selectAll(activePage.childIds);
    }
    setContextMenu(null);
  };

  // Clamping coordinates so menu stays visible
  const menuWidth = 230;
  const menuHeight = isSelectionActive ? 390 : 180;
  const posX = Math.max(8, Math.min(contextMenu.x, window.innerWidth - menuWidth - 8));
  const posY = Math.max(8, Math.min(contextMenu.y, window.innerHeight - menuHeight - 8));

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context Menu"
      style={{ left: posX, top: posY }}
      className="fixed z-50 w-56 bg-pixora-surface/95 backdrop-blur-md border border-pixora-border rounded-lg shadow-2xl py-1 text-xs text-pixora-text select-none animate-in fade-in duration-100"
      onContextMenu={e => e.preventDefault()}
    >
      {isSelectionActive ? (
        <>
          {/* Header Info */}
          <div className="px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-pixora-text-dim border-b border-pixora-border/60 mb-1 truncate">
            {selectedIds.length > 1
              ? `${selectedIds.length} objects selected`
              : targetObj?.name || 'Layer Options'}
          </div>

          {/* Edit Text (if text object) */}
          {targetObj?.type === 'text' && (
            <button
              onClick={() => {
                setEditingTextId(targetObj.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Type size={13} />
                <span>Edit Text</span>
              </div>
              <span className="text-[11px] opacity-60">Enter</span>
            </button>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Copy size={13} />
              <span>Copy</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}C</span>
          </button>

          {/* Paste */}
          <button
            onClick={handlePaste}
            disabled={!clipboard || clipboard.length === 0}
            className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors ${
              clipboard && clipboard.length > 0
                ? 'hover:bg-pixora-selection hover:text-white'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clipboard size={13} />
              <span>Paste</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}V</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Copy size={13} className="opacity-70" />
              <span>Duplicate</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}D</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-between px-3 py-1.5 text-pixora-danger hover:bg-pixora-danger hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Trash2 size={13} />
              <span>Delete</span>
            </div>
            <span className="text-[11px] opacity-60">Del</span>
          </button>

          <div className="h-[1px] bg-pixora-border/60 my-1" />

          {/* Bring Forward */}
          <button
            onClick={handleBringForward}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ChevronUp size={13} />
              <span>Bring Forward</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}]</span>
          </button>

          {/* Bring to Front */}
          <button
            onClick={handleBringToFront}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ChevronsUp size={13} />
              <span>Bring to Front</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}⇧]</span>
          </button>

          {/* Send Backward */}
          <button
            onClick={handleSendBackward}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ChevronDown size={13} />
              <span>Send Backward</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}[</span>
          </button>

          {/* Send to Back */}
          <button
            onClick={handleSendToBack}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ChevronsDown size={13} />
              <span>Send to Back</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}⇧[</span>
          </button>

          <div className="h-[1px] bg-pixora-border/60 my-1" />

          {/* Group / Ungroup */}
          {selectedIds.length > 1 && (
            <button
              onClick={handleGroup}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Group size={13} />
                <span>Group Selection</span>
              </div>
              <span className="text-[11px] opacity-60">{mod}G</span>
            </button>
          )}

          {isGroup && (
            <button
              onClick={handleUngroup}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Ungroup size={13} />
                <span>Ungroup</span>
              </div>
              <span className="text-[11px] opacity-60">{mod}⇧G</span>
            </button>
          )}

          {/* Lock / Unlock */}
          <button
            onClick={handleToggleLock}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
              <span>{isLocked ? 'Unlock' : 'Lock'}</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}L</span>
          </button>

          {/* Hide / Show */}
          <button
            onClick={handleToggleVisibility}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{isVisible ? 'Hide' : 'Show'}</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}⇧H</span>
          </button>
        </>
      ) : (
        /* Empty canvas background menu */
        <>
          <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider text-pixora-text-dim border-b border-pixora-border/60 mb-1">
            Canvas Options
          </div>

          {/* Paste */}
          <button
            onClick={handlePaste}
            disabled={!clipboard || clipboard.length === 0}
            className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors ${
              clipboard && clipboard.length > 0
                ? 'hover:bg-pixora-selection hover:text-white'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clipboard size={13} />
              <span>Paste</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}V</span>
          </button>

          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <CheckSquare size={13} />
              <span>Select All</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}A</span>
          </button>

          <div className="h-[1px] bg-pixora-border/60 my-1" />

          {/* Zoom controls */}
          <button
            onClick={() => {
              zoomIn();
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ZoomIn size={13} />
              <span>Zoom In</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}+</span>
          </button>

          <button
            onClick={() => {
              zoomOut();
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <ZoomOut size={13} />
              <span>Zoom Out</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}-</span>
          </button>

          <button
            onClick={() => {
              resetZoom();
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-pixora-selection hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Maximize2 size={13} />
              <span>Reset Zoom</span>
            </div>
            <span className="text-[11px] opacity-60">{mod}0</span>
          </button>
        </>
      )}
    </div>
  );
};
