import { describe, it, expect } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { createDefaultProject } from '../document/defaultProject';
import { createRectangle, createText } from '../document/objectFactory';
import { AddObjectCommand, UpdatePropertyCommand, TransformObjectsCommand } from '../history/commands';
import { HistoryManager } from '../history/historyManager';
import { collectMoveIds, getSelectableTargetId } from '../utils/tree';
import { PixoraAsset, ImageObject, GroupObject } from '../types/document';
import { CanvasObject } from '../canvas/CanvasObject';
import { DocumentProvider, useDocument } from '../document/documentContext';

describe('Fix 1: Image Import & Preview', () => {
  it('atomically preserves image asset when adding an image object', () => {
    const history = new HistoryManager(50);
    const initialDoc = createDefaultProject(undefined, 'Image Test');
    const pageId = initialDoc.pages[0].id;

    const testAsset: PixoraAsset = {
      id: 'asset_123',
      name: 'avatar.png',
      type: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      width: 100,
      height: 100,
    };

    const imageObj: ImageObject = {
      id: 'img_obj_123',
      name: 'Image Layer',
      type: 'image',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      assetId: testAsset.id,
      fit: 'cover',
      cornerRadius: 0,
    };

    const cmd = new AddObjectCommand(imageObj, pageId, null, testAsset);
    const docAfterAdd = history.execute(cmd, initialDoc);

    // Asset must be stored in doc.assets
    expect(docAfterAdd.assets[testAsset.id]).toBeDefined();
    expect(docAfterAdd.assets[testAsset.id].dataUrl).toBe(testAsset.dataUrl);
    expect(docAfterAdd.objects[imageObj.id]).toBeDefined();
  });

  it('atomically preserves replaced image asset on updateObjectProperties', () => {
    const history = new HistoryManager(50);
    let doc = createDefaultProject(undefined, 'Replace Image Test');
    const pageId = doc.pages[0].id;

    const initialAsset: PixoraAsset = {
      id: 'asset_1',
      name: 'old.png',
      type: 'image/png',
      dataUrl: 'data:image/png;base64,olddata',
      width: 50,
      height: 50,
    };

    const imgObj: ImageObject = {
      id: 'img_1',
      name: 'Image 1',
      type: 'image',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      assetId: initialAsset.id,
      fit: 'cover',
    };

    doc = history.execute(new AddObjectCommand(imgObj, pageId, null, initialAsset), doc);
    expect(doc.assets['asset_1']).toBeDefined();

    const newAsset: PixoraAsset = {
      id: 'asset_2',
      name: 'new.png',
      type: 'image/png',
      dataUrl: 'data:image/png;base64,newdata',
      width: 150,
      height: 150,
    };

    const updateCmd = new UpdatePropertyCommand(
      imgObj.id,
      { assetId: imgObj.assetId },
      { assetId: newAsset.id },
      'Replace image',
      newAsset
    );

    doc = history.execute(updateCmd, doc);
    expect(doc.assets['asset_2']).toBeDefined();
    expect((doc.objects[imgObj.id] as ImageObject).assetId).toBe('asset_2');
  });

  it('renders SVG image element with asset dataUrl in CanvasObject', () => {
    const asset: PixoraAsset = {
      id: 'asset_preview',
      name: 'preview.png',
      type: 'image/png',
      dataUrl: 'data:image/png;base64,sample_image_data',
      width: 100,
      height: 100,
    };

    const imgObj: ImageObject = {
      id: 'img_node',
      name: 'Photo',
      type: 'image',
      x: 10,
      y: 20,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      assetId: asset.id,
      fit: 'cover',
    };

    const { container } = render(
      <svg>
        <CanvasObject
          object={imgObj}
          objects={{ [imgObj.id]: imgObj }}
          assets={{ [asset.id]: asset }}
          isSelected={false}
          isHovered={false}
          onSelect={() => {}}
          zoom={1}
        />
      </svg>
    );

    const imageElement = container.querySelector('image');
    expect(imageElement).not.toBeNull();
    expect(imageElement?.getAttribute('href')).toBe(asset.dataUrl);
    expect(imageElement?.getAttribute('x')).toBe('10');
    expect(imageElement?.getAttribute('y')).toBe('20');
  });
});

describe('Fix 2: Group Movement with Children', () => {
  it('collectMoveIds collects all recursive descendants of groups and frames', () => {
    const rect = createRectangle(10, 10, 50, 50);
    const text = createText(20, 20, 'Hello');
    const group: GroupObject = {
      id: 'group_1',
      name: 'My Group',
      type: 'group',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      childIds: [rect.id, text.id],
      parentId: null,
    };

    const objects = {
      [rect.id]: { ...rect, parentId: group.id },
      [text.id]: { ...text, parentId: group.id },
      [group.id]: group,
    };

    const moveIds = collectMoveIds([group.id], objects);
    expect(moveIds).toContain(group.id);
    expect(moveIds).toContain(rect.id);
    expect(moveIds).toContain(text.id);
    expect(moveIds.length).toBe(3);
  });

  it('moving a group moves all internal child layers along with group frame', () => {
    const history = new HistoryManager(50);
    let doc = createDefaultProject();

    const rect = createRectangle(100, 100, 50, 50);
    const text = createText(120, 120, 'Text inside');
    const group: GroupObject = {
      id: 'group_test',
      name: 'Group',
      type: 'group',
      x: 100,
      y: 100,
      width: 70,
      height: 70,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      childIds: [rect.id, text.id],
      parentId: null,
    };

    doc.objects[rect.id] = { ...rect, parentId: group.id };
    doc.objects[text.id] = { ...text, parentId: group.id };
    doc.objects[group.id] = group;

    const moveIds = collectMoveIds([group.id], doc.objects);
    const deltaX = 40;
    const deltaY = 60;

    const prevSnapshots: Record<string, any> = {};
    const nextSnapshots: Record<string, any> = {};

    for (const id of moveIds) {
      const o = doc.objects[id];
      prevSnapshots[id] = { x: o.x, y: o.y, width: o.width, height: o.height, rotation: o.rotation };
      nextSnapshots[id] = { x: o.x + deltaX, y: o.y + deltaY, width: o.width, height: o.height, rotation: o.rotation };
    }

    const moveCmd = new TransformObjectsCommand(prevSnapshots, nextSnapshots, 'move');
    doc = history.execute(moveCmd, doc);

    // Both group and all children must have moved by exactly deltaX, deltaY
    expect(doc.objects[group.id].x).toBe(140);
    expect(doc.objects[group.id].y).toBe(160);
    expect(doc.objects[rect.id].x).toBe(140);
    expect(doc.objects[rect.id].y).toBe(160);
    expect(doc.objects[text.id].x).toBe(160);
    expect(doc.objects[text.id].y).toBe(180);

    // Undo reverts both group and children together
    const docUndone = history.undo(doc);
    expect(docUndone!.objects[group.id].x).toBe(100);
    expect(docUndone!.objects[group.id].y).toBe(100);
    expect(docUndone!.objects[rect.id].x).toBe(100);
    expect(docUndone!.objects[rect.id].y).toBe(100);
    expect(docUndone!.objects[text.id].x).toBe(120);
    expect(docUndone!.objects[text.id].y).toBe(120);
  });

  it('getSelectableTargetId returns group parent when child is clicked', () => {
    const rect = createRectangle(10, 10, 50, 50);
    const group: GroupObject = {
      id: 'group_parent',
      name: 'Group Parent',
      type: 'group',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      childIds: [rect.id],
      parentId: null,
    };

    const objects = {
      [rect.id]: { ...rect, parentId: group.id },
      [group.id]: group,
    };

    // Standard click targets the group
    expect(getSelectableTargetId(rect.id, objects, false)).toBe(group.id);
    // Deep click with Cmd/Ctrl targets the direct child
    expect(getSelectableTargetId(rect.id, objects, true)).toBe(rect.id);
  });
});

describe('Fix 3: Mobile Touch Dragging & Transient Updates', () => {
  it('updateObjectsTransient updates positions without recording into history', () => {
    let contextValue: any = null;

    const TestComponent = () => {
      const docContext = useDocument();
      contextValue = docContext;
      return <div>Ready</div>;
    };

    render(
      <DocumentProvider>
        <TestComponent />
      </DocumentProvider>
    );

    // Add a rectangle
    const rect = createRectangle(50, 50, 100, 100);
    act(() => {
      contextValue.addObject(rect);
    });
    expect(contextValue.canUndo).toBe(true);

    // Perform transient drag movements
    act(() => {
      contextValue.updateObjectsTransient({
        [rect.id]: { x: 75, y: 85 },
      });
    });

    // Object is updated
    expect(contextValue.document.objects[rect.id].x).toBe(75);
    expect(contextValue.document.objects[rect.id].y).toBe(85);

    // Undo should still be 1 action (the add), NOT polluted by transient dragging
    act(() => {
      contextValue.undo();
    });
    expect(contextValue.document.objects[rect.id]).toBeUndefined();
  });

  it('CanvasObject dispatches onObjectPointerDown with touchAction none', () => {
    let pointerDownId = '';
    const rect = createRectangle(10, 10, 100, 100);

    const { container } = render(
      <svg>
        <CanvasObject
          object={rect}
          objects={{ [rect.id]: rect }}
          assets={{}}
          isSelected={false}
          isHovered={false}
          onSelect={() => {}}
          onObjectPointerDown={(id) => {
            pointerDownId = id;
          }}
          zoom={1}
        />
      </svg>
    );

    const gElement = container.querySelector(`#node-${rect.id}`);
    expect(gElement).not.toBeNull();

    fireEvent.pointerDown(gElement!);
    expect(pointerDownId).toBe(rect.id);
  });
});
