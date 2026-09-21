import { describe, it, expect } from 'vitest';
import { validatePixoraProject } from '../schema/validation';
import { createDefaultProject } from '../document/defaultProject';
import { serializePixoraDocument } from '../export/pixoraExporter';

describe('Project Schema & Serialization', () => {
  it('validates a standard Pixora document successfully', () => {
    const doc = createDefaultProject(undefined, 'Test Project');
    const result = validatePixoraProject(doc);
    expect(result.success).toBe(true);
    expect(result.document?.format).toBe('pixora');
    expect(result.document?.version).toBe(1);
    expect(result.document?.metadata.name).toBe('Test Project');
  });

  it('rejects invalid non-object input', () => {
    const result = validatePixoraProject('not-an-object');
    expect(result.success).toBe(false);
    expect(result.error).toContain('The file is not a valid JSON document');
  });

  it('rejects unrecognized file formats', () => {
    const result = validatePixoraProject({
      format: 'unknown_editor',
      version: 1,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('unrecognized (expected "pixora")');
  });

  it('rejects unsupported future versions gracefully', () => {
    const result = validatePixoraProject({
      format: 'pixora',
      version: 99,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('newer Pixora version (v99)');
  });

  it('correctly serializes and deserializes back into identical document', () => {
    const doc = createDefaultProject(undefined, 'Serialize Test');
    const serialized = serializePixoraDocument(doc);
    const parsed = JSON.parse(serialized);
    const validation = validatePixoraProject(parsed);

    expect(validation.success).toBe(true);
    expect(validation.document?.metadata.name).toBe('Serialize Test');
    expect(validation.document?.pages.length).toBe(doc.pages.length);
  });
});
