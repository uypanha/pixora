import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { useDocument } from '../../document/documentContext';
import { useEditor } from '../../editor/editorContext';
import { getBoundingBox } from '../../utils/math';

export const AlignSection: React.FC = () => {
  const { document, updateObjectProperties } = useDocument();
  const { selectedIds } = useEditor();

  if (selectedIds.length === 0) return null;

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selected = selectedIds.map(id => document.objects[id]).filter(Boolean);
    if (selected.length === 0) return;

    if (selected.length === 1) {
      const obj = selected[0];
      const parent = obj.parentId ? document.objects[obj.parentId] : null;
      const refBox = parent
        ? { x: parent.x, y: parent.y, width: parent.width, height: parent.height }
        : { x: 0, y: 0, width: 800, height: 600 };

      switch (type) {
        case 'left':
          updateObjectProperties(obj.id, { x: refBox.x }, 'Align left');
          break;
        case 'center':
          updateObjectProperties(obj.id, { x: refBox.x + (refBox.width - obj.width) / 2 }, 'Align center');
          break;
        case 'right':
          updateObjectProperties(obj.id, { x: refBox.x + refBox.width - obj.width }, 'Align right');
          break;
        case 'top':
          updateObjectProperties(obj.id, { y: refBox.y }, 'Align top');
          break;
        case 'middle':
          updateObjectProperties(obj.id, { y: refBox.y + (refBox.height - obj.height) / 2 }, 'Align middle');
          break;
        case 'bottom':
          updateObjectProperties(obj.id, { y: refBox.y + refBox.height - obj.height }, 'Align bottom');
          break;
      }
      return;
    }

    // Multi-selection alignment
    const bbox = getBoundingBox(selected);
    if (!bbox) return;

    for (const obj of selected) {
      switch (type) {
        case 'left':
          updateObjectProperties(obj.id, { x: bbox.x }, 'Align left');
          break;
        case 'center':
          updateObjectProperties(obj.id, { x: bbox.x + (bbox.width - obj.width) / 2 }, 'Align center');
          break;
        case 'right':
          updateObjectProperties(obj.id, { x: bbox.x + bbox.width - obj.width }, 'Align right');
          break;
        case 'top':
          updateObjectProperties(obj.id, { y: bbox.y }, 'Align top');
          break;
        case 'middle':
          updateObjectProperties(obj.id, { y: bbox.y + (bbox.height - obj.height) / 2 }, 'Align middle');
          break;
        case 'bottom':
          updateObjectProperties(obj.id, { y: bbox.y + bbox.height - obj.height }, 'Align bottom');
          break;
      }
    }
  };

  return (
    <div className="border-b border-pixora-border p-3">
      <div className="flex items-center justify-between bg-pixora-elevated p-1 rounded-lg border border-pixora-border">
        <button
          onClick={() => handleAlign('left')}
          title="Align Left"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignLeft size={15} />
        </button>
        <button
          onClick={() => handleAlign('center')}
          title="Align Horizontal Center"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignCenter size={15} />
        </button>
        <button
          onClick={() => handleAlign('right')}
          title="Align Right"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignRight size={15} />
        </button>
        <div className="w-[1px] h-4 bg-pixora-border" />
        <button
          onClick={() => handleAlign('top')}
          title="Align Top"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignVerticalJustifyStart size={15} />
        </button>
        <button
          onClick={() => handleAlign('middle')}
          title="Align Vertical Center"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignVerticalJustifyCenter size={15} />
        </button>
        <button
          onClick={() => handleAlign('bottom')}
          title="Align Bottom"
          className="p-1.5 hover:text-white hover:bg-pixora-hover rounded text-pixora-text-muted transition-colors"
        >
          <AlignVerticalJustifyEnd size={15} />
        </button>
      </div>
    </div>
  );
};
