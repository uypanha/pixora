import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { getSelectableTargetId, collectMoveIds } from '../utils/tree';
import { loadGoogleFont, registerFontAsset } from '../utils/fontLoader';
import { PixoraDocument, RectangleObject, GroupObject, TextObject, PixoraAsset } from '../types/document';
import { TransformObjectsCommand } from '../history/commands';
import { ContextMenu } from '../components/menu/ContextMenu';
import { DocumentProvider, useDocument } from '../document/documentContext';
import { EditorProvider, useEditor } from '../editor/editorContext';
import { createDefaultProject } from '../document/defaultProject';
import { createText } from '../document/objectFactory';
import { TextEditorOverlay } from '../canvas/TextEditorOverlay';
import { CanvasObject } from '../canvas/CanvasObject';

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
    fill: '#6366f1',
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
    fill: '#6366f1',
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
      format: 'pixora',
      version: 1,
      metadata: { id: 'doc-1', name: 'Test', createdAt: '', updatedAt: '' },
      settings: { canvasColor: '#1e1e1e', grid: { enabled: true, size: 10, snap: false }, snapToObjects: true },
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

  it('shows Edit Text in context menu when right clicking a text object', () => {
    const textObj: TextObject = {
      id: 'text-1',
      name: 'Heading',
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      text: 'Hello Pixora',
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 400,
      color: '#ffffff',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'left',
    };

    render(
      <DocumentProvider initialDocument={{
        ...createDefaultProject(),
        objects: { 'text-1': textObj },
        pages: [{ id: 'p1', name: 'Page 1', childIds: ['text-1'] }]
      }}>
        <EditorProvider>
          <TestEditorWithContextMenu initialTargetId="text-1" isSelection={true} />
        </EditorProvider>
      </DocumentProvider>
    );

    expect(screen.getByText('Edit Text')).toBeDefined();
  });
});

import { hexToRgba, rgbaToHex, rgbaToHsv, hsvToRgba, parseColor, formatColor } from '../utils/color';
import { ColorPicker } from '../components/color/ColorPicker';

describe('Modern Color Picker & Color Math', () => {
  it('hexToRgba correctly parses 3, 6, and 8 digit hex strings', () => {
    expect(hexToRgba('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(hexToRgba('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(hexToRgba('#00ff0080')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
  });

  it('rgbaToHex formats opaque and translucent colors', () => {
    expect(rgbaToHex(255, 255, 255, 1).toLowerCase()).toBe('#ffffff');
    expect(rgbaToHex(255, 0, 0, 1).toLowerCase()).toBe('#ff0000');
    expect(rgbaToHex(0, 0, 0, 0.5).toLowerCase()).toBe('#00000080');
  });

  it('hsvToRgba and rgbaToHsv convert back and forth reliably', () => {
    const redHsv = rgbaToHsv(255, 0, 0, 1);
    expect(redHsv.h).toBe(0);
    expect(redHsv.s).toBe(100);
    expect(redHsv.v).toBe(100);

    const backToRgba = hsvToRgba(redHsv.h, redHsv.s, redHsv.v, redHsv.a);
    expect(backToRgba.r).toBe(255);
    expect(backToRgba.g).toBe(0);
    expect(backToRgba.b).toBe(0);
  });

  it('parseColor handles rgba() string and transparent', () => {
    expect(parseColor('rgba(100, 150, 200, 0.4)')).toEqual({ r: 100, g: 150, b: 200, a: 0.4 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('formatColor outputs hex when opaque and rgba when alpha < 1', () => {
    expect(formatColor({ r: 255, g: 0, b: 0, a: 1 }).toLowerCase()).toBe('#ff0000');
    expect(formatColor({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('ColorPicker renders swatch and opens popup on click', () => {
    const handleChange = vi.fn();
    render(
      <DocumentProvider>
        <ColorPicker label="Test Color" value="#3b82f6" onChange={handleChange} />
      </DocumentProvider>
    );

    // Swatch trigger exists
    const trigger = screen.getByTitle('Open Color Picker');
    expect(trigger).toBeDefined();

    // Click trigger to open picker popover
    fireEvent.click(trigger);

    // Color popover elements should appear
    expect(screen.getByText('Presets')).toBeDefined();
    expect(screen.getByText('HEX')).toBeDefined();

    // Verify popup rendered directly into document.body outside layer settings panel
    const dragHeader = screen.getByTitle('Drag to move color picker');
    const popup = dragHeader.parentElement;
    expect(popup?.parentElement).toBe(document.body);
    expect(popup?.style.position).toBe('fixed');
    expect(popup?.style.zIndex).toBe('9999');
  });
});

describe('Text Layer Inline Editing and Layer Reordering', () => {
  it('TextEditorOverlay commits text changes on blur and on unmount', () => {
    const handleCommit = vi.fn();
    const handleClose = vi.fn();
    const textObj: TextObject = createText(50, 50, 'Original Text');

    const { unmount } = render(
      <TextEditorOverlay
        object={textObj}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        onCommit={handleCommit}
        onClose={handleClose}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Original Text');

    // Type new text
    fireEvent.change(textarea, { target: { value: 'Updated Pixora Text' } });
    expect(textarea.value).toBe('Updated Pixora Text');

    // Unmount without explicit blur (e.g. clicking canvas)
    unmount();
    expect(handleCommit).toHaveBeenCalledWith('Updated Pixora Text');
  });

  it('CanvasObject hides SVG text element while editingTextId matches to prevent stacking', () => {
    const textObj: TextObject = createText(10, 10, 'Stacked Text Test');

    // When not editing, SVG text is rendered
    const { container: container1 } = render(
      <svg>
        <CanvasObject
          object={textObj}
          objects={{ [textObj.id]: textObj }}
          assets={{}}
          isSelected={false}
          isHovered={false}
          onSelect={vi.fn()}
          zoom={1}
          editingTextId={null}
        />
      </svg>
    );
    expect(container1.querySelector('text')).not.toBeNull();

    // When editing this text layer, CanvasObject returns null (no double-rendered text underneath)
    const { container: container2 } = render(
      <svg>
        <CanvasObject
          object={textObj}
          objects={{ [textObj.id]: textObj }}
          assets={{}}
          isSelected={true}
          isHovered={false}
          onSelect={vi.fn()}
          zoom={1}
          editingTextId={textObj.id}
        />
      </svg>
    );
    expect(container2.querySelector('text')).toBeNull();
  });

  it('editing a text layer in properties panel updates text and name simultaneously', () => {
    const textObj = createText(0, 0, 'Initial Content');
    let capturedDoc: any = null;

    const TestComponent = () => {
      const { document, updateObjectProperties } = useDocument();
      capturedDoc = document;
      return (
        <button
          onClick={() => {
            const newText = 'Brand New Title';
            updateObjectProperties(textObj.id, {
              name: newText,
              text: newText,
            });
          }}
        >
          Update Text Layer
        </button>
      );
    };

    render(
      <DocumentProvider
        initialDocument={{
          ...createDefaultProject(),
          objects: { [textObj.id]: textObj },
          pages: [{ id: 'p1', name: 'Page 1', childIds: [textObj.id] }],
        }}
      >
        <TestComponent />
      </DocumentProvider>
    );

    expect(capturedDoc.objects[textObj.id].text).toBe('Initial Content');
    fireEvent.click(screen.getByText('Update Text Layer'));
    expect(capturedDoc.objects[textObj.id].text).toBe('Brand New Title');
    expect(capturedDoc.objects[textObj.id].name).toBe('Brand New Title');
  });
});


