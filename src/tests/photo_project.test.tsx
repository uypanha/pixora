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
  });
});
