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
import { collectMoveIds } from '../../utils/tree';
import { ObjectTransformSnapshot } from '../../types/editor';
import { PixoraObject } from '../../types/document';

export const AlignSection: React.FC = () => {
  const { document, transformObjects } = useDocument();
  const { selectedIds } = useEditor();

  if (selectedIds.length === 0) return null;

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selected = selectedIds.map(id => document.objects[id]).filter(Boolean);
    if (selected.length === 0) return;

    const prevSnapshots: Record<string, ObjectTransformSnapshot> = {};
    const nextSnapshots: Record<string, ObjectTransformSnapshot> = {};

    const shiftObjectAndDescendants = (rootObj: PixoraObject, targetX: number, targetY: number) => {
      const deltaX = targetX - rootObj.x;
      const deltaY = targetY - rootObj.y;
      const allIds = collectMoveIds([rootObj.id], document.objects);
      for (const id of allIds) {
        const o = document.objects[id];
        if (!o) continue;
        if (!prevSnapshots[id]) {
          prevSnapshots[id] = {
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            rotation: o.rotation,
          };
        }
        nextSnapshots[id] = {
          x: Math.round(o.x + deltaX),
          y: Math.round(o.y + deltaY),
          width: o.width,
          height: o.height,
          rotation: o.rotation,
        };
      }
    };

    if (selected.length === 1) {
      const obj = selected[0];
      const parent = obj.parentId ? document.objects[obj.parentId] : null;
      const refBox = parent
        ? { x: parent.x, y: parent.y, width: parent.width, height: parent.height }
        : { x: 0, y: 0, width: 800, height: 600 };

      let targetX = obj.x;
      let targetY = obj.y;

      switch (type) {
        case 'left':
          targetX = refBox.x;
          break;
        case 'center':
          targetX = refBox.x + (refBox.width - obj.width) / 2;
          break;
        case 'right':
          targetX = refBox.x + refBox.width - obj.width;
          break;
        case 'top':
          targetY = refBox.y;
          break;
        case 'middle':
          targetY = refBox.y + (refBox.height - obj.height) / 2;
          break;
        case 'bottom':
          targetY = refBox.y + refBox.height - obj.height;
          break;
      }

      shiftObjectAndDescendants(obj, targetX, targetY);
      transformObjects(prevSnapshots, nextSnapshots, 'move');
      return;
    }

    // Multi-selection alignment
    const bbox = getBoundingBox(selected);
    if (!bbox) return;

    for (const obj of selected) {
      let targetX = obj.x;
      let targetY = obj.y;

      switch (type) {
        case 'left':
          targetX = bbox.x;
          break;
        case 'center':
          targetX = bbox.x + (bbox.width - obj.width) / 2;
          break;
        case 'right':
          targetX = bbox.x + bbox.width - obj.width;
          break;
        case 'top':
          targetY = bbox.y;
          break;
        case 'middle':
          targetY = bbox.y + (bbox.height - obj.height) / 2;
          break;
        case 'bottom':
          targetY = bbox.y + bbox.height - obj.height;
          break;
      }

      shiftObjectAndDescendants(obj, targetX, targetY);
    }

    transformObjects(prevSnapshots, nextSnapshots, 'move');
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
