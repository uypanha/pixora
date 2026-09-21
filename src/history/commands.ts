import { PixoraDocument, PixoraObject, GroupObject, PixoraAsset, PhotoProjectState } from '../types/document';
import { ObjectTransformSnapshot } from '../types/editor';
import { getBoundingBox } from '../utils/math';

export interface HistoryCommand {
  description: string;
  execute: (doc: PixoraDocument) => PixoraDocument;
  undo: (doc: PixoraDocument) => PixoraDocument;
}

/**
 * Add object command
 */
export class AddObjectCommand implements HistoryCommand {
  description: string;
  constructor(
    private object: PixoraObject,
    private pageId: string,
    private parentId?: string | null,
    private asset?: PixoraAsset
  ) {
    this.description = `Add ${object.name}`;
  }

  execute(doc: PixoraDocument): PixoraDocument {
    const newAssets = this.asset ? { ...doc.assets, [this.asset.id]: this.asset } : doc.assets;
    const newObjects = { ...doc.objects, [this.object.id]: this.object };
    const newPages = doc.pages.map(page => {
      if (page.id !== this.pageId) return page;

      if (!this.parentId) {
        return { ...page, childIds: [...page.childIds, this.object.id] };
      }
      return page;
    });

    if (this.parentId && newObjects[this.parentId]) {
      const parent = newObjects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        newObjects[this.parentId] = {
          ...parent,
          childIds: [...parent.childIds, this.object.id],
        };
      }
    }

    return {
      ...doc,
      assets: newAssets,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    delete newObjects[this.object.id];

    const newPages = doc.pages.map(page => {
      if (page.id !== this.pageId) return page;
      return {
        ...page,
        childIds: page.childIds.filter(id => id !== this.object.id),
      };
    });

    if (this.parentId && newObjects[this.parentId]) {
      const parent = newObjects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        newObjects[this.parentId] = {
          ...parent,
          childIds: parent.childIds.filter(id => id !== this.object.id),
        };
      }
    }

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

/**
 * Delete objects command
 */
export class DeleteObjectsCommand implements HistoryCommand {
  description: string;
  private deletedObjects: PixoraObject[] = [];
  private parentChildMap: Record<string, string[]> = {};
  private pageChildIds: Record<string, string[]> = {};

  constructor(
    private objectIds: string[],
    doc: PixoraDocument
  ) {
    this.description = `Delete ${objectIds.length} object${objectIds.length > 1 ? 's' : ''}`;

    // Snapshot existing positions and parents before deletion
    for (const id of objectIds) {
      const obj = doc.objects[id];
      if (obj) {
        this.deletedObjects.push(obj);
        if (obj.parentId && doc.objects[obj.parentId]) {
          const parent = doc.objects[obj.parentId];
          if (parent.type === 'frame' || parent.type === 'group') {
            this.parentChildMap[obj.parentId] = [...parent.childIds];
          }
        }
      }
    }

    for (const page of doc.pages) {
      this.pageChildIds[page.id] = [...page.childIds];
    }
  }

  execute(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    const toDeleteSet = new Set(this.objectIds);

    // Recursively collect children of deleted frames/groups
    const collectChildren = (ids: string[]) => {
      for (const id of ids) {
        const obj = newObjects[id];
        if (obj && (obj.type === 'frame' || obj.type === 'group')) {
          for (const cId of obj.childIds) {
            toDeleteSet.add(cId);
            collectChildren([cId]);
          }
        }
      }
    };
    collectChildren(this.objectIds);

    for (const id of toDeleteSet) {
      delete newObjects[id];
    }

    // Clean up parent references
    for (const objId in newObjects) {
      const obj = newObjects[objId];
      if (obj.type === 'frame' || obj.type === 'group') {
        newObjects[objId] = {
          ...obj,
          childIds: obj.childIds.filter(id => !toDeleteSet.has(id)),
        };
      }
    }

    const newPages = doc.pages.map(page => ({
      ...page,
      childIds: page.childIds.filter(id => !toDeleteSet.has(id)),
    }));

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    for (const obj of this.deletedObjects) {
      newObjects[obj.id] = obj;
    }

    // Restore parent relationships
    for (const [parentId, childIds] of Object.entries(this.parentChildMap)) {
      if (newObjects[parentId]) {
        const parent = newObjects[parentId];
        if (parent.type === 'frame' || parent.type === 'group') {
          newObjects[parentId] = {
            ...parent,
            childIds: [...childIds],
          };
        }
      }
    }

    const newPages = doc.pages.map(page => {
      const savedChildIds = this.pageChildIds[page.id];
      if (savedChildIds) {
        return { ...page, childIds: [...savedChildIds] };
      }
      return page;
    });

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

/**
 * Transform objects command (Move, Resize, Rotate)
 */
function updateParentGroupBounds(objects: Record<string, PixoraObject>, modifiedIds: string[]) {
  const affectedGroupIds = new Set<string>();
  for (const id of modifiedIds) {
    let curr = objects[id];
    while (curr && curr.parentId && objects[curr.parentId]) {
      const parent = objects[curr.parentId];
      if (parent.type === 'group') {
        affectedGroupIds.add(parent.id);
        curr = parent;
      } else {
        break;
      }
    }
  }

  for (const groupId of affectedGroupIds) {
    const group = objects[groupId];
    if (group && group.type === 'group') {
      const children = (group.childIds || []).map(cid => objects[cid]).filter(Boolean);
      if (children.length > 0) {
        const bbox = getBoundingBox(children);
        if (bbox) {
          objects[groupId] = {
            ...group,
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
          };
        }
      }
    }
  }
}

export class TransformObjectsCommand implements HistoryCommand {
  description: string;

  constructor(
    private prevSnapshots: Record<string, ObjectTransformSnapshot>,
    private nextSnapshots: Record<string, ObjectTransformSnapshot>,
    type: 'move' | 'resize' | 'rotate' = 'move'
  ) {
    const count = Object.keys(nextSnapshots).length;
    this.description = `${type.charAt(0).toUpperCase() + type.slice(1)} ${count} item${count > 1 ? 's' : ''}`;
  }

  execute(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    for (const [id, transform] of Object.entries(this.nextSnapshots)) {
      if (newObjects[id]) {
        newObjects[id] = {
          ...newObjects[id],
          ...transform,
        };
      }
    }
    updateParentGroupBounds(newObjects, Object.keys(this.nextSnapshots));

    return {
      ...doc,
      objects: newObjects,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    for (const [id, transform] of Object.entries(this.prevSnapshots)) {
      if (newObjects[id]) {
        newObjects[id] = {
          ...newObjects[id],
          ...transform,
        };
      }
    }
    updateParentGroupBounds(newObjects, Object.keys(this.prevSnapshots));

    return {
      ...doc,
      objects: newObjects,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

/**
 * Update property command
 */
export class UpdatePropertyCommand implements HistoryCommand {
  description: string;

  constructor(
    private objectId: string,
    private prevProps: Partial<PixoraObject>,
    private nextProps: Partial<PixoraObject>,
    description = 'Change property',
    private asset?: PixoraAsset
  ) {
    this.description = description;
  }

  execute(doc: PixoraDocument): PixoraDocument {
    if (!doc.objects[this.objectId]) return doc;

    const newAssets = this.asset ? { ...doc.assets, [this.asset.id]: this.asset } : doc.assets;

    return {
      ...doc,
      assets: newAssets,
      objects: {
        ...doc.objects,
        [this.objectId]: {
          ...doc.objects[this.objectId],
          ...this.nextProps,
        } as PixoraObject,
      },
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    if (!doc.objects[this.objectId]) return doc;

    return {
      ...doc,
      objects: {
        ...doc.objects,
        [this.objectId]: {
          ...doc.objects[this.objectId],
          ...this.prevProps,
        } as PixoraObject,
      },
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

/**
 * Reorder layer command
 */
export class ReorderLayerCommand implements HistoryCommand {
  description = 'Reorder layers';

  constructor(
    private pageId: string,
    private parentId: string | null,
    private prevChildIds: string[],
    private nextChildIds: string[]
  ) {}

  execute(doc: PixoraDocument): PixoraDocument {
    if (this.parentId && doc.objects[this.parentId]) {
      const parent = doc.objects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        return {
          ...doc,
          objects: {
            ...doc.objects,
            [this.parentId]: {
              ...parent,
              childIds: [...this.nextChildIds],
            },
          },
        };
      }
    }

    return {
      ...doc,
      pages: doc.pages.map(page =>
        page.id === this.pageId ? { ...page, childIds: [...this.nextChildIds] } : page
      ),
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    if (this.parentId && doc.objects[this.parentId]) {
      const parent = doc.objects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        return {
          ...doc,
          objects: {
            ...doc.objects,
            [this.parentId]: {
              ...parent,
              childIds: [...this.prevChildIds],
            },
          },
        };
      }
    }

    return {
      ...doc,
      pages: doc.pages.map(page =>
        page.id === this.pageId ? { ...page, childIds: [...this.prevChildIds] } : page
      ),
    };
  }
}

/**
 * Group objects command
 */
export class GroupObjectsCommand implements HistoryCommand {
  description = 'Group objects';

  constructor(
    private group: GroupObject,
    private pageId: string,
    private parentId?: string | null
  ) {}

  execute(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects, [this.group.id]: this.group };
    const childSet = new Set(this.group.childIds);

    // Reparent grouped children
    for (const childId of this.group.childIds) {
      if (newObjects[childId]) {
        newObjects[childId] = {
          ...newObjects[childId],
          parentId: this.group.id,
        };
      }
    }

    // Insert group into parent or page
    let newPages = doc.pages;
    if (!this.parentId) {
      newPages = doc.pages.map(page => {
        if (page.id !== this.pageId) return page;
        const filtered = page.childIds.filter(id => !childSet.has(id));
        return { ...page, childIds: [...filtered, this.group.id] };
      });
    } else if (newObjects[this.parentId]) {
      const parent = newObjects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        const filtered = parent.childIds.filter(id => !childSet.has(id));
        newObjects[this.parentId] = {
          ...parent,
          childIds: [...filtered, this.group.id],
        };
      }
    }

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    const newObjects = { ...doc.objects };
    delete newObjects[this.group.id];

    for (const childId of this.group.childIds) {
      if (newObjects[childId]) {
        newObjects[childId] = {
          ...newObjects[childId],
          parentId: this.parentId || null,
        };
      }
    }

    let newPages = doc.pages;
    if (!this.parentId) {
      newPages = doc.pages.map(page => {
        if (page.id !== this.pageId) return page;
        const filtered = page.childIds.filter(id => id !== this.group.id);
        return { ...page, childIds: [...filtered, ...this.group.childIds] };
      });
    } else if (newObjects[this.parentId]) {
      const parent = newObjects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        const filtered = parent.childIds.filter(id => id !== this.group.id);
        newObjects[this.parentId] = {
          ...parent,
          childIds: [...filtered, ...this.group.childIds],
        };
      }
    }

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

/**
 * Ungroup objects command
 */
export class UngroupCommand implements HistoryCommand {
  description = 'Ungroup objects';
  private savedGroup: GroupObject | null = null;

  constructor(
    private groupId: string,
    private childIds: string[],
    private pageId: string,
    private parentId?: string | null
  ) {}

  execute(doc: PixoraDocument): PixoraDocument {
    this.savedGroup = (doc.objects[this.groupId] as GroupObject) || null;
    const newObjects = { ...doc.objects };
    delete newObjects[this.groupId];

    for (const childId of this.childIds) {
      if (newObjects[childId]) {
        newObjects[childId] = {
          ...newObjects[childId],
          parentId: this.parentId || null,
        };
      }
    }

    let newPages = doc.pages;
    if (!this.parentId) {
      newPages = doc.pages.map(page => {
        if (page.id !== this.pageId) return page;
        const filtered = page.childIds.filter(id => id !== this.groupId);
        return { ...page, childIds: [...filtered, ...this.childIds] };
      });
    } else if (newObjects[this.parentId]) {
      const parent = newObjects[this.parentId];
      if (parent.type === 'frame' || parent.type === 'group') {
        const filtered = parent.childIds.filter(id => id !== this.groupId);
        newObjects[this.parentId] = {
          ...parent,
          childIds: [...filtered, ...this.childIds],
        };
      }
    }

    return {
      ...doc,
      objects: newObjects,
      pages: newPages,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    if (!this.savedGroup) return doc;
    const groupCmd = new GroupObjectsCommand(this.savedGroup, this.pageId, this.parentId);
    return groupCmd.execute(doc);
  }
}

/**
 * Update photo project state command
 */
export class UpdatePhotoCommand implements HistoryCommand {
  description: string;
  constructor(
    private prevPhoto: PhotoProjectState,
    private nextPhoto: PhotoProjectState,
    description?: string
  ) {
    this.description = description || 'Update Photo';
  }

  execute(doc: PixoraDocument): PixoraDocument {
    return {
      ...doc,
      photo: this.nextPhoto,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }

  undo(doc: PixoraDocument): PixoraDocument {
    return {
      ...doc,
      photo: this.prevPhoto,
      metadata: { ...doc.metadata, updatedAt: new Date().toISOString() },
    };
  }
}

