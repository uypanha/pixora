import { PixoraDocument, FrameObject, RectangleObject, TextObject, EllipseObject } from '../types/document';
import { ProjectPreset } from '../types/preset';
import { generateId } from '../utils/id';

export function createDefaultProject(
  preset?: ProjectPreset,
  name: string = 'Untitled Project'
): PixoraDocument {
  const pageId = generateId('page');
  const now = new Date().toISOString();

  let childIds: string[] = [];
  const objects: PixoraDocument['objects'] = {};

  if (preset && preset.width > 0 && preset.height > 0) {
    const frameId = generateId('frame');
    const frame: FrameObject = {
      id: frameId,
      name: preset.name,
      type: 'frame',
      x: 100,
      y: 100,
      width: preset.width,
      height: preset.height,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: '#ffffff',
      stroke: '#2c2f38',
      strokeWidth: 1,
      cornerRadius: preset.category === 'mobile' ? 36 : 8,
      clipContent: true,
      shadow: {
        x: 0,
        y: 8,
        blur: 24,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.4)',
      },
      childIds: [],
    };
    objects[frameId] = frame;
    childIds = [frameId];
  }

  return {
    format: 'pixora',
    version: 1,
    projectType: 'canvas',
    metadata: {
      id: generateId('proj'),
      name,
      createdAt: now,
      updatedAt: now,
    },
    settings: {
      grid: {
        enabled: true,
        size: 10,
        snap: true,
      },
      snapToObjects: true,
      canvasColor: '#121316',
    },
    pages: [
      {
        id: pageId,
        name: 'Page 1',
        childIds,
      },
    ],
    objects,
    assets: {},
  };
}

/**
 * Generates an inspiring, modern sample project demonstrating Pixora's capabilities
 */
export function createSampleProject(): PixoraDocument {
  const pageId = generateId('page');
  const now = new Date().toISOString();

  const frameId = generateId('frame');
  const heroCardId = generateId('rect');
  const titleId = generateId('text');
  const subtitleId = generateId('text');
  const badgeId = generateId('rect');
  const badgeTextId = generateId('text');
  const avatarId = generateId('ellipse');
  const buttonId = generateId('rect');
  const buttonTextId = generateId('text');

  const frame: FrameObject = {
    id: frameId,
    name: 'Mobile App Concept',
    type: 'frame',
    x: 200,
    y: 80,
    width: 390,
    height: 844,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#0f1015',
    stroke: '#272a34',
    strokeWidth: 2,
    cornerRadius: 40,
    clipContent: true,
    shadow: {
      x: 0,
      y: 20,
      blur: 40,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.6)',
    },
    childIds: [badgeId, badgeTextId, avatarId, heroCardId, titleId, subtitleId, buttonId, buttonTextId],
  };

  const badge: RectangleObject = {
    id: badgeId,
    parentId: frameId,
    name: 'Status Pill',
    type: 'rectangle',
    x: 232,
    y: 130,
    width: 100,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: 'rgba(99, 102, 241, 0.15)',
    stroke: '#6366f1',
    strokeWidth: 1,
    cornerRadius: 14,
  };

  const badgeText: TextObject = {
    id: badgeTextId,
    parentId: frameId,
    name: 'Status Label',
    type: 'text',
    x: 244,
    y: 136,
    width: 80,
    height: 18,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text: 'Local-First',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textAlign: 'left',
    color: '#818cf8',
  };

  const avatar: EllipseObject = {
    id: avatarId,
    parentId: frameId,
    name: 'User Avatar',
    type: 'ellipse',
    x: 520,
    y: 124,
    width: 42,
    height: 42,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#38bdf8',
    stroke: '#0f1015',
    strokeWidth: 2,
  };

  const heroCard: RectangleObject = {
    id: heroCardId,
    parentId: frameId,
    name: 'Hero Card',
    type: 'rectangle',
    x: 232,
    y: 180,
    width: 326,
    height: 240,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#1c1e26',
    stroke: '#2e323e',
    strokeWidth: 1,
    cornerRadius: 24,
    shadow: {
      x: 0,
      y: 12,
      blur: 24,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.35)',
    },
  };

  const title: TextObject = {
    id: titleId,
    parentId: frameId,
    name: 'Card Title',
    type: 'text',
    x: 256,
    y: 210,
    width: 278,
    height: 60,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text: 'Design freely.\nNo accounts needed.',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: -0.5,
    textAlign: 'left',
    color: '#ffffff',
  };

  const subtitle: TextObject = {
    id: subtitleId,
    parentId: frameId,
    name: 'Card Description',
    type: 'text',
    x: 256,
    y: 284,
    width: 278,
    height: 48,
    rotation: 0,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: 'Everything is stored directly in your browser or exported to your device as .pixora files.',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#9ca3af',
  };

  const button: RectangleObject = {
    id: buttonId,
    parentId: frameId,
    name: 'Primary Button',
    type: 'rectangle',
    x: 256,
    y: 350,
    width: 150,
    height: 44,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    fill: '#6366f1',
    cornerRadius: 12,
    shadow: {
      x: 0,
      y: 4,
      blur: 12,
      spread: 0,
      color: 'rgba(99, 102, 241, 0.4)',
    },
  };

  const buttonText: TextObject = {
    id: buttonTextId,
    parentId: frameId,
    name: 'Button Label',
    type: 'text',
    x: 286,
    y: 362,
    width: 90,
    height: 20,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text: 'Get Started',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  };

  const objects: PixoraDocument['objects'] = {
    [frameId]: frame,
    [badgeId]: badge,
    [badgeTextId]: badgeText,
    [avatarId]: avatar,
    [heroCardId]: heroCard,
    [titleId]: title,
    [subtitleId]: subtitle,
    [buttonId]: button,
    [buttonTextId]: buttonText,
  };

  return {
    format: 'pixora',
    version: 1,
    projectType: 'canvas',
    metadata: {
      id: generateId('proj'),
      name: 'Mobile App Concept',
      createdAt: now,
      updatedAt: now,
    },
    settings: {
      grid: {
        enabled: true,
        size: 10,
        snap: true,
      },
      snapToObjects: true,
      canvasColor: '#121316',
    },
    pages: [
      {
        id: pageId,
        name: 'Design',
        childIds: [frameId],
      },
    ],
    objects,
    assets: {},
  };
}
