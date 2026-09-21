import React, { useEffect, useRef, useState } from 'react';
import { TextObject } from '../types/document';
import { Viewport } from '../types/editor';

interface TextEditorOverlayProps {
  object: TextObject;
  viewport: Viewport;
  onCommit: (text: string) => void;
  onChangeLive?: (text: string) => void;
  onClose: () => void;
}

export const TextEditorOverlay: React.FC<TextEditorOverlayProps> = ({
  object,
  viewport,
  onCommit,
  onChangeLive,
  onClose,
}) => {
  const [content, setContent] = useState(object.text);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Keep live refs so cleanup always has latest callback and content
  const contentRef = useRef(object.text);
  const onCommitRef = useRef(onCommit);
  const onChangeLiveRef = useRef(onChangeLive);
  const committedRef = useRef(false);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onChangeLiveRef.current = onChangeLive;
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
    // Commit on unmount if not already committed (handles parent-driven close e.g. clicking canvas)
    return () => {
      if (!committedRef.current) {
        committedRef.current = true;
        const finalVal = textareaRef.current ? textareaRef.current.value : contentRef.current;
        onCommitRef.current(finalVal);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    contentRef.current = val;
    onChangeLiveRef.current?.(val);
  };

  const handleBlur = () => {
    if (!committedRef.current) {
      committedRef.current = true;
      const finalVal = textareaRef.current ? textareaRef.current.value : contentRef.current;
      onCommitRef.current(finalVal);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // prevent canvas shortcuts
    if (e.key === 'Escape') {
      // Cancel: close without committing changes
      committedRef.current = true;
      onClose();
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl+Enter: commit & close
      e.preventDefault();
      if (!committedRef.current) {
        committedRef.current = true;
        const finalVal = textareaRef.current ? textareaRef.current.value : contentRef.current;
        onCommitRef.current(finalVal);
        onClose();
      }
      return;
    }
  };

  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
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
      onPointerDown={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
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
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        className="w-full bg-transparent resize-none outline-none border-2 border-pixora-selection rounded px-1 py-0 shadow-lg text-white"
        style={{
          fontFamily: object.fontFamily ? `'${object.fontFamily}', sans-serif` : 'Inter, sans-serif',
          fontSize: `${fontSizePx}px`,
          fontWeight: object.fontWeight || 400,
          lineHeight,
          letterSpacing: object.letterSpacing ? `${object.letterSpacing * viewport.zoom}px` : undefined,
          color: object.color || '#ffffff',
          textAlign: object.textAlign || 'left',
          minHeight: `${fontSizePx * lineHeight * 1.5}px`,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        rows={Math.max(1, content.split('\n').length)}
      />
    </div>
  );
};
