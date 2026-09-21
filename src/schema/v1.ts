import { z } from 'zod';

export const ShadowEffectSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number().min(0),
  spread: z.number(),
  color: z.string(),
});

export const BaseObjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0.1),
  height: z.number().min(0.1),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  parentId: z.string().nullable().optional(),
});

export const FrameObjectSchema = BaseObjectSchema.extend({
  type: z.literal('frame'),
  childIds: z.array(z.string()).default([]),
  fill: z.string().default('#ffffff'),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  cornerRadius: z.number().min(0).optional(),
  clipContent: z.boolean().default(true),
  shadow: ShadowEffectSchema.optional(),
});

export const RectangleObjectSchema = BaseObjectSchema.extend({
  type: z.literal('rectangle'),
  fill: z.string().default('#6366f1'),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  cornerRadius: z.number().min(0).optional(),
  shadow: ShadowEffectSchema.optional(),
});

export const EllipseObjectSchema = BaseObjectSchema.extend({
  type: z.literal('ellipse'),
  fill: z.string().default('#38bdf8'),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  shadow: ShadowEffectSchema.optional(),
});

export const LineObjectSchema = BaseObjectSchema.extend({
  type: z.literal('line'),
  stroke: z.string().default('#ffffff'),
  strokeWidth: z.number().min(1).default(2),
  lineCap: z.enum(['butt', 'round', 'square']).default('round'),
  dashArray: z.string().optional(),
});

export const TextObjectSchema = BaseObjectSchema.extend({
  type: z.literal('text'),
  text: z.string().default('Text'),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().min(1).default(16),
  fontWeight: z.union([z.number(), z.string()]).default(400),
  lineHeight: z.number().min(0.1).default(1.4),
  letterSpacing: z.number().default(0),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  color: z.string().default('#ffffff'),
  shadow: ShadowEffectSchema.optional(),
});

export const ImageObjectSchema = BaseObjectSchema.extend({
  type: z.literal('image'),
  assetId: z.string(),
  fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  cornerRadius: z.number().min(0).optional(),
  shadow: ShadowEffectSchema.optional(),
});

export const GroupObjectSchema = BaseObjectSchema.extend({
  type: z.literal('group'),
  childIds: z.array(z.string()).default([]),
});

export const PixoraObjectSchema = z.discriminatedUnion('type', [
  FrameObjectSchema,
  RectangleObjectSchema,
  EllipseObjectSchema,
  LineObjectSchema,
  TextObjectSchema,
  ImageObjectSchema,
  GroupObjectSchema,
]);

export const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  childIds: z.array(z.string()).default([]),
  backgroundColor: z.string().optional(),
});

export const PixoraAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.string(),
  dataUrl: z.string(),
  width: z.number(),
  height: z.number(),
});

export const GridSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.number().min(1).default(10),
  snap: z.boolean().default(true),
});

export const DocumentSettingsSchema = z.object({
  grid: GridSettingsSchema.default({ enabled: true, size: 10, snap: true }),
  snapToObjects: z.boolean().default(true),
  canvasColor: z.string().default('#18191e'),
});

export const DocumentMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  thumbnail: z.string().optional(),
});

export const PhotoAdjustmentsSchema = z.object({
  exposure: z.number().default(0),
  brightness: z.number().default(0),
  contrast: z.number().default(0),
  highlights: z.number().default(0),
  shadows: z.number().default(0),
  whites: z.number().default(0),
  blacks: z.number().default(0),
  temperature: z.number().default(0),
  tint: z.number().default(0),
  saturation: z.number().default(0),
  vibrance: z.number().default(0),
  hue: z.number().default(0),
  sharpness: z.number().default(0),
  clarity: z.number().default(0),
});

export const PhotoFilterSchema = z.object({
  type: z
    .enum([
      'none',
      'vivid',
      'warm',
      'cool',
      'vintage',
      'bw',
      'fade',
      'cinematic',
      'matte',
      'soft',
    ])
    .default('none'),
  intensity: z.number().min(0).max(100).default(100),
});

export const PhotoEffectsSchema = z.object({
  vignette: z.number().min(0).max(100).default(0),
  grain: z.number().min(0).max(100).default(0),
  blur: z.number().min(0).max(100).default(0),
  glow: z.number().min(0).max(100).default(0),
  fade: z.number().min(0).max(100).default(0),
});

export const PhotoCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    aspectRatio: z.string().optional(),
  })
  .nullable();

export const PhotoTransformSchema = z.object({
  rotation: z.number().default(0),
  flipHorizontal: z.boolean().default(false),
  flipVertical: z.boolean().default(false),
});

export const PhotoDrawStrokeSchema = z.object({
  id: z.string(),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  color: z.string(),
  size: z.number(),
  opacity: z.number(),
  isEraser: z.boolean().optional(),
});

export const PhotoTextOverlaySchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().default(24),
  fontWeight: z.union([z.number(), z.string()]).default(600),
  color: z.string().default('#ffffff'),
  opacity: z.number().default(1),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  rotation: z.number().default(0),
});

export const PhotoRetouchSpotSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  radius: z.number(),
  mode: z.enum(['heal', 'clone']).default('heal'),
  sourceX: z.number().optional(),
  sourceY: z.number().optional(),
});

export const PhotoProjectStateSchema = z.object({
  sourceAssetId: z.string(),
  adjustments: PhotoAdjustmentsSchema.default({}),
  filter: PhotoFilterSchema.default({ type: 'none', intensity: 100 }),
  effects: PhotoEffectsSchema.default({}),
  crop: PhotoCropSchema.optional(),
  transform: PhotoTransformSchema.default({ rotation: 0, flipHorizontal: false, flipVertical: false }),
  drawing: z.array(PhotoDrawStrokeSchema).default([]),
  texts: z.array(PhotoTextOverlaySchema).default([]),
  retouch: z.array(PhotoRetouchSpotSchema).default([]),
});

export const PixoraDocumentV1Schema = z.object({
  format: z.literal('pixora'),
  version: z.union([z.literal(1), z.literal(2)]).default(1),
  projectType: z.enum(['canvas', 'photo']).default('canvas'),
  metadata: DocumentMetadataSchema,
  settings: DocumentSettingsSchema,
  pages: z.array(PageSchema).default([]),
  objects: z.record(PixoraObjectSchema).default({}),
  assets: z.record(PixoraAssetSchema).default({}),
  photo: PhotoProjectStateSchema.optional(),
});

export type PixoraDocumentV1 = z.infer<typeof PixoraDocumentV1Schema>;
