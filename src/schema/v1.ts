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

export const PixoraDocumentV1Schema = z.object({
  format: z.literal('pixora'),
  version: z.literal(1),
  metadata: DocumentMetadataSchema,
  settings: DocumentSettingsSchema,
  pages: z.array(PageSchema).min(1),
  objects: z.record(PixoraObjectSchema),
  assets: z.record(PixoraAssetSchema).default({}),
});

export type PixoraDocumentV1 = z.infer<typeof PixoraDocumentV1Schema>;
