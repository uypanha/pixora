import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  ChevronDown,
  ChevronRight,
  Square,
  Circle,
  Minus,
  Type,
  Image as ImageIcon,
  Layout,
  Folder,
} from 'lucide-react';
import { PixoraObject } from '../types/document';
import { useDocument } from '../document/documentContext';
import { useEditor } from '../editor/editorContext';

interface LayerItemProps {
  object: PixoraObject;
  depth?: number;
}

export const LayerItem: React.FC<LayerItemProps> = ({ object, depth = 0 }) => {
  const { document, updateObjectProperties } = useDocument();
  const { selectedIds, selectObject, hoveredId, setHoveredId } = useEditor();

  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(object.name);

  const isSelected = selectedIds.includes(object.id);
  const isHovered = hoveredId === object.id;

  const hasChildren =
    (object.type === 'frame' || object.type === 'group') &&
    (object as any).childIds?.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectObject(object.id, e.shiftKey || e.metaKey || e.ctrlKey);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObjectProperties(
      object.id,
      { visible: !object.visible },
      object.visible ? 'Hide layer' : 'Show layer'
    );
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateObjectProperties(
      object.id,
      { locked: !object.locked },
      object.locked ? 'Unlock layer' : 'Lock layer'
    );
  };

  const handleFinishRename = () => {
    if (name.trim()) {
      updateObjectProperties(object.id, { name: name.trim() }, 'Rename layer');
    }
    setIsRenaming(false);
  };

  const getIcon = () => {
    switch (object.type) {
      case 'frame':
        return <Layout size={13} className="text-purple-400" />;
      case 'rectangle':
        return <Square size={13} className="text-indigo-400" />;
      case 'ellipse':
        return <Circle size={13} className="text-sky-400" />;
      case 'line':
        return <Minus size={13} className="text-amber-400" />;
      case 'text':
        return <Type size={13} className="text-emerald-400" />;
      case 'image':
        return <ImageIcon size={13} className="text-pink-400" />;
      case 'group':
        return <Folder size={13} className="text-yellow-400" />;
      default:
        return <Square size={13} />;
    }
  };

  return (
    <div>
      <div
        onClick={handleSelect}
        onMouseEnter={() => setHoveredId(object.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 text-xs rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-pixora-accent/20 text-white font-medium border border-pixora-selection/30'
            : isHovered
            ? 'bg-pixora-hover text-white'
            : 'text-pixora-text-muted hover:text-white hover:bg-pixora-hover'
        }`}
      >
        <div className="flex items-center space-x-1.5 truncate flex-1 mr-1">
          {/* Chevron for expandable nodes */}
          {hasChildren ? (
            <button
              onClick={e => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5 hover:text-white transition-colors"
            >
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {/* Type Icon */}
          {getIcon()}

          {/* Label or Rename Input */}
          {isRenaming ? (
            <input
              type="text"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="bg-pixora-surface border border-pixora-selection text-white px-1 py-0.5 rounded outline-none w-full"
            />
          ) : (
            <span
              onDoubleClick={e => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              className="truncate select-none"
              title="Double click to rename"
            >
              {object.name}
            </span>
          )}
        </div>

        {/* Lock and Visibility Toggles */}
        <div className="flex items-center space-x-1">
          {object.locked && (
            <button
              onClick={handleToggleLock}
              title="Unlock Layer"
              className="p-0.5 text-amber-400 hover:text-white"
            >
              <Lock size={12} />
            </button>
          )}

          <button
            onClick={handleToggleVisibility}
            title={object.visible ? 'Hide Layer' : 'Show Layer'}
            className={`p-0.5 transition-colors ${
              object.visible
                ? 'opacity-0 group-hover:opacity-100 text-pixora-text-dim hover:text-white'
                : 'text-pixora-text-dim hover:text-white opacity-100'
            }`}
          >
            {object.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>

      {/* Render children if frame or group */}
      {hasChildren && isOpen && (
        <div className="space-y-0.5">
          {(object as any).childIds.map((childId: string) => {
            const child = document.objects[childId];
            if (!child) return null;
            return <LayerItem key={child.id} object={child} depth={depth + 1} />;
          })}
        </div>
      )}
    </div>
  );
};
