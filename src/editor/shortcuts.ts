import { useEffect } from 'react';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';
import { savePixoraFile } from '../export/pixoraExporter';
import { generateId } from '../utils/id';

export function useKeyboardShortcuts(onOpenFilePicker: () => void) {
  const {
    document,
    activePage,
    deleteObjects,
    addObject,
    canUndo,
    canRedo,
    undo,
    redo,
    groupObjects,
    ungroupObject,
    reorderLayers,
  } = useDocument();

  const {
    setActiveTool,
    selectedIds,
    setSelectedIds,
    clearSelection,
    editingTextId,
    setEditingTextId,
    clipboard,
    setClipboard,
    contextMenu,
    setContextMenu,
  } = useEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when user is typing in text input, textarea, or editing canvas text
      const target = e.target as HTMLElement;
      if (
        editingTextId ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo / Redo
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Save
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        savePixoraFile(document);
        return;
      }

      // Open
      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        onOpenFilePicker();
        return;
      }

      // Copy
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        if (selectedIds.length > 0) {
          const toCopy = selectedIds.map(id => document.objects[id]).filter(Boolean);
          setClipboard(toCopy);
        }
        return;
      }

      // Paste
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        if (clipboard && clipboard.length > 0) {
          e.preventDefault();
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
        }
        return;
      }

      // Duplicate
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const newIds: string[] = [];
          for (const id of selectedIds) {
            const item = document.objects[id];
            if (item) {
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
          }
          setSelectedIds(newIds);
        }
        return;
      }

      // Group / Ungroup
      if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ungroup
          if (selectedIds.length === 1 && document.objects[selectedIds[0]]?.type === 'group') {
            ungroupObject(selectedIds[0]);
            clearSelection();
          }
        } else {
          // Group
          if (selectedIds.length > 1) {
            const gid = groupObjects(selectedIds);
            if (gid) setSelectedIds([gid]);
          }
        }
        return;
      }

      // Layer Ordering: Bring Forward / To Front (Cmd+] / Cmd+Shift+])
      if (isCmdOrCtrl && e.key === ']') {
        if (selectedIds.length > 0 && activePage) {
          e.preventDefault();
          const targetId = selectedIds[0];
          const targetObj = document.objects[targetId];
          const parentId = targetObj?.parentId || null;
          const childList: string[] = parentId
            ? (document.objects[parentId] as any)?.childIds || []
            : activePage.childIds;
          const idx = childList.indexOf(targetId);
          if (idx < childList.length - 1) {
            if (e.shiftKey) {
              const filtered = childList.filter(id => id !== targetId);
              filtered.push(targetId);
              reorderLayers(activePage.id, parentId, childList, filtered);
            } else {
              const updated = [...childList];
              const temp = updated[idx];
              updated[idx] = updated[idx + 1];
              updated[idx + 1] = temp;
              reorderLayers(activePage.id, parentId, childList, updated);
            }
          }
        }
        return;
      }

      // Layer Ordering: Send Backward / To Back (Cmd+[ / Cmd+Shift+[)
      if (isCmdOrCtrl && e.key === '[') {
        if (selectedIds.length > 0 && activePage) {
          e.preventDefault();
          const targetId = selectedIds[0];
          const targetObj = document.objects[targetId];
          const parentId = targetObj?.parentId || null;
          const childList: string[] = parentId
            ? (document.objects[parentId] as any)?.childIds || []
            : activePage.childIds;
          const idx = childList.indexOf(targetId);
          if (idx > 0) {
            if (e.shiftKey) {
              const filtered = childList.filter(id => id !== targetId);
              filtered.unshift(targetId);
              reorderLayers(activePage.id, parentId, childList, filtered);
            } else {
              const updated = [...childList];
              const temp = updated[idx];
              updated[idx] = updated[idx - 1];
              updated[idx - 1] = temp;
              reorderLayers(activePage.id, parentId, childList, updated);
            }
          }
        }
        return;
      }

      // Enter: Edit text if single text object is selected
      if (e.key === 'Enter') {
        if (selectedIds.length === 1 && document.objects[selectedIds[0]]?.type === 'text') {
          e.preventDefault();
          setEditingTextId(selectedIds[0]);
          return;
        }
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteObjects(selectedIds);
          clearSelection();
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
          return;
        }
        clearSelection();
        setActiveTool('select');
        return;
      }

      // Single-key Tool switches
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'f':
          setActiveTool('frame');
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'o':
          setActiveTool('ellipse');
          break;
        case 'l':
          setActiveTool('line');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'h':
          setActiveTool('hand');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    document,
    activePage,
    selectedIds,
    editingTextId,
    clipboard,
    contextMenu,
    canUndo,
    canRedo,
    undo,
    redo,
    deleteObjects,
    addObject,
    groupObjects,
    ungroupObject,
    reorderLayers,
    setSelectedIds,
    clearSelection,
    setActiveTool,
    setClipboard,
    setContextMenu,
    onOpenFilePicker,
  ]);
}
