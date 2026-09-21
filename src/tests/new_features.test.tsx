import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { getSelectableTargetId, collectMoveIds } from '../utils/tree';
import { loadGoogleFont, registerFontAsset } from '../utils/fontLoader';
import { PixoraDocument, RectangleObject, GroupObject, TextObject, PixoraAsset } from '../types/document';
import { TransformObjectsCommand } from '../history/commands';
import { ContextMenu } from '../components/menu/ContextMenu';
import { DocumentProvider } from '../document/documentContext';
import { EditorProvider, useEditor } from '../editor/editorContext';
import { createDefaultProject } from '../document/defaultProject';

describe('Custom Fonts Support', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('loadGoogleFont dynamically injects Google Fonts link into document head', () => {
    loadGoogleFont('Playfair Display');
    const link = document.querySelector('link[href*="Playfair+Display"]');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('rel')).toBe('stylesheet');
  });

  it('registerFontAsset injects @font-face style tag for custom font asset', () => {
    const asset: PixoraAsset = {
      id: 'font-test-1',
      name: 'CustomBrandFont',
      type: 'font',
      dataUrl: 'data:font/woff2;base64,dGVzdA==',
      width: 0,
      height: 0,
    };
    registerFontAsset(asset);
    const style = document.getElementById(`custom-font-${asset.id}`);
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('@font-face');
    expect(style?.textContent).toContain('CustomBrandFont');
    expect(style?.textContent).toContain('data:font/woff2;base64,dGVzdA==');
  });
});

describe('Group Child Layer Selection and Transformation', () => {
  const child1: RectangleObject = {
    id: 'rect-1',
    name: 'Child Rect 1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    parentId: 'group-1',
  };

  const child2: RectangleObject = {
    id: 'rect-2',
    name: 'Child Rect 2',
    type: 'rectangle',
    x: 200,
    y: 150,
    width: 50,
    height: 50,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    parentId: 'group-1',
  };

  const group: GroupObject = {
    id: 'group-1',
    name: 'Parent Group',
    type: 'group',
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    childIds: ['rect-1', 'rect-2'],
  };

  const objects = {
    'rect-1': child1,
    'rect-2': child2,
    'group-1': group,
  };

  it('returns group parent when group is not selected', () => {
    const target = getSelectableTargetId('rect-1', objects, []);
    expect(target).toBe('group-1');
  });

  it('returns child directly when parent group is already selected', () => {
    const target = getSelectableTargetId('rect-1', objects, ['group-1']);
    expect(target).toBe('rect-1');
  });

  it('returns child directly when deepSelect is true', () => {
    const target = getSelectableTargetId('rect-1', objects, [], true);
    expect(target).toBe('rect-1');
  });

  it('returns child directly when child is already selected', () => {
    const target = getSelectableTargetId('rect-1', objects, ['rect-1']);
    expect(target).toBe('rect-1');
  });

  it('supports drilling down into nested groups', () => {
    const nestedGroup: GroupObject = {
      id: 'nested-group',
      name: 'Nested Group',
      type: 'group',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      childIds: ['rect-1'],
      parentId: 'group-1',
    };
    const childInNested: RectangleObject = {
      ...child1,
      parentId: 'nested-group',
    };
    const nestedObjects = {
      'rect-1': childInNested,
      'nested-group': nestedGroup,
      'group-1': { ...group, childIds: ['nested-group', 'rect-2'] },
    };

    // 1st click: selects root group
    expect(getSelectableTargetId('rect-1', nestedObjects, [])).toBe('group-1');
    // 2nd click with root group selected: selects nested group
    expect(getSelectableTargetId('rect-1', nestedObjects, ['group-1'])).toBe('nested-group');
    // 3rd click with nested group selected: selects child rect
    expect(getSelectableTargetId('rect-1', nestedObjects, ['nested-group'])).toBe('rect-1');
  });

  it('collectMoveIds only moves child when child is selected', () => {
    const moveIds = collectMoveIds(['rect-1'], objects);
    expect(moveIds).toEqual(['rect-1']);
  });

  it('TransformObjectsCommand recalculates parent group bounds when child moves', () => {
    const doc: PixoraDocument = {
      schemaVersion: 1,
      metadata: { id: 'doc-1', name: 'Test', createdAt: '', updatedAt: '' },
      settings: { grid: { enabled: true, size: 10, snap: false }, snapToObjects: true },
      pages: [{ id: 'p1', name: 'Page 1', childIds: ['group-1'] }],
      objects: {
        'rect-1': { ...child1 },
        'rect-2': { ...child2 },
        'group-1': { ...group },
      },
      assets: {},
    };

    // Move rect-2 further to the right (x: 300)
    const prevSnapshots = {
      'rect-2': { x: 200, y: 150, width: 50, height: 50, rotation: 0 },
    };
    const nextSnapshots = {
      'rect-2': { x: 300, y: 150, width: 50, height: 50, rotation: 0 },
    };

    const cmd = new TransformObjectsCommand(prevSnapshots, nextSnapshots, 'move');
    const executedDoc = cmd.execute(doc);

    const updatedGroup = executedDoc.objects['group-1'] as GroupObject;
    // Group bounds should encompass rect-1 (x: 100) and new rect-2 (x: 300, width: 50) => width = 350 - 100 = 250
    expect(updatedGroup.width).toBe(250);

    // Undo should restore previous group width
    const undoneDoc = cmd.undo(executedDoc);
    const undoneGroup = undoneDoc.objects['group-1'] as GroupObject;
    expect(undoneGroup.width).toBe(150);
  });
});

// Helper component to trigger context menu in tests
const TestEditorWithContextMenu: React.FC<{ initialTargetId?: string; isSelection?: boolean }> = ({
  initialTargetId,
  isSelection = false,
}) => {
  const { setContextMenu, setSelectedIds } = useEditor();

  React.useEffect(() => {
    if (isSelection && initialTargetId) {
      setSelectedIds([initialTargetId]);
    }
    setContextMenu({
      x: 150,
      y: 200,
      targetId: initialTargetId,
    });
  }, [setContextMenu, setSelectedIds, initialTargetId, isSelection]);

  return <ContextMenu />;
};

describe('Desktop Right-Click Context Menu', () => {
  it('renders canvas options context menu when right clicking background', () => {
    render(
      <DocumentProvider>
        <EditorProvider>
          <TestEditorWithContextMenu />
        </EditorProvider>
      </DocumentProvider>
    );

    expect(screen.getByText('Canvas Options')).toBeDefined();
    expect(screen.getByText('Select All')).toBeDefined();
    expect(screen.getByText('Zoom In')).toBeDefined();
    expect(screen.getByText('Zoom Out')).toBeDefined();
    expect(screen.getByText('Reset Zoom')).toBeDefined();
  });

  it('renders layer options context menu when right clicking an object', () => {
    render(
      <DocumentProvider>
        <EditorProvider>
          <TestEditorWithContextMenu initialTargetId="rect-1" isSelection={true} />
        </EditorProvider>
      </DocumentProvider>
    );

    expect(screen.getByText('Duplicate')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
    expect(screen.getByText('Bring Forward')).toBeDefined();
    expect(screen.getByText('Bring to Front')).toBeDefined();
    expect(screen.getByText('Send Backward')).toBeDefined();
    expect(screen.getByText('Send to Back')).toBeDefined();
    expect(screen.getByText('Lock')).toBeDefined();
    expect(screen.getByText('Hide')).toBeDefined();
  });

  it('closes context menu when escape key is pressed', () => {
    render(
      <DocumentProvider>
        <EditorProvider>
          <TestEditorWithContextMenu />
        </EditorProvider>
      </DocumentProvider>
    );

    expect(screen.getByText('Canvas Options')).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Canvas Options')).toBeNull();
  });
});
