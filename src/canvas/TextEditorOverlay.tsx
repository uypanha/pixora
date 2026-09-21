import React, { useEffect, useRef, useState } from 'react';
import { TextObject } from '../types/document';
import { Viewport } from '../types/editor';

interface TextEditorOverlayProps {
  object: TextObject;
  viewport: Viewport;
  onCommit: (text: string) => void;
  onClose: () => void;
}

export const TextEditorOverlay: React.FC<TextEditorOverlayProps> = ({
  object,
  viewport,
  onCommit,
  onClose,
}) => {
  const [content, setContent] = useState(object.text);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleBlur = () => {
    onCommit(content);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // prevent canvas shortcuts
    if (e.key === 'Escape') {
      onCommit(content);
      onClose();
    }
  };

  // Convert canvas object coordinates to screen coordinates
  const screenX = object.x * viewport.zoom + viewport.x;
  const screenY = object.y * viewport.zoom + viewport.y;
  const screenW = Math.max(object.width * viewport.zoom, 120);
  const fontSizePx = (object.fontSize || 16) * viewport.zoom;
  const lineHeight = object.lineHeight || 1.4;

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenW}px`,
        transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
        transformOrigin: 'top left',
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent resize-none outline-none border-2 border-pixora-selection rounded px-1 py-0 shadow-lg text-white"
        style={{
          fontFamily: object.fontFamily || 'Inter, sans-serif',
          fontSize: `${fontSizePx}px`,
          fontWeight: object.fontWeight || 400,
          lineHeight,
          color: object.color || '#ffffff',
          textAlign: object.textAlign || 'left',
          minHeight: `${fontSizePx * lineHeight * 1.5}px`,
        }}
        rows={Math.max(1, content.split('\n').length)}
      />
    </div>
  );
};
