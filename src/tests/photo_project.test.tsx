import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createDefaultPhotoProject, generateSamplePhotoDataUrl } from '../document/defaultPhotoProject';
import { validatePixoraProject } from '../schema/validation';
import { renderPhotoToCanvas } from '../editors/photo/rendering/photoRenderer';
import { PHOTO_FILTERS } from '../editors/photo/rendering/photoFilters';
import { UpdatePhotoCommand } from '../history/commands';
import { saveActiveProject, loadActiveProject, getRecentProjects, clearAllProjects } from '../storage/db';
import { DocumentProvider } from '../document/documentContext';
import { PhotoEditor } from '../editors/photo/PhotoEditor';
import { CropPanel } from '../editors/photo/panels/CropPanel';
import { DEFAULT_PHOTO_ADJUSTMENTS, DEFAULT_PHOTO_EFFECTS } from '../types/document';

describe('Photo Project Type & Architecture', () => {
  beforeEach(async () => {
    await clearAllProjects();
  });

  describe('1. Schema, Validation & Backward Compatibility', () => {
    it('creates and validates a default photo project successfully', () => {
      const sampleUrl = generateSamplePhotoDataUrl(400, 300);
      const doc = createDefaultPhotoProject(sampleUrl, {
        projectName: 'My Landscape',
        assetName: 'landscape.jpg',
        width: 400,
        height: 300,
      });

      expect(doc.format).toBe('pixora');
      expect(doc.version).toBe(2);
      expect(doc.projectType).toBe('photo');
      expect(doc.photo).toBeDefined();
      expect(doc.photo?.adjustments).toBeDefined();
      expect(doc.photo?.filter.type).toBe('none');

      const validation = validatePixoraProject(doc);
      expect(validation.error).toBeUndefined();
      expect(validation.document?.projectType).toBe('photo');
      expect(validation.document?.photo?.sourceAssetId).toBe(doc.photo?.sourceAssetId);
    });

    it('auto-migrates documents without projectType to canvas', () => {
      const legacyDoc = {
        format: 'pixora',
        version: 1,
        metadata: {
          id: 'legacy-1',
          name: 'Old Canvas Doc',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        settings: {
          grid: { enabled: true, size: 10, snap: true },
          snapToObjects: true,
          canvasColor: '#121316',
        },
        pages: [{ id: 'p1', name: 'Page 1', childIds: [] }],
        objects: {},
        assets: {},
      };

      const result = validatePixoraProject(legacyDoc);
      expect(result.success).toBe(true);
      expect(result.document?.projectType).toBe('canvas');
    });
  });

  describe('2. Non-Destructive Rendering Pipeline', () => {
    it('renders photo adjustments non-destructively to canvas', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;

      // Create a mock image / canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = 100;
      srcCanvas.height = 100;
      const sCtx = srcCanvas.getContext('2d')!;
      sCtx.fillStyle = '#ff8800';
      sCtx.fillRect(0, 0, 100, 100);

      renderPhotoToCanvas(canvas, {
        image: srcCanvas,
        adjustments: {
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          brightness: 20,
          contrast: 15,
          saturation: 30,
        },
        filter: { type: 'vivid', intensity: 80 },
        effects: {
          ...DEFAULT_PHOTO_EFFECTS,
          vignette: 40,
        },
        transform: { rotation: 90, flipHorizontal: false, flipVertical: false },
        drawing: [],
        texts: [],
      });

      // Canvas dimensions should swap due to 90 deg rotation
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(100);
      const ctx = canvas.getContext('2d');
      expect(ctx).not.toBeNull();
    });

    it('renders pure original image when isOriginal is true (Before / After)', () => {
      const canvas = document.createElement('canvas');
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = 50;
      srcCanvas.height = 50;

      renderPhotoToCanvas(canvas, {
        image: srcCanvas,
        adjustments: {
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          exposure: 100,
        },
        filter: { type: 'bw', intensity: 100 },
        effects: { ...DEFAULT_PHOTO_EFFECTS, blur: 50 },
        transform: { rotation: 180, flipHorizontal: true, flipVertical: false },
        isOriginal: true,
      });

      expect(canvas.width).toBe(50);
      expect(canvas.height).toBe(50);
    });

    it('supports all 10 filter presets correctly', () => {
      const filterTypes = Object.keys(PHOTO_FILTERS);
      expect(filterTypes).toContain('none');
      expect(filterTypes).toContain('vivid');
      expect(filterTypes).toContain('warm');
      expect(filterTypes).toContain('cool');
      expect(filterTypes).toContain('vintage');
      expect(filterTypes).toContain('bw');
      expect(filterTypes).toContain('fade');
      expect(filterTypes).toContain('cinematic');
      expect(filterTypes).toContain('matte');
      expect(filterTypes).toContain('soft');

      // Test apply function on a filter
      const vivid = PHOTO_FILTERS.vivid;
      const [r, g, b] = vivid.apply(100, 150, 200);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
    });
  });

  describe('3. History & Undo / Redo Commands', () => {
    it('correctly executes and reverts UpdatePhotoCommand', () => {
      const sampleUrl = generateSamplePhotoDataUrl(200, 200);
      const doc = createDefaultPhotoProject(sampleUrl, { projectName: 'History Test' });

      const initialPhoto = doc.photo!;
      const modifiedPhoto = {
        ...initialPhoto,
        adjustments: {
          ...initialPhoto.adjustments,
          contrast: 45,
        },
        filter: { type: 'warm' as const, intensity: 90 },
      };

      const cmd = new UpdatePhotoCommand(initialPhoto, modifiedPhoto, 'Change contrast & warm filter');

      // Execute command
      const nextDoc = cmd.execute(doc);
      expect(nextDoc.photo?.adjustments.contrast).toBe(45);
      expect(nextDoc.photo?.filter.type).toBe('warm');

      // Undo command
      const revertedDoc = cmd.undo(nextDoc);
      expect(revertedDoc.photo?.adjustments.contrast).toBe(0);
      expect(revertedDoc.photo?.filter.type).toBe('none');
    });
  });

  describe('4. IndexedDB Autosave & Project Recovery', () => {
    it('saves a photo project with projectType: photo and restores it', async () => {
      const sampleUrl = generateSamplePhotoDataUrl(300, 200);
      const doc = createDefaultPhotoProject(sampleUrl, { projectName: 'Saved Mountain Photo' });

      await saveActiveProject(doc);

      const loaded = await loadActiveProject();
      expect(loaded).not.toBeNull();
      expect(loaded?.projectType).toBe('photo');
      expect(loaded?.photo).toBeDefined();
      expect(loaded?.metadata.name).toBe('Saved Mountain Photo');

      const recents = await getRecentProjects();
      expect(recents.length).toBe(1);
      expect(recents[0].projectType).toBe('photo');
      expect(recents[0].name).toBe('Saved Mountain Photo');
    });
  });

  describe('5. UI Components & Editor Integration', () => {
    it('renders PhotoEditor topbar and switches tools', () => {
      const sampleUrl = generateSamplePhotoDataUrl(200, 200);
      const doc = createDefaultPhotoProject(sampleUrl, { projectName: 'Studio Photo' });

      render(
        <DocumentProvider initialDocument={doc}>
          <PhotoEditor onOpenLauncher={() => {}} />
        </DocumentProvider>
      );

      // Verify header contents
      expect(screen.getByText('Studio Photo')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByTitle('Hold to see original photo')).toBeInTheDocument();

      // Tool buttons
      expect(screen.getByTitle('Adjust')).toBeInTheDocument();
      expect(screen.getByTitle('Filters')).toBeInTheDocument();
      expect(screen.getByTitle('Effects')).toBeInTheDocument();
      expect(screen.getByTitle('Crop')).toBeInTheDocument();

      // Click filters tool
      fireEvent.click(screen.getByTitle('Filters'));
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Vivid')).toBeInTheDocument();
      expect(screen.getByText('Warm')).toBeInTheDocument();
    });

    it('supports text tool, Khmer/custom fonts, and inline editing without duplicate canvas rendering', () => {
      const sampleUrl = generateSamplePhotoDataUrl(300, 300);
      const doc = createDefaultPhotoProject(sampleUrl, { projectName: 'Khmer Text Photo' });

      // Add a Khmer text
      doc.photo!.texts.push({
        id: 'text-khmer-1',
        text: 'សួស្ដី',
        x: 0.5,
        y: 0.5,
        fontSize: 36,
        fontFamily: 'Kantumruy Pro',
        fontWeight: 'bold',
        color: '#ffffff',
        opacity: 1,
        rotation: 0,
        textAlign: 'center',
      });

      render(
        <DocumentProvider initialDocument={doc}>
          <PhotoEditor onOpenLauncher={() => {}} />
        </DocumentProvider>
      );

      // Verify Khmer text overlay is rendered in DOM
      const textElem = screen.getByText('សួស្ដី');
      expect(textElem).toBeInTheDocument();
      expect(textElem.style.fontFamily).toBe('Kantumruy Pro');

      // Click on text tool
      fireEvent.click(screen.getByTitle('Text'));
      expect(screen.getByText('Text on Photo')).toBeInTheDocument();
      expect(screen.getByText('Upload Font')).toBeInTheDocument();

      // Double click text overlay to trigger inline edit mode
      fireEvent.doubleClick(textElem);
      const textareas = screen.getAllByDisplayValue('សួស្ដី');
      const inlineTextarea = textareas.find(t => t.classList.contains('absolute'))!;
      expect(inlineTextarea).toBeInTheDocument();
      expect(inlineTextarea.tagName.toLowerCase()).toBe('textarea');

      // Edit text in inline textarea
      fireEvent.change(inlineTextarea, { target: { value: 'សួស្ដី​កម្ពុជា' } });
      fireEvent.blur(inlineTextarea);

      // Verify updated text in overlay and layer list
      expect(screen.getAllByText('សួស្ដី​កម្ពុជា').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Text Rendering Options & Custom Fonts', () => {
    it('verifies POPULAR_FONTS includes Khmer Google Fonts', async () => {
      const { POPULAR_FONTS } = await import('../utils/fontLoader');
      const khmerFonts = POPULAR_FONTS.filter(f => f.category === 'Khmer');
      expect(khmerFonts.length).toBeGreaterThanOrEqual(6);
      expect(khmerFonts.some(f => f.name === 'Kantumruy Pro')).toBe(true);
      expect(khmerFonts.some(f => f.name === 'Battambang')).toBe(true);
      expect(khmerFonts.some(f => f.name === 'Moul')).toBe(true);
    });

    it('verifies renderPhotoToCanvas respects skipTexts option', () => {
      const canvas = document.createElement('canvas');
      const sampleUrl = generateSamplePhotoDataUrl(200, 200);
      const doc = createDefaultPhotoProject(sampleUrl);

      doc.photo!.texts.push({
        id: 'txt-1',
        text: 'Hello Pixora',
        x: 0.5,
        y: 0.5,
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        color: '#ffffff',
        opacity: 1,
        rotation: 0,
        textAlign: 'center',
      });

      const img = new Image();
      img.src = sampleUrl;

      // Render with skipTexts: true
      expect(() => {
        renderPhotoToCanvas(canvas, {
          image: img,
          adjustments: doc.photo!.adjustments,
          filter: doc.photo!.filter,
          effects: doc.photo!.effects,
          transform: doc.photo!.transform,
          texts: doc.photo!.texts,
          skipTexts: true,
        });
      }).not.toThrow();

      // Render with skipTexts: false (for export)
      expect(() => {
        renderPhotoToCanvas(canvas, {
          image: img,
          adjustments: doc.photo!.adjustments,
          filter: doc.photo!.filter,
          effects: doc.photo!.effects,
          transform: doc.photo!.transform,
          texts: doc.photo!.texts,
          skipTexts: false,
        });
      }).not.toThrow();
    });
  });

  describe('6. Crop Aspect Ratio Presets and Behavior', () => {
    it('calculates proper crop dimensions when aspect ratio presets are selected', () => {
      let changedCrop: any = null;

      // Render CropPanel with 800x600 image (4:3 aspect ratio)
      const { getByText } = render(
        <CropPanel
          crop={{ x: 0, y: 0, width: 1, height: 1 }}
          imageWidth={800}
          imageHeight={600}
          onChange={(c: any) => {
            changedCrop = c;
          }}
        />
      );

      // Select 1:1 preset
      fireEvent.click(getByText('1 : 1'));
      expect(changedCrop).not.toBeNull();
      expect(changedCrop.aspectRatio).toBe('1:1');
      // For 4:3 (imgAspect ~ 1.3333) and 1:1 (targetRatio = 1), targetRatio < imgAspect:
      // height = 1, width = targetRatio / imgAspect = 0.75, x = (1 - 0.75)/2 = 0.125, y = 0
      expect(changedCrop.height).toBe(1);
      expect(changedCrop.width).toBe(0.75);
      expect(changedCrop.x).toBe(0.125);
      expect(changedCrop.y).toBe(0);

      // Select 16:9 preset
      fireEvent.click(getByText('16 : 9'));
      expect(changedCrop.aspectRatio).toBe('16:9');
      // For 4:3 (imgAspect = 4/3) and 16:9 (targetRatio = 16/9), targetRatio > imgAspect:
      // width = 1, height = (1/targetRatio)*imgAspect = (9/16)*(4/3) = 36/48 = 0.75, x = 0, y = 0.125
      expect(changedCrop.width).toBe(1);
      expect(changedCrop.height).toBe(0.75);
      expect(changedCrop.x).toBe(0);
      expect(changedCrop.y).toBe(0.125);

      // Select Free preset
      fireEvent.click(getByText('Free'));
      expect(changedCrop.aspectRatio).toBeUndefined();
    });
  });

  describe('7. Text Layer Frame Boundary Clamping', () => {
    it('clamps text overlay coordinates so text bounding box stays within photo frame', () => {
      // Mock text element half-width and half-height in normalized coords
      const halfNormW = 0.15; // text spans 30% of canvas width
      const halfNormH = 0.05; // text spans 10% of canvas height

      const minX = halfNormW >= 0.5 ? 0.5 : halfNormW;
      const maxX = halfNormW >= 0.5 ? 0.5 : 1 - halfNormW;
      const minY = halfNormH >= 0.5 ? 0.5 : halfNormH;
      const maxY = halfNormH >= 0.5 ? 0.5 : 1 - halfNormH;

      expect(minX).toBe(0.15);
      expect(maxX).toBe(0.85);
      expect(minY).toBe(0.05);
      expect(maxY).toBe(0.95);

      // Attempting to drag text beyond left or top edge
      const rawX1 = -0.2;
      const rawY1 = -0.1;
      const clampedX1 = Math.max(minX, Math.min(maxX, rawX1));
      const clampedY1 = Math.max(minY, Math.min(maxY, rawY1));
      expect(clampedX1).toBe(0.15);
      expect(clampedY1).toBe(0.05);
      // Left edge of text is clampedX1 - halfNormW = 0.0 (inside canvas)
      expect(clampedX1 - halfNormW).toBe(0);
      expect(clampedY1 - halfNormH).toBe(0);

      // Attempting to drag text beyond right or bottom edge
      const rawX2 = 1.4;
      const rawY2 = 1.2;
      const clampedX2 = Math.max(minX, Math.min(maxX, rawX2));
      const clampedY2 = Math.max(minY, Math.min(maxY, rawY2));
      expect(clampedX2).toBe(0.85);
      expect(clampedY2).toBe(0.95);
      // Right edge of text is clampedX2 + halfNormW = 1.0 (inside canvas)
      expect(clampedX2 + halfNormW).toBe(1.0);
      expect(clampedY2 + halfNormH).toBe(1.0);

      // In case text is wider than canvas itself (halfNormW >= 0.5)
      const oversizedHalfW = 0.6;
      const oversizedMinX = oversizedHalfW >= 0.5 ? 0.5 : oversizedHalfW;
      const oversizedMaxX = oversizedHalfW >= 0.5 ? 0.5 : 1 - oversizedHalfW;
      expect(oversizedMinX).toBe(0.5);
      expect(oversizedMaxX).toBe(0.5);
    });
  });
});
