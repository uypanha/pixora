import React, { useRef } from 'react';
import {
  MousePointer,
  Layout,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Hand,
} from 'lucide-react';
import { useEditor } from '../editor/editorContext';
import { useDocument } from '../document/documentContext';
import { Tool } from '../types/editor';
import { importImageFile } from '../import/imageImporter';

export const MobileFloatingTools: React.FC = () => {
  const { activeTool, setActiveTool, setSelectedIds } = useEditor();
  const { addObject } = useDocument();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { asset, imageObject } = await importImageFile(file, 100, 100);
      addObject(imageObject, null, asset);
      setSelectedIds([imageObject.id]);
      setActiveTool('select');
    } catch (err: any) {
      alert(err.message || 'Failed to import image.');
    }
    e.target.value = '';
  };

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer size={18} /> },
    { id: 'frame', label: 'Frame', icon: <Layout size={18} /> },
    { id: 'rectangle', label: 'Rect', icon: <Square size={18} /> },
    { id: 'ellipse', label: 'Circle', icon: <Circle size={18} /> },
    { id: 'text', label: 'Text', icon: <Type size={18} /> },
    { id: 'hand', label: 'Pan', icon: <Hand size={18} /> },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center bg-pixora-surface/90 backdrop-blur-md border border-pixora-border rounded-2xl p-1 shadow-pixora-lg max-w-[95vw] overflow-x-auto">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />

      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          title={tool.label}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all ${
            activeTool === tool.id
              ? 'bg-pixora-accent text-white shadow-sm'
              : 'text-pixora-text-muted hover:text-white'
          }`}
        >
          {tool.icon}
        </button>
      ))}

      <button
        onClick={() => imageInputRef.current?.click()}
        title="Import Image"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-pixora-text-muted hover:text-white rounded-xl transition-colors"
      >
        <ImageIcon size={18} />
      </button>
    </div>
  );
};
