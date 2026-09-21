import React, { useState } from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Group,
  Ungroup,
  Trash2,
} from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { LayerItem } from './LayerItem';
import { PagesPanel } from './PagesPanel';

export interface DragLayerState {
  draggingId: string | null;
  dragOverId: string | null;
  dragPosition: 'before' | 'after';
}

export const LayerTree: React.FC = () => {
  const {
    document,
    activePage,
    deleteObjects,
    reorderLayers,
    groupObjects,
    ungroupObject,
  } = useDocument();

  const { selectedIds, setSelectedIds, clearSelection } = useEditor();

  const [dragState, setDragState] = useState<DragLayerState>({
    draggingId: null,
    dragOverId: null,
    dragPosition: 'after',
  });

  const hasSelection = selectedIds.length > 0;
  const isSingleGroup =
    selectedIds.length === 1 && document.objects[selectedIds[0]]?.type === 'group';

  // Move layer forward in list (closer to top of stack)
  const handleMoveForward = () => {
    if (!hasSelection || !activePage) return;
    const targetId = selectedIds[0];
    const targetObj = document.objects[targetId];
    const parentId = targetObj?.parentId || null;
    const childList = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;
    const idx = childList.indexOf(targetId);
    if (idx < childList.length - 1) {
      const updated = [...childList];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      reorderLayers(activePage.id, parentId, childList, updated);
    }
  };

  // Move layer backward in list
  const handleMoveBackward = () => {
    if (!hasSelection || !activePage) return;
    const targetId = selectedIds[0];
    const targetObj = document.objects[targetId];
    const parentId = targetObj?.parentId || null;
    const childList = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;
    const idx = childList.indexOf(targetId);
    if (idx > 0) {
      const updated = [...childList];
      [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
      reorderLayers(activePage.id, parentId, childList, updated);
    }
  };

  const handleGroup = () => {
    const newGroupId = groupObjects(selectedIds);
    if (newGroupId) setSelectedIds([newGroupId]);
  };

  const handleUngroup = () => {
    if (isSingleGroup) {
      ungroupObject(selectedIds[0]);
      clearSelection();
    }
  };

  const handleDelete = () => {
    deleteObjects(selectedIds);
    clearSelection();
  };

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (id: string) => {
    setDragState(prev => ({ ...prev, draggingId: id }));
  };

  const handleDragOver = (id: string, position: 'before' | 'after') => {
    setDragState(prev => ({ ...prev, dragOverId: id, dragPosition: position }));
  };

  const handleDragEnd = () => {
    setDragState({ draggingId: null, dragOverId: null, dragPosition: 'after' });
  };

  const handleDrop = (targetId: string, position: 'before' | 'after') => {
    const { draggingId } = dragState;
    if (!draggingId || draggingId === targetId || !activePage) {
      handleDragEnd();
      return;
    }

    const sourceObj = document.objects[draggingId];
    const targetObj = document.objects[targetId];

    // Only allow reordering within the same parent
    if (sourceObj?.parentId !== targetObj?.parentId) {
      handleDragEnd();
      return;
    }

    const parentId = sourceObj?.parentId || null;
    const childList = parentId
      ? [...((document.objects[parentId] as any)?.childIds || [])]
      : [...activePage.childIds];

    const sourceIdx = childList.indexOf(draggingId);
    const targetIdx = childList.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) {
      handleDragEnd();
      return;
    }

    // Build updated order
    const updated = [...childList];
    updated.splice(sourceIdx, 1);

    // After removing source, find target's new index
    const newTargetIdx = updated.indexOf(targetId);

    // UI is reversed (top of panel = top of stack = high childList index).
    // 'before' in UI panel = place above target = higher z-order = higher array index
    // 'after'  in UI panel = place below target = lower z-order  = same as newTargetIdx
    const insertAt = position === 'before' ? newTargetIdx + 1 : newTargetIdx;
    updated.splice(insertAt, 0, draggingId);

    reorderLayers(activePage.id, parentId, childList, updated);
    handleDragEnd();
  };

  // Reversed childIds: top of stack rendered first in panel (Figma convention)
  const reversedChildren = [...(activePage?.childIds || [])].reverse();

  return (
    <aside className="w-60 bg-pixora-surface border-r border-pixora-border flex flex-col h-full select-none z-20 shrink-0">
      {/* Pages Section */}
      <PagesPanel />

      {/* Layers Header & Quick Actions */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        <div className="flex items-center space-x-1.5">
          <Layers size={14} className="text-pixora-text-dim" />
          <span>Layers</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          {hasSelection && (
            <>
              <button
                onClick={handleMoveForward}
                title="Bring Forward"
                className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={handleMoveBackward}
                title="Send Backward"
                className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
              >
                <ArrowDown size={13} />
              </button>
            </>
          )}

          {selectedIds.length > 1 && (
            <button
              onClick={handleGroup}
              title="Group Selection (Ctrl/Cmd+G)"
              className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
            >
              <Group size={13} />
            </button>
          )}

          {isSingleGroup && (
            <button
              onClick={handleUngroup}
              title="Ungroup (Ctrl/Cmd+Shift+G)"
              className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
            >
              <Ungroup size={13} />
            </button>
          )}

          {hasSelection && (
            <button
              onClick={handleDelete}
              title="Delete Selected (Delete/Backspace)"
              className="p-1 text-pixora-text-dim hover:text-pixora-danger hover:bg-pixora-hover rounded transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        {reversedChildren.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-xs text-pixora-text-dim px-4">
            <Layers size={24} className="mb-2 opacity-40" />
            <p>No layers on this page</p>
            <p className="text-[11px] mt-1 text-pixora-text-dim/70">
              Create a Frame, Shape, or Text from the toolbar above.
            </p>
          </div>
        ) : (
          reversedChildren.map(childId => {
            const child = document.objects[childId];
            if (!child) return null;
            return (
              <LayerItem
                key={child.id}
                object={child}
                dragState={dragState}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};
