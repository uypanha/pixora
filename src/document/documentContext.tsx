import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import {
  PixoraDocument,
  PixoraObject,
  Page,
  PixoraAsset,
  DocumentSettings,
  DocumentMetadata,
  GroupObject,
} from '../types/document';
import { ObjectTransformSnapshot } from '../types/editor';
import { HistoryManager } from '../history/historyManager';
import {
  AddObjectCommand,
  DeleteObjectsCommand,
  TransformObjectsCommand,
  UpdatePropertyCommand,
  ReorderLayerCommand,
  GroupObjectsCommand,
  UngroupCommand,
} from '../history/commands';
import { createDefaultProject } from './defaultProject';
import { generateId } from '../utils/id';
import { getBoundingBox } from '../utils/math';
import { registerFontAsset } from '../utils/fontLoader';

interface DocumentContextType {
  document: PixoraDocument;
  activePageId: string;
  setActivePageId: (id: string) => void;
  activePage: Page;
  canUndo: boolean;
  canRedo: boolean;
  setDocument: (doc: PixoraDocument, resetHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  addObject: (object: PixoraObject, parentId?: string | null, asset?: PixoraAsset) => void;
  addImageAsset: (asset: PixoraAsset, object: PixoraObject, parentId?: string | null) => void;
  deleteObjects: (objectIds: string[]) => void;
  transformObjects: (
    prevSnapshots: Record<string, ObjectTransformSnapshot>,
    nextSnapshots: Record<string, ObjectTransformSnapshot>,
    type?: 'move' | 'resize' | 'rotate'
  ) => void;
  updateObjectProperties: (
    id: string,
    props: Partial<PixoraObject>,
    description?: string,
    asset?: PixoraAsset
  ) => void;
  updateObjectsTransient: (updates: Record<string, Partial<PixoraObject>>) => void;
  reorderLayers: (
    pageId: string,
    parentId: string | null,
    prevChildIds: string[],
    nextChildIds: string[]
  ) => void;
  groupObjects: (objectIds: string[]) => string | null;
  ungroupObject: (groupId: string) => void;
  addPage: (name?: string) => string;
  renamePage: (pageId: string, name: string) => void;
  duplicatePage: (pageId: string) => string;
  deletePage: (pageId: string) => void;
  addAsset: (asset: PixoraAsset) => void;
  updateSettings: (settings: Partial<DocumentSettings>) => void;
  updateMetadata: (meta: Partial<DocumentMetadata>) => void;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export function DocumentProvider({
  initialDocument,
  children,
}: {
  initialDocument?: PixoraDocument;
  children: React.ReactNode;
}) {
  const [document, setDocumentState] = useState<PixoraDocument>(
    () => initialDocument || createDefaultProject()
  );
  const documentRef = useRef<PixoraDocument>(document);
  documentRef.current = document;

  const [activePageId, setActivePageId] = useState<string>(
    () => document.pages[0]?.id || 'page_1'
  );

  const historyRef = useRef<HistoryManager>(new HistoryManager(50));
  const [historyVersion, setHistoryVersion] = useState(0);

  const setDocument = useCallback((newDoc: PixoraDocument, resetHistory = true) => {
    documentRef.current = newDoc;
    setDocumentState(newDoc);
    if (resetHistory) {
      historyRef.current.clear();
      setHistoryVersion(v => v + 1);
    }
    if (!newDoc.pages.some(p => p.id === activePageId)) {
      setActivePageId(newDoc.pages[0]?.id || '');
    }
    if (newDoc.assets) {
      Object.values(newDoc.assets).forEach(asset => {
        if (asset.type === 'font') {
          registerFontAsset(asset);
        }
      });
    }
  }, [activePageId]);

  const undo = useCallback(() => {
    const updated = historyRef.current.undo(documentRef.current);
    if (updated) {
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    }
  }, []);

  const redo = useCallback(() => {
    const updated = historyRef.current.redo(documentRef.current);
    if (updated) {
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    }
  }, []);

  const addObject = useCallback(
    (object: PixoraObject, parentId?: string | null, asset?: PixoraAsset) => {
      const cmd = new AddObjectCommand(object, activePageId, parentId, asset);
      const updated = historyRef.current.execute(cmd, documentRef.current);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    [activePageId]
  );

  const addImageAsset = useCallback(
    (asset: PixoraAsset, object: PixoraObject, parentId?: string | null) => {
      addObject(object, parentId, asset);
    },
    [addObject]
  );

  const deleteObjects = useCallback(
    (objectIds: string[]) => {
      if (objectIds.length === 0) return;
      const cmd = new DeleteObjectsCommand(objectIds, documentRef.current);
      const updated = historyRef.current.execute(cmd, documentRef.current);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    []
  );

  const transformObjects = useCallback(
    (
      prevSnapshots: Record<string, ObjectTransformSnapshot>,
      nextSnapshots: Record<string, ObjectTransformSnapshot>,
      type: 'move' | 'resize' | 'rotate' = 'move'
    ) => {
      if (Object.keys(nextSnapshots).length === 0) return;
      const cmd = new TransformObjectsCommand(prevSnapshots, nextSnapshots, type);
      const updated = historyRef.current.execute(cmd, documentRef.current);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    []
  );

  const updateObjectProperties = useCallback(
    (
      id: string,
      props: Partial<PixoraObject>,
      description?: string,
      asset?: PixoraAsset
    ) => {
      const currentDoc = documentRef.current;
      const obj = currentDoc.objects[id];
      if (!obj) return;
      const prevProps: Partial<PixoraObject> = {};
      for (const key of Object.keys(props) as (keyof PixoraObject)[]) {
        (prevProps as any)[key] = (obj as any)[key];
      }
      const cmd = new UpdatePropertyCommand(id, prevProps, props, description, asset);
      const updated = historyRef.current.execute(cmd, currentDoc);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    []
  );

  const updateObjectsTransient = useCallback(
    (updates: Record<string, Partial<PixoraObject>>) => {
      if (Object.keys(updates).length === 0) return;
      setDocumentState(doc => {
        let changed = false;
        const newObjects = { ...doc.objects };
        for (const [id, patch] of Object.entries(updates)) {
          if (newObjects[id]) {
            newObjects[id] = { ...newObjects[id], ...patch } as PixoraObject;
            changed = true;
          }
        }
        if (!changed) return doc;
        const next = { ...doc, objects: newObjects };
        documentRef.current = next;
        return next;
      });
    },
    []
  );

  const reorderLayers = useCallback(
    (
      pageId: string,
      parentId: string | null,
      prevChildIds: string[],
      nextChildIds: string[]
    ) => {
      const cmd = new ReorderLayerCommand(pageId, parentId, prevChildIds, nextChildIds);
      const updated = historyRef.current.execute(cmd, documentRef.current);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    []
  );

  const groupObjects = useCallback(
    (objectIds: string[]): string | null => {
      if (objectIds.length < 2) return null;
      const currentDoc = documentRef.current;
      const targets = objectIds.map(id => currentDoc.objects[id]).filter(Boolean);
      if (targets.length < 2) return null;

      const bounds = getBoundingBox(targets);
      if (!bounds) return null;

      const groupId = generateId('group');
      const group: GroupObject = {
        id: groupId,
        name: 'Group',
        type: 'group',
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        rotation: 0,
        opacity: 1,
        locked: false,
        visible: true,
        childIds: [...objectIds],
        parentId: targets[0].parentId,
      };

      const cmd = new GroupObjectsCommand(group, activePageId, targets[0].parentId);
      const updated = historyRef.current.execute(cmd, currentDoc);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
      return groupId;
    },
    [activePageId]
  );

  const ungroupObject = useCallback(
    (groupId: string) => {
      const currentDoc = documentRef.current;
      const group = currentDoc.objects[groupId];
      if (!group || group.type !== 'group') return;

      const cmd = new UngroupCommand(groupId, group.childIds, activePageId, group.parentId);
      const updated = historyRef.current.execute(cmd, currentDoc);
      documentRef.current = updated;
      setDocumentState(updated);
      setHistoryVersion(v => v + 1);
    },
    [activePageId]
  );

  const addPage = useCallback(
    (name?: string): string => {
      const newPageId = generateId('page');
      const newPage: Page = {
        id: newPageId,
        name: name || `Page ${documentRef.current.pages.length + 1}`,
        childIds: [],
      };
      setDocumentState(doc => {
        const next = {
          ...doc,
          pages: [...doc.pages, newPage],
          metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
        };
        documentRef.current = next;
        return next;
      });
      setActivePageId(newPageId);
      return newPageId;
    },
    []
  );

  const renamePage = useCallback((pageId: string, name: string) => {
    setDocumentState(doc => {
      const next = {
        ...doc,
        pages: doc.pages.map(p => (p.id === pageId ? { ...p, name } : p)),
        metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
      };
      documentRef.current = next;
      return next;
    });
  }, []);

  const duplicatePage = useCallback(
    (pageId: string): string => {
      const currentDoc = documentRef.current;
      const pageToDup = currentDoc.pages.find(p => p.id === pageId);
      if (!pageToDup) return '';

      const newPageId = generateId('page');
      const idMap: Record<string, string> = {};
      const newObjects = { ...currentDoc.objects };

      // Clone objects tree
      const cloneTree = (id: string, newParentId?: string): string => {
        const orig = currentDoc.objects[id];
        if (!orig) return '';
        const newId = generateId(orig.type);
        idMap[id] = newId;

        const cloned: any = {
          ...orig,
          id: newId,
          parentId: newParentId || null,
        };

        if (orig.type === 'frame' || orig.type === 'group') {
          cloned.childIds = orig.childIds.map(cId => cloneTree(cId, newId)).filter(Boolean);
        }

        newObjects[newId] = cloned;
        return newId;
      };

      const newChildIds = pageToDup.childIds.map(cId => cloneTree(cId)).filter(Boolean);

      const newPage: Page = {
        id: newPageId,
        name: `${pageToDup.name} (Copy)`,
        childIds: newChildIds,
        backgroundColor: pageToDup.backgroundColor,
      };

      setDocumentState(doc => {
        const next = {
          ...doc,
          objects: newObjects,
          pages: [...doc.pages, newPage],
          metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
        };
        documentRef.current = next;
        return next;
      });

      setActivePageId(newPageId);
      return newPageId;
    },
    []
  );

  const deletePage = useCallback(
    (pageId: string) => {
      const currentDoc = documentRef.current;
      if (currentDoc.pages.length <= 1) return; // Keep at least one page
      const remainingPages = currentDoc.pages.filter(p => p.id !== pageId);

      setDocumentState(doc => {
        const next = {
          ...doc,
          pages: remainingPages,
          metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
        };
        documentRef.current = next;
        return next;
      });

      if (activePageId === pageId) {
        setActivePageId(remainingPages[0].id);
      }
    },
    [activePageId]
  );

  const addAsset = useCallback((asset: PixoraAsset) => {
    setDocumentState(doc => {
      const next = {
        ...doc,
        assets: {
          ...doc.assets,
          [asset.id]: asset,
        },
        metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
      };
      documentRef.current = next;
      return next;
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<DocumentSettings>) => {
    setDocumentState(doc => {
      const next = {
        ...doc,
        settings: { ...doc.settings, ...settings },
        metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
      };
      documentRef.current = next;
      return next;
    });
  }, []);

  const updateMetadata = useCallback((meta: Partial<DocumentMetadata>) => {
    setDocumentState(doc => {
      const next = {
        ...doc,
        metadata: { ...doc.metadata, ...meta, updatedAt: new Date().toISOString() },
      };
      documentRef.current = next;
      return next;
    });
  }, []);

  const activePage = useMemo(() => {
    return document.pages.find(p => p.id === activePageId) || document.pages[0];
  }, [document.pages, activePageId]);

  const value = useMemo(
    () => ({
      document,
      activePageId,
      setActivePageId,
      activePage,
      canUndo: historyRef.current.canUndo,
      canRedo: historyRef.current.canRedo,
      setDocument,
      undo,
      redo,
      addObject,
      addImageAsset,
      deleteObjects,
      transformObjects,
      updateObjectProperties,
      updateObjectsTransient,
      reorderLayers,
      groupObjects,
      ungroupObject,
      addPage,
      renamePage,
      duplicatePage,
      deletePage,
      addAsset,
      updateSettings,
      updateMetadata,
    }),
    [
      document,
      activePageId,
      activePage,
      historyVersion,
      setDocument,
      undo,
      redo,
      addObject,
      addImageAsset,
      deleteObjects,
      transformObjects,
      updateObjectProperties,
      updateObjectsTransient,
      reorderLayers,
      groupObjects,
      ungroupObject,
      addPage,
      renamePage,
      duplicatePage,
      deletePage,
      addAsset,
      updateSettings,
      updateMetadata,
    ]
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
