import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Tool, Viewport, DragState, SmartGuideLine, ContextMenuState } from '../types/editor';
import { PixoraObject } from '../types/document';
import { RectBounds } from '../utils/math';

interface EditorContextType {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  selectObject: (id: string, multiSelect?: boolean) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToFit: (bounds: RectBounds, containerWidth: number, containerHeight: number) => void;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  dragState: DragState | null;
  setDragState: (state: DragState | null) => void;
  activeGuides: SmartGuideLine[];
  setActiveGuides: (guides: SmartGuideLine[]) => void;
  clipboard: PixoraObject[] | null;
  setClipboard: (objs: PixoraObject[] | null) => void;
  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;
  mobileActiveTab: 'layers' | 'add' | 'properties' | null;
  setMobileActiveTab: (tab: 'layers' | 'add' | 'properties' | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 100, y: 100, zoom: 1 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGuides, setActiveGuides] = useState<SmartGuideLine[]>([]);
  const [clipboard, setClipboard] = useState<PixoraObject[] | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'layers' | 'add' | 'properties' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const selectObject = useCallback((id: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const zoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(5, Number((prev.zoom * 1.2).toFixed(2))),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Number((prev.zoom / 1.2).toFixed(2))),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  const zoomToFit = useCallback(
    (bounds: RectBounds, containerWidth: number, containerHeight: number) => {
      const padding = 60;
      const availableW = Math.max(100, containerWidth - padding * 2);
      const availableH = Math.max(100, containerHeight - padding * 2);

      const scaleX = availableW / bounds.width;
      const scaleY = availableH / bounds.height;
      const newZoom = Math.min(2, Math.max(0.1, Math.min(scaleX, scaleY)));

      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      const boundsCenterX = bounds.x + bounds.width / 2;
      const boundsCenterY = bounds.y + bounds.height / 2;

      setViewport({
        zoom: Number(newZoom.toFixed(2)),
        x: Math.round(centerX - boundsCenterX * newZoom),
        y: Math.round(centerY - boundsCenterY * newZoom),
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      selectedIds,
      setSelectedIds,
      selectObject,
      selectAll,
      clearSelection,
      hoveredId,
      setHoveredId,
      viewport,
      setViewport,
      zoomIn,
      zoomOut,
      resetZoom,
      zoomToFit,
      editingTextId,
      setEditingTextId,
      dragState,
      setDragState,
      activeGuides,
      setActiveGuides,
      clipboard,
      setClipboard,
      contextMenu,
      setContextMenu,
      mobileActiveTab,
      setMobileActiveTab,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isExportModalOpen,
      setIsExportModalOpen,
      isShortcutsModalOpen,
      setIsShortcutsModalOpen,
    }),
    [
      activeTool,
      selectedIds,
      hoveredId,
      viewport,
      editingTextId,
      dragState,
      activeGuides,
      clipboard,
      contextMenu,
      mobileActiveTab,
      isMobileMenuOpen,
      isExportModalOpen,
      isShortcutsModalOpen,
      selectObject,
      selectAll,
      clearSelection,
      zoomIn,
      zoomOut,
      resetZoom,
      zoomToFit,
    ]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

export function useOptionalEditor() {
  return useContext(EditorContext);
}
