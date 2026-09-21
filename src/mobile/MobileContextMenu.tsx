import React from 'react';
import { Copy, Trash2, Group, Ungroup, ArrowUp, ArrowDown, Lock, Unlock, X } from 'lucide-react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { generateId } from '../utils/id';

interface MobileContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const MobileContextMenu: React.FC<MobileContextMenuProps> = ({
  isOpen,
  onClose,
}) => {
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

  const { selectedIds, setSelectedIds, clearSelection } = useEditor();

  if (!isOpen || selectedIds.length === 0) return null;

  const targetId = selectedIds[0];
  const targetObj = document.objects[targetId];
  if (!targetObj) return null;

  const handleDuplicate = () => {
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
        setSelectedIds([newObj.id]);
      }
    }
    onClose();
  };

  const handleDelete = () => {
    deleteObjects(selectedIds);
    clearSelection();
    onClose();
  };

  const handleToggleLock = () => {
    updateObjectProperties(
      targetObj.id,
      { locked: !targetObj.locked },
      targetObj.locked ? 'Unlock' : 'Lock'
    );
    onClose();
  };

  const handleBringToFront = () => {
    const parentId = targetObj.parentId || null;
    const childList = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const filtered = childList.filter((id: string) => id !== targetId);
    filtered.push(targetId);
    reorderLayers(activePage.id, parentId, childList, filtered);
    onClose();
  };

  const handleSendToBack = () => {
    const parentId = targetObj.parentId || null;
    const childList = parentId
      ? (document.objects[parentId] as any)?.childIds || []
      : activePage.childIds;

    const filtered = childList.filter((id: string) => id !== targetId);
    filtered.unshift(targetId);
    reorderLayers(activePage.id, parentId, childList, filtered);
    onClose();
  };

  const isGroup = targetObj.type === 'group';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 select-none">
      <div className="bg-pixora-surface border border-pixora-border rounded-xl shadow-pixora-modal w-full max-w-xs overflow-hidden text-xs animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-pixora-border bg-pixora-elevated">
          <span className="font-semibold text-white truncate">{targetObj.name}</span>
          <button onClick={onClose} className="p-1 text-pixora-text-muted hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
          >
            <Copy size={15} className="text-sky-400" />
            <span>Duplicate</span>
          </button>

          {selectedIds.length > 1 && (
            <button
              onClick={() => {
                const gid = groupObjects(selectedIds);
                if (gid) setSelectedIds([gid]);
                onClose();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
            >
              <Group size={15} className="text-purple-400" />
              <span>Group Selection</span>
            </button>
          )}

          {isGroup && (
            <button
              onClick={() => {
                ungroupObject(targetId);
                clearSelection();
                onClose();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
            >
              <Ungroup size={15} className="text-purple-400" />
              <span>Ungroup</span>
            </button>
          )}

          <button
            onClick={handleBringToFront}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
          >
            <ArrowUp size={15} className="text-indigo-400" />
            <span>Bring to Front</span>
          </button>

          <button
            onClick={handleSendToBack}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
          >
            <ArrowDown size={15} className="text-indigo-400" />
            <span>Send to Back</span>
          </button>

          <button
            onClick={handleToggleLock}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-text hover:bg-pixora-hover rounded-lg transition-colors"
          >
            {targetObj.locked ? (
              <>
                <Unlock size={15} className="text-amber-400" />
                <span>Unlock Object</span>
              </>
            ) : (
              <>
                <Lock size={15} className="text-amber-400" />
                <span>Lock Object</span>
              </>
            )}
          </button>

          <div className="h-[1px] bg-pixora-border my-1" />

          <button
            onClick={handleDelete}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-pixora-danger hover:bg-pixora-danger/10 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
