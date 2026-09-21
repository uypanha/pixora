import { describe, it, expect } from 'vitest';
import {
  createFrame,
  createRectangle,
  createEllipse,
  createLine,
  createText,
  createGroup,
} from '../document/objectFactory';
import { createDefaultProject } from '../document/defaultProject';
import { GroupObjectsCommand, UngroupCommand, ReorderLayerCommand } from '../history/commands';

describe('Document Objects & Hierarchy', () => {
  it('creates valid objects with proper defaults', () => {
    const frame = createFrame(0, 0, 390, 844, 'Mobile Frame');
    expect(frame.type).toBe('frame');
    expect(frame.width).toBe(390);
    expect(frame.height).toBe(844);
    expect(frame.clipContent).toBe(true);

    const rect = createRectangle(10, 20, 100, 50);
    expect(rect.type).toBe('rectangle');
    expect(rect.fill).toBe('#6366f1');

    const ellipse = createEllipse(30, 40, 60, 60);
    expect(ellipse.type).toBe('ellipse');

    const line = createLine(0, 0, 200);
    expect(line.type).toBe('line');
    expect(line.width).toBe(200);

    const text = createText(0, 0, 'Hello Pixora');
    expect(text.type).toBe('text');
    expect(text.text).toBe('Hello Pixora');
  });

  it('handles grouping and ungrouping objects correctly', () => {
    let doc = createDefaultProject(undefined, 'Group Test');
    const pageId = doc.pages[0].id;

    const r1 = createRectangle(10, 10, 50, 50);
    const r2 = createRectangle(70, 70, 50, 50);

    doc.objects[r1.id] = r1;
    doc.objects[r2.id] = r2;
    doc.pages[0].childIds.push(r1.id, r2.id);

    const group = createGroup([r1.id, r2.id], { x: 10, y: 10, width: 110, height: 110 });
    const groupCmd = new GroupObjectsCommand(group, pageId);

    // Group execution
    doc = groupCmd.execute(doc);
    expect(doc.objects[group.id]).toBeDefined();
    expect(doc.objects[r1.id].parentId).toBe(group.id);
    expect(doc.objects[r2.id].parentId).toBe(group.id);
    expect(doc.pages[0].childIds).toContain(group.id);
    expect(doc.pages[0].childIds).not.toContain(r1.id);

    // Ungroup execution
    const ungroupCmd = new UngroupCommand(group.id, [r1.id, r2.id], pageId);
    doc = ungroupCmd.execute(doc);
    expect(doc.objects[group.id]).toBeUndefined();
    expect(doc.objects[r1.id].parentId).toBeNull();
    expect(doc.pages[0].childIds).toContain(r1.id);
    expect(doc.pages[0].childIds).toContain(r2.id);
  });

  it('reorders layers correctly in the visual stack', () => {
    let doc = createDefaultProject(undefined, 'Reorder Test');
    const pageId = doc.pages[0].id;
    const r1 = createRectangle(0, 0, 50, 50);
    const r2 = createRectangle(50, 50, 50, 50);

    doc.objects[r1.id] = r1;
    doc.objects[r2.id] = r2;
    doc.pages[0].childIds = [r1.id, r2.id];

    const reorderCmd = new ReorderLayerCommand(pageId, null, [r1.id, r2.id], [r2.id, r1.id]);
    doc = reorderCmd.execute(doc);

    expect(doc.pages[0].childIds).toEqual([r2.id, r1.id]);

    // Undo reorder
    doc = reorderCmd.undo(doc);
    expect(doc.pages[0].childIds).toEqual([r1.id, r2.id]);
  });
});
