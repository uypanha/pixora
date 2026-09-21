import { PixoraDocumentV1Schema } from './v1';
import { PixoraDocument } from '../types/document';
import { migrateProject } from './migration';

export interface ValidationResult {
  success: boolean;
  document?: PixoraDocument;
  error?: string;
}

export function validatePixoraProject(json: unknown): ValidationResult {
  if (typeof json !== 'object' || json === null) {
    return {
      success: false,
      error: 'Unable to open this project.\nThe file is not a valid JSON document.',
    };
  }

  const raw = json as Record<string, unknown>;

  if (raw.format !== 'pixora') {
    return {
      success: false,
      error: 'Unable to open this project.\nThe file format is unrecognized (expected "pixora").',
    };
  }

  if (typeof raw.version !== 'number') {
    return {
      success: false,
      error: 'Unable to open this project.\nThe file is missing a valid project version number.',
    };
  }

  // Handle migrations if version is older or newer
  let dataToValidate: unknown = raw;
  if (raw.version < 1) {
    return {
      success: false,
      error: 'Unable to open this project.\nThe project was created with an unsupported legacy version.',
    };
  }

  if (raw.version > 1) {
    // Unsupported future version
    return {
      success: false,
      error: `Unable to open this project.\nThe file was created by a newer Pixora version (v${raw.version}). Please update Pixora.`,
    };
  }

  // Run migration pipeline if needed
  dataToValidate = migrateProject(raw);

  // Validate against v1 schema
  const result = PixoraDocumentV1Schema.safeParse(dataToValidate);
  if (!result.success) {
    const errorDetails = result.error.errors
      .slice(0, 3)
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return {
      success: false,
      error: `Unable to open this project.\nThe file may be corrupted or created by an unsupported Pixora version.\n(${errorDetails})`,
    };
  }

  return {
    success: true,
    document: result.data as PixoraDocument,
  };
}
