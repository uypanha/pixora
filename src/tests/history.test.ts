import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../history/historyManager';
import {
  AddObjectCommand,
  DeleteObjectsCommand,
  TransformObjectsCommand,
} from '../history/commands';
import { createDefaultProject } from '../document/defaultProject';
import { createRectangle } from '../document/objectFactory';

describe('History System (Undo / Redo)', () => {
  it('correctly executes, undoes, and redoes adding an object', () => {
    const history = new HistoryManager(50);
    const initialDoc = createDefaultProject(undefined, 'History Test');
    const pageId = initialDoc.pages[0].id;
    const rect = createRectangle(50, 50, 100, 100);

    const addCmd = new AddObjectCommand(rect, pageId);

    // 1. Execute
    const docAfterAdd = history.execute(addCmd, initialDoc);
    expect(docAfterAdd.objects[rect.id]).toBeDefined();
    expect(docAfterAdd.pages[0].childIds).toContain(rect.id);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    // 2. Undo
    const docAfterUndo = history.undo(docAfterAdd);
    expect(docAfterUndo).not.toBeNull();
    expect(docAfterUndo!.objects[rect.id]).toBeUndefined();
    expect(docAfterUndo!.pages[0].childIds).not.toContain(rect.id);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);

    // 3. Redo
    const docAfterRedo = history.redo(docAfterUndo!);
    expect(docAfterRedo).not.toBeNull();
    expect(docAfterRedo!.objects[rect.id]).toBeDefined();
    expect(docAfterRedo!.pages[0].childIds).toContain(rect.id);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it('correctly deletes objects and restores them on undo', () => {
    const history = new HistoryManager(50);
    let doc = createDefaultProject(undefined, 'Delete Test');
    const pageId = doc.pages[0].id;
    const rect = createRectangle(10, 10, 100, 100);

    doc = history.execute(new AddObjectCommand(rect, pageId), doc);
    expect(doc.objects[rect.id]).toBeDefined();

    // Delete
    const deleteCmd = new DeleteObjectsCommand([rect.id], doc);
    const docAfterDelete = history.execute(deleteCmd, doc);
    expect(docAfterDelete.objects[rect.id]).toBeUndefined();
    expect(docAfterDelete.pages[0].childIds).not.toContain(rect.id);

    // Undo delete
    const docRestored = history.undo(docAfterDelete);
    expect(docRestored!.objects[rect.id]).toBeDefined();
    expect(docRestored!.pages[0].childIds).toContain(rect.id);
  });

  it('transforms objects in a single batch history operation', () => {
    const history = new HistoryManager(50);
    let doc = createDefaultProject(undefined, 'Transform Test');
    const pageId = doc.pages[0].id;
    const rect = createRectangle(10, 10, 100, 100);
    doc = history.execute(new AddObjectCommand(rect, pageId), doc);

    const prevSnapshot = {
      [rect.id]: { x: 10, y: 10, width: 100, height: 100, rotation: 0 },
    };
    const nextSnapshot = {
      [rect.id]: { x: 150, y: 200, width: 120, height: 140, rotation: 45 },
    };

    const transformCmd = new TransformObjectsCommand(prevSnapshot, nextSnapshot, 'move');
    const docAfterMove = history.execute(transformCmd, doc);

    expect(docAfterMove.objects[rect.id].x).toBe(150);
    expect(docAfterMove.objects[rect.id].y).toBe(200);
    expect(docAfterMove.objects[rect.id].width).toBe(120);
    expect(docAfterMove.objects[rect.id].rotation).toBe(45);

    // Undo transformation
    const docUndone = history.undo(docAfterMove);
    expect(docUndone!.objects[rect.id].x).toBe(10);
    expect(docUndone!.objects[rect.id].y).toBe(10);
    expect(docUndone!.objects[rect.id].width).toBe(100);
    expect(docUndone!.objects[rect.id].rotation).toBe(0);
  });
});
